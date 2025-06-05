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
import { fetchUser } from '@/lib/api/auth';

// Persistent cache across component mounts for instant UX
const persistentCache = {
  content: [] as ContentItem[],
  user: null as User | null,
  lastFetch: 0,
  pages: new Map<string, ContentPage>(),
};

// Cache timeout (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

/**
 * Integrates with backend API and handles authentication
 */
export function useContent() {
  // Initialize with cached data for instant display
  const [content, setContent] = useState<ContentItem[]>(persistentCache.content);
  const [currentUser, setCurrentUser] = useState<User | null>(persistentCache.user);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get current user from session/auth with cache
  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    if (persistentCache.user) return persistentCache.user;

    try {
      // Get access token from session storage
      const accessToken = typeof window !== 'undefined' 
        ? sessionStorage.getItem('access_token') 
        : null;

      if (!accessToken) {
        throw new Error('No access token found');
      }

      const result = await fetchUser(accessToken);
      if (result.success) {
        // Transform auth User to content User format
        const contentUser: User = {
          id: result.data.id,
          name: result.data.name || result.data.email.split('@')[0],
          image: '/default-avatar.png', // Default image, can be enhanced later
        };
        // Cache user
        persistentCache.user = contentUser;
        setCurrentUser(contentUser);
        return contentUser;
      } else {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      setError('Authentication required. Please log in.');
      return null;
    }
  }, []);

  // Check if cache is fresh
  const isCacheFresh = useCallback(() => {
    return Date.now() - persistentCache.lastFetch < CACHE_TIMEOUT;
  }, []);

  // Background refresh function
  const refreshContentInBackground = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const user = await getCurrentUser();
      if (!user) return;

      const contentItems = await fetchUserContent(user);
      
      // Update cache and state
      persistentCache.content = contentItems;
      persistentCache.lastFetch = Date.now();
      setContent(contentItems);
      setStatus('success');
    } catch (error) {
      console.error('Background refresh failed:', error);
      // Don't show error for background refresh
    } finally {
      setIsRefreshing(false);
    }
  }, [getCurrentUser]);

  // Fetch content from backend with instant cache display
  const fetchContent = useCallback(async () => {
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
      const user = await getCurrentUser();
      if (!user) {
        setStatus('error');
        setError('Authentication required');
        return;
      }

      const contentItems = await fetchUserContent(user);
      
      // Update cache and state
      persistentCache.content = contentItems;
      persistentCache.lastFetch = Date.now();
      setContent(contentItems);
      setStatus('success');
    } catch (error) {
      console.error('Error fetching content:', error);
      
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
  }, [getCurrentUser, isCacheFresh]);

  // Load content on mount and when user changes
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Background refresh when cache is stale
  useEffect(() => {
    if (!isCacheFresh() && status === 'success') {
      refreshContentInBackground();
    }
  }, [isCacheFresh, status, refreshContentInBackground]);

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
    try {
      const user = await getCurrentUser();
      if (!user) {
        return { 
          status: 'error', 
          error: 'Authentication required' 
        };
      }

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

      // For now, create with predefined template content
      const createRequest: CreateContentRequest = {
        title: newItem.name,
        type: newItem.type,
        url: newItem.url,
        description: newItem.description,
        tags: newItem.tags,
        status: newItem.column === 'planned' ? 'planned' : 
                newItem.column === 'done' ? 'completed' : 'in-progress',
        priority: 'medium'
      };

      const result = await createContent(createRequest, user);
      
      // Replace optimistic item with real one
      const finalContent = optimisticContent.map(item => 
        item.id === optimisticId ? result.content : item
      );
      setContent(finalContent);
      persistentCache.content = finalContent;
      
      // Cache the content page
      persistentCache.pages.set(result.id, result.contentPage);
      
      return { 
        status: 'success', 
        data: finalContent, 
        id: result.id 
      };
    } catch (error) {
      console.error('Error adding content:', error);
      
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
    try {
      // Check cache first
      const cached = persistentCache.pages.get(id);
      if (cached) {
        return cached;
      }

      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      const contentPage = await fetchContentById(id, user);
      
      if (contentPage) {
        // Update cache
        persistentCache.pages.set(id, contentPage);
      }
      
      return contentPage;
    } catch (error) {
      console.error('Error fetching content page:', error);
      
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
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Authentication required');
      }

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

      const updatedPage = await updateContentApi(id, updateRequest, user);
      
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
                  updatedPage.status === 'completed' ? 'done' : 'in-progress',
          priority: updatedPage.priority,
          progress: updatedPage.progress,
        };
        setContent(updatedContent);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating content page:', error);
      return false;
    }
  }, [content, getCurrentUser]);

  // Update content items (for kanban operations)
  const updateContent = useCallback(async (updatedContent: ContentItem[]): Promise<{ status: Status }> => {
    setStatus('loading');
    
    try {
      const user = await getCurrentUser();
      if (!user) {
        return { status: 'error' };
      }

      // Find what changed and update on backend
      const updatePromises = updatedContent.map(async (item) => {
        const originalItem = content.find(c => c.id === item.id);
        if (!originalItem) return;

        // Check if status changed
        if (originalItem.column !== item.column) {
          const newStatus = item.column === 'planned' ? 'planned' : 
                           item.column === 'done' ? 'completed' : 'in-progress';
          
          await updateContentApi(item.id, { status: newStatus }, user);
        }
      });

      await Promise.all(updatePromises);
      
      setContent(updatedContent);
      setStatus('success');
      
      return { status: 'success' };
    } catch (error) {
      console.error('Error updating content:', error);
      setError('Failed to update content');
      setStatus('error');
      return { status: 'error' };
    }
  }, [content, getCurrentUser]);

  // Remove content item
  const removeContent = useCallback(async (id: string) => {
    setStatus('loading');
    
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Authentication required');
      }
      await deleteContent(id, user);
      
      // Update local state
      const newContent = content.filter(item => item.id !== id);
      setContent(newContent);
      
      // Clear cache
      persistentCache.pages.delete(id);
      
      setStatus('success');
      return { status: 'success' as Status, data: newContent };
    } catch (error) {
      console.error('Error removing content:', error);
      
      let errorMessage = 'Failed to delete content';
      if (error instanceof ContentApiError) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setStatus('error');
      return { status: 'error' as Status, error: errorMessage };
    }
  }, [content]);

  // Get current user synchronously (for components that need immediate access)
  const getCurrentUserSync = useCallback(() => {
    return currentUser;
  }, [currentUser]);

  // Refresh content from server
  const refreshContent = useCallback(() => {
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
    currentUser,
    isRefreshing,
    updateContent,
    addContent,
    removeContent,
    getContentPage,
    updateContentPage,
    getCurrentUser: getCurrentUserSync,
    refreshContent,
    // Legacy compatibility
    setContent,
  };
} 