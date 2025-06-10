'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
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
import { useUser } from './use-user';

// SWR Keys - centralized for cache management
export const SWR_KEYS = {
  CONTENT_LIST: '/api/content/me',
  CONTENT_PAGE: (id: string) => `/api/content/${id}`,
} as const;

// SWR Fetchers with proper error handling
const contentFetcher = async (): Promise<ContentItem[]> => {
  try {
    return await fetchUserContent();
  } catch (error) {
    if (error instanceof ContentApiError) {
      throw new Error(error.message);
    }
    throw new Error('Failed to fetch content');
  }
};

const contentPageFetcher = async (key: string): Promise<ContentPage | null> => {
  const id = key.split('/').pop();
  if (!id) throw new Error('Invalid content ID');
  
  try {
    return await fetchContentById(id);
  } catch (error) {
    if (error instanceof ContentApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
};

// SWR Mutations for data updates
async function createContentMutation(
  key: string, 
  { arg }: { arg: CreateContentRequest }
): Promise<ContentItem> {
  const result = await createContent(arg);
  return result.content;
}

async function updateContentMutation(
  key: string,
  { arg }: { arg: { id: string; updates: UpdateContentRequest } }
): Promise<ContentPage> {
  return await updateContentApi(arg.id, arg.updates);
}

async function deleteContentMutation(
  key: string,
  { arg }: { arg: string }
): Promise<void> {
  await deleteContent(arg);
}

/**
 * Modern content hook using SWR for server state and React patterns for client state
 * This follows Vercel/Next.js best practices and is SSR-compatible
 * 
 * Key improvements over singleton pattern:
 * - Works with SSR/SSG out of the box
 * - Automatic request deduplication via SWR
 * - Built-in caching, revalidation, and error retry
 * - React-idiomatic patterns
 * - Better memory management
 * - Easier to test and debug
 */
export function useContent() {
  const { user, isAuthenticated, isLoading: userLoading } = useUser();
  
  // SWR for server state with automatic caching, revalidation, and error handling
  const {
    data: content = [],
    error: contentError,
    isLoading: isContentLoading,
    isValidating,
    mutate: mutateContent,
  } = useSWR(
    // Only fetch when user is authenticated - this prevents unnecessary calls
    isAuthenticated && user ? SWR_KEYS.CONTENT_LIST : null,
    contentFetcher,
    {
      // SWR configuration optimized for content
      revalidateOnFocus: false,        // Don't refetch on window focus
      revalidateOnReconnect: true,     // Refetch when connection restored
      dedupingInterval: 2000,          // Dedupe requests within 2s
      errorRetryCount: 3,              // Retry failed requests 3 times
      errorRetryInterval: 1000,        // Wait 1s between retries
      refreshInterval: 5 * 60 * 1000,  // Background refresh every 5 minutes
      revalidateIfStale: true,         // Revalidate if data is stale
      keepPreviousData: true,          // Keep previous data while loading new
    }
  );

  // SWR Mutations for CRUD operations
  const { trigger: triggerCreate, isMutating: isCreating } = useSWRMutation(
    SWR_KEYS.CONTENT_LIST,
    createContentMutation
  );

  const { trigger: triggerUpdate, isMutating: isUpdating } = useSWRMutation(
    SWR_KEYS.CONTENT_LIST,
    updateContentMutation
  );

  const { trigger: triggerDelete, isMutating: isDeleting } = useSWRMutation(
    SWR_KEYS.CONTENT_LIST,
    deleteContentMutation
  );

  // Convert user to content format
  const getCurrentUser = useCallback((): User | null => {
    if (!user || !isAuthenticated) return null;
    
    return {
      id: user.id,
      name: user.name,
      image: user.image,
    };
  }, [user, isAuthenticated]);

  // CRUD Operations with proper error handling and optimistic updates
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
  }) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { status: 'error' as const, error: 'Authentication required' };
    }

    try {
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

      // Optimistic update via SWR
      const newItemOptimistic: ContentItem = {
        id: `temp-${Date.now()}`,
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

      // Optimistic update - immediately show in UI
      await mutateContent([...content, newItemOptimistic], { revalidate: false });
      
      try {
        // Call the API
        const result = await triggerCreate(createRequest);
        
        // Replace optimistic item with real data
        await mutateContent(
          content.map(item => item.id === newItemOptimistic.id ? result : item),
          { revalidate: false }
        );
      } catch (error) {
        // Rollback on error
        await mutateContent(content, { revalidate: false });
        throw error;
      }
      
      return { 
        status: 'success' as const, 
        data: content,
        id: newItemOptimistic.id
      };
    } catch (error) {
      console.error('[useContent] Error adding content:', error);
      return { 
        status: 'error' as const, 
        error: error instanceof Error ? error.message : 'Failed to create content' 
      };
    }
  }, [getCurrentUser, triggerCreate, content, mutateContent]);

  const updateContent = useCallback(async (updatedContent: ContentItem[]) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return { status: 'error' as const };

    try {
      // Find changes and update on server
      const updatePromises = updatedContent.map(async (item) => {
        const originalItem = content.find(c => c.id === item.id);
        if (!originalItem || originalItem.column === item.column) return;

        const newStatus = item.column === 'planned' ? 'planned' : 
                         item.column === 'done' ? 'completed' : 'in_progress';
        
        await triggerUpdate({ id: item.id, updates: { status: newStatus } });
      });

      await Promise.all(updatePromises);
      
      // Update cache
      await mutateContent(updatedContent, { revalidate: false });
      
      return { status: 'success' as const };
    } catch (error) {
      console.error('[useContent] Error updating content:', error);
      return { status: 'error' as const };
    }
  }, [getCurrentUser, content, triggerUpdate, mutateContent]);

  const removeContent = useCallback(async (id: string) => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Authentication required');
    }

    try {
      // Optimistic removal - immediately remove from UI
      const optimisticContent = content.filter(item => item.id !== id);
      await mutateContent(optimisticContent, { revalidate: false });
      
      try {
        // Call the API
        await triggerDelete(id);
      } catch (error) {
        // Rollback on error
        await mutateContent(content, { revalidate: false });
        throw error;
      }
      
      return { status: 'success' as const, data: content };
    } catch (error) {
      console.error('[useContent] Error removing content:', error);
      throw error;
    }
  }, [getCurrentUser, triggerDelete, content, mutateContent]);

  const refreshContent = useCallback(() => {
    return mutateContent();
  }, [mutateContent]);

  return {
    // Data
    content,
    currentUser: getCurrentUser(),
    
    // Loading states
    status: userLoading || isContentLoading ? 'loading' : 
            contentError ? 'error' : 'success' as Status,
    error: contentError?.message || null,
    isRefreshing: isValidating,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Actions
    addContent,
    updateContent,
    removeContent,
    refreshContent,
    
    // Legacy compatibility
    setContent: async (newContent: ContentItem[]) => {
      await mutateContent(newContent, { revalidate: false });
    },
    
    // Content page operations use separate hooks
    getContentPage: null, // Use useContentPage hook instead
    updateContentPage: null, // Use useContentPage hook instead
  };
}

