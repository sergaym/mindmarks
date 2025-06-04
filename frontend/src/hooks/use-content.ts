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

// Cache for content pages to avoid repeated API calls
const contentPageCache = new Map<string, ContentPage>();

// Cache timeout (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;
const cacheTimestamps = new Map<string, number>();

/**
 * Integrates with backend API and handles authentication
 */
export function useContent() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  // Get current user from session/auth
  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    if (currentUser) return currentUser;

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
  }, [currentUser]);

  // Fetch content from backend
  const fetchContent = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const user = await getCurrentUser();
      if (!user) {
        setStatus('error');
        setError('Authentication required');
        return;
      }

      const contentItems = await fetchUserContent(user);
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
  }, [getCurrentUser]);

  // Load content on mount and when user changes
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Add new content item
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
    setStatus('loading');
    
    try {
      const user = await getCurrentUser();
      if (!user) {
        return { 
          status: 'error', 
          error: 'Authentication required' 
        };
      }

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
      
      // Update local state
      const updatedContent = [...content, result.content];
      setContent(updatedContent);
      
      // Cache the content page
      contentPageCache.set(result.id, result.contentPage);
      cacheTimestamps.set(result.id, Date.now());
      
      setStatus('success');
      
      return { 
        status: 'success', 
        data: updatedContent, 
        id: result.id 
      };
    } catch (error) {
      console.error('Error adding content:', error);
      
      let errorMessage = 'Failed to create content';
      if (error instanceof ContentApiError) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setStatus('error');
      
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
      const cached = contentPageCache.get(id);
      const cacheTime = cacheTimestamps.get(id);
      
      if (cached && cacheTime && (Date.now() - cacheTime) < CACHE_TIMEOUT) {
        return cached;
      }

      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Authentication required');
      }

      const contentPage = await fetchContentById(id, user);
      
      if (contentPage) {
        // Update cache
        contentPageCache.set(id, contentPage);
        cacheTimestamps.set(id, Date.now());
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
      contentPageCache.set(id, updatedPage);
      cacheTimestamps.set(id, Date.now());
      
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
    setStatus('loading');
    try {
      // Simulate API call to delete content
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newContent = content.filter(item => item.id !== id);
      setContent(newContent);
      setStatus('success');
      return { status: 'success' as Status, data: newContent };
    } catch (error) {
      console.error('Error removing content:', error);
      setError('Failed to remove content');
      setStatus('error');
      return { status: 'error' as Status, error: 'Failed to remove content' };
    }
  };

  // Get current user (for now, just return the first user)
  const getCurrentUser = () => {
    return users[0];
  };

  return {
    content,
    status,
    error,
    updateContent,
    addContent,
    removeContent,
    setContent,
    getCurrentUser
  };
} 