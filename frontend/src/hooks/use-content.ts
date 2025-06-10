'use client';

import { useState, useEffect, useCallback } from 'react';
import { ContentItem, ContentType, User, Status, ContentPage } from '@/types/content';
import { 
  fetchUserContent, 
  createContent, 
  fetchContentById, 
  updateContent as updateContentApi, 
  deleteContent, 
  ContentApiError,
  CreateContentRequest,
  UpdateContentRequest 
} from '@/lib/api/content';
import { useUser } from './use-user'; // Use existing UserContext instead of direct API calls

// Persistent cache across component mounts for instant UX
const persistentCache = {
  content: [] as ContentItem[],
  lastFetch: 0,
  pages: new Map<string, ContentPage>(),
};

// Cache timeout (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

/**
 * Integrates with backend API and uses existing UserContext for authentication
 * No duplicate user API calls - reuses UserContext
 */
export function useContent() {
  // Use existing UserContext instead of managing user state separately
  const { user: contextUser, isAuthenticated, isLoading: userLoading } = useUser();
  
  // Initialize with cached data for instant display
  const [content, setContent] = useState<ContentItem[]>(persistentCache.content);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Convert UserContext user to Content user format
  const getCurrentUser = useCallback((): User | null => {
    if (!contextUser || !isAuthenticated) {
      return null;
    }
    
    // Transform UserContext User to content User format
    return {
      id: contextUser.id,
      name: contextUser.name,
      image: contextUser.image,
    };
  }, [contextUser, isAuthenticated]);

  // Check if cache is fresh
  const isCacheFresh = useCallback(() => {
    return Date.now() - persistentCache.lastFetch < CACHE_TIMEOUT;
  }, []);

  // Background refresh function
  const refreshContentInBackground = useCallback(async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      setIsRefreshing(true);
      const contentItems = await fetchUserContent();
      
      // Update cache and state
      persistentCache.content = contentItems;
      persistentCache.lastFetch = Date.now();
      setContent(contentItems);
      setStatus('success');
    } catch (error) {
      console.error('[useContent] Background refresh failed:', error);
      // Don't show error for background refresh
    } finally {
      setIsRefreshing(false);
    }
  }, [getCurrentUser]);

  // Fetch content from backend with instant cache display
  const fetchContent = useCallback(async () => {
    // Wait for user authentication to complete
    if (userLoading) {
      setStatus('loading');
      return;
    }

    const user = getCurrentUser();
    if (!user) {
      setStatus('error');
      setError('Authentication required');
      return;
    }

    // If we have fresh cache, show it immediately
    if (isCacheFresh() && persistentCache.content.length > 0) {
      setStatus('success');
      return;
    }

    // Only show loading if we have no cached data
    if (persistentCache.content.length === 0) {
      setStatus('loading');
    }

    setError(null);

    try {
      console.log('[useContent] Fetching user content');
      const contentItems = await fetchUserContent();
      
      // Update cache and state
      persistentCache.content = contentItems;
      persistentCache.lastFetch = Date.now();
      setContent(contentItems);
      setStatus('success');
      console.log('[useContent] Successfully fetched', contentItems.length, 'content items');
    } catch (error) {
      console.error('[useContent] Error fetching content:', error);
      
      if (error instanceof ContentApiError) {
        if (error.status === 401) {
          setError('Authentication expired. Please log in again.');
        } else if (error.status === 403) {
          setError('Access denied. You do not have permission to view this content.');
        } else {
          setError(`Failed to load content: ${error.message}`);
        }
      } else {
        setError('Failed to load content. Please check your connection and try again.');
      }
      setStatus('error');
    }
  }, [getCurrentUser, isCacheFresh, userLoading]);

  // Load content when user authentication is ready
  useEffect(() => {
    if (!userLoading) {
      console.log('[useContent] User loading completed, fetching content...');
      fetchContent();
    }
  }, [fetchContent, userLoading]);

  // Background refresh when cache is stale
  useEffect(() => {
    if (!isCacheFresh() && status === 'success' && !userLoading) {
      console.log('[useContent] Cache is stale, refreshing in background...');
      refreshContentInBackground();
    }
  }, [isCacheFresh, status, refreshContentInBackground, userLoading]);

  // Add new content item with optimistic updates
  const addContent = useCallback(async (newItem: {
    name: string;
    type: ContentType;
    startAt: Date;
    column: string;
    owner: User;
    endAt?: Date;
    description?: string;
    tags?: string[];
    url?: string;
  }): Promise<{ status: 'success' | 'error'; data?: ContentItem[]; id?: string; error?: string }> => {
    const user = getCurrentUser();
    if (!user) {
      return { 
        status: 'error', 
        error: 'Authentication required' 
      };
    }

    try {
      // Create optimistic item for instant UI feedback
      const optimisticId = `temp-${Date.now()}`;
      const optimisticItem: ContentItem = {
        id: optimisticId,
        name: newItem.name,
        type: newItem.type,
        startAt: newItem.startAt,
        endAt: newItem.endAt,
        column: newItem.column,
        owner: newItem.owner,
        description: newItem.description,
        tags: newItem.tags,
        url: newItem.url,
        progress: 0,
        priority: 'medium',
      };

      // Add optimistically to UI immediately
      const optimisticContent = [...content, optimisticItem];
      setContent(optimisticContent);
      persistentCache.content = optimisticContent;

      // Create request for backend
      const createRequest: CreateContentRequest = {
        title: newItem.name,
        type: newItem.type,
        url: newItem.url,
        description: newItem.description,
        tags: newItem.tags,
        status: newItem.column === 'planned' ? 'planned' : 
                newItem.column === 'done' ? 'completed' : 'in_progress',
        priority: 'medium'
      };

      console.log('[useContent] Creating new content:', createRequest);
      const result = await createContent(createRequest);
      
      // Replace optimistic item with real one
      const finalContent = optimisticContent.map(item => 
        item.id === optimisticId ? result.content : item
      );
      setContent(finalContent);
      persistentCache.content = finalContent;
      
      // Cache the content page
      persistentCache.pages.set(result.id, result.contentPage);
      
      console.log('[useContent] Successfully created content with ID:', result.id);
      return { 
        status: 'success', 
        data: finalContent, 
        id: result.id 
      };
    } catch (error) {
      console.error('[useContent] Error adding content:', error);
      
      // Revert optimistic update on error
      setContent(content);
      persistentCache.content = content;
      
      let errorMessage = 'Failed to create content';
      if (error instanceof ContentApiError) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      return { 
        status: 'error', 
        error: errorMessage 
      };
    }
  }, [content, getCurrentUser]);

  // Get content page by ID with caching
  const getContentPage = useCallback(async (id: string): Promise<ContentPage | null> => {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    try {
      // Check cache first
      const cached = persistentCache.pages.get(id);
      if (cached) {
        console.log('[useContent] Returning cached content page for ID:', id);
        return cached;
      }

      console.log('[useContent] Fetching content page for ID:', id);
      const contentPage = await fetchContentById(id);
      
      if (contentPage) {
        // Update cache
        persistentCache.pages.set(id, contentPage);
        console.log('[useContent] Cached content page for ID:', id);
      }
      
      return contentPage;
    } catch (error) {
      console.error('[useContent] Error fetching content page:', error);
      
      if (error instanceof ContentApiError && error.status === 404) {
        return null;
      }
      
      throw error;
    }
  }, [getCurrentUser]);

  // Update content page
  const updateContentPage = useCallback(async (
    id: string, 
    updates: Partial<ContentPage>
  ): Promise<boolean> => {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    try {
      // Transform frontend updates to API format
      const updateRequest: UpdateContentRequest = {
        title: updates.title,
        type: updates.type,
        url: updates.url,
        description: updates.summary,
        tags: updates.tags,
        status: updates.status,
        priority: updates.priority,
        progress: updates.progress,
        content: updates.content,
        summary: updates.summary,
        keyTakeaways: updates.keyTakeaways,
      };

      // Remove undefined values
      Object.keys(updateRequest).forEach(key => {
        if (updateRequest[key as keyof UpdateContentRequest] === undefined) {
          delete updateRequest[key as keyof UpdateContentRequest];
        }
      });

      console.log('[useContent] Updating content page:', id, updateRequest);
      const updatedPage = await updateContentApi(id, updateRequest);
      
      // Update cache
      persistentCache.pages.set(id, updatedPage);
      
      // Update content list if the item exists there
      const contentIndex = content.findIndex(item => item.id === id);
      if (contentIndex >= 0) {
        const updatedContent = [...content];
        updatedContent[contentIndex] = {
          ...updatedContent[contentIndex],
          name: updatedPage.title,
          type: updatedPage.type,
          url: updatedPage.url,
          tags: updatedPage.tags,
          column: updatedPage.status === 'planned' ? 'planned' : 
                  updatedPage.status === 'completed' ? 'done' : 'in_progress',
          priority: updatedPage.priority,
          progress: updatedPage.progress,
        };
        setContent(updatedContent);
        persistentCache.content = updatedContent;
      }
      
      console.log('[useContent] Successfully updated content page:', id);
      return true;
    } catch (error) {
      console.error('[useContent] Error updating content page:', error);
      return false;
    }
  }, [content, getCurrentUser]);

  // Update content items (for kanban operations)
  const updateContent = useCallback(async (updatedContent: ContentItem[]): Promise<{ status: Status }> => {
    const user = getCurrentUser();
    if (!user) {
      return { status: 'error' };
    }

    setStatus('loading');
    
    try {
      // Find what changed and update on backend
      const updatePromises = updatedContent.map(async (item) => {
        const originalItem = content.find(c => c.id === item.id);
        if (!originalItem) return;

        // Check if status changed
        if (originalItem.column !== item.column) {
          const newStatus = item.column === 'planned' ? 'planned' : 
                           item.column === 'done' ? 'completed' : 'in_progress';
          
          console.log('[useContent] Updating content status:', item.id, newStatus);
          await updateContentApi(item.id, { status: newStatus });
        }
      });

      await Promise.all(updatePromises);
      
      setContent(updatedContent);
      persistentCache.content = updatedContent;
      setStatus('success');
      
      return { status: 'success' };
    } catch (error) {
      console.error('[useContent] Error updating content:', error);
      setError('Failed to update content');
      setStatus('error');
      return { status: 'error' };
    }
  }, [content, getCurrentUser]);

  // Remove content item
  const removeContent = useCallback(async (id: string) => {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Authentication required');
    }

    setStatus('loading');
    
    try {
      console.log('[useContent] Deleting content:', id);
      await deleteContent(id);
      
      // Update local state
      const newContent = content.filter(item => item.id !== id);
      setContent(newContent);
      persistentCache.content = newContent;
      
      // Clear cache
      persistentCache.pages.delete(id);
      
      setStatus('success');
      console.log('[useContent] Successfully deleted content:', id);
      return { status: 'success' as Status, data: newContent };
    } catch (error) {
      console.error('[useContent] Error removing content:', error);
      
      let errorMessage = 'Failed to delete content';
      if (error instanceof ContentApiError) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setStatus('error');
      return { status: 'error' as Status, error: errorMessage };
    }
  }, [content, getCurrentUser]);

  // Refresh content from server
  const refreshContent = useCallback(() => {
    console.log('[useContent] Refreshing content from server...');
    // Clear cache
    persistentCache.pages.clear();
    persistentCache.lastFetch = 0;
    
    // Fetch fresh data
    return fetchContent();
  }, [fetchContent]);

  return {
    content,
    status,
    error,
    currentUser: getCurrentUser(), // Return current user synchronously
    isRefreshing,
    updateContent,
    addContent,
    removeContent,
    getContentPage,
    updateContentPage,
    getCurrentUser,
    refreshContent,
    // Legacy compatibility
    setContent,
  };
} 