/**
 * Separate hook for individual content pages
 * Better separation of concerns and automatic caching
 */
export function useContentPage(id: string | null) {
  const { user, isAuthenticated } = useUser();
  
  const {
    data: contentPage,
    error,
    isLoading,
    mutate: mutateContentPage,
  } = useSWR(
    isAuthenticated && user && id ? SWR_KEYS.CONTENT_PAGE(id) : null,
    contentPageFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,     // Longer deduping for individual pages
      keepPreviousData: true,
    }
  );

  const { trigger: triggerUpdatePage, isMutating: isUpdating } = useSWRMutation(
    id ? SWR_KEYS.CONTENT_PAGE(id) : null,
    updateContentMutation,
    {
      populateCache: (updatedPage) => updatedPage,
      revalidate: false,
    }
  );

  const updateContentPage = useCallback(async (
    updates: Partial<ContentPage>
  ): Promise<boolean> => {
    if (!id || !contentPage) return false;

    try {
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

      // Optimistic update - immediately show changes
      const optimisticPage = { ...contentPage, ...updates, updatedAt: new Date() };
      await mutateContentPage(optimisticPage, { revalidate: false });
      
      try {
        // Call the API
        const result = await triggerUpdatePage({ id, updates: updateRequest });
        
        // Update with real data
        await mutateContentPage(result, { revalidate: false });
      } catch (error) {
        // Rollback on error
        await mutateContentPage(contentPage, { revalidate: false });
        throw error;
      }

      return true;
    } catch (error) {
      console.error('[useContentPage] Error updating:', error);
      return false;
    }
  }, [id, contentPage, triggerUpdatePage, mutateContentPage]);

  return {
    contentPage,
    error: error?.message || null,
    isLoading,
    isUpdating,
    updateContentPage,
    refreshContentPage: mutateContentPage,
  };
} 