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

  // Function to update content item
  const updateContent = async (updatedContent: ContentItem[]) => {
    setStatus('loading');
    try {
      // Simulate API call to update content
      await new Promise(resolve => setTimeout(resolve, 300));
      setContent(updatedContent);
      setStatus('success');
      return { status: 'success' as Status };
    } catch (error) {
      console.error('Error updating content:', error);
      setError('Failed to update content');
      setStatus('error');
      return { status: 'error' as Status, error: 'Failed to update content' };
    }
  };

  // Function to add new content item
  const addContent = async (newItem: {
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
    setStatus('loading');
    try {
      // Simulate API call to create content
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Generate a simple ID - in a real app, this would come from the API
      const id = `content${content.length + 1}`;
      
      // Create a complete content item with proper types
      const completeItem: ContentItem = {
        id,
        name: newItem.name,
        type: newItem.type,
        startAt: newItem.startAt,
        column: newItem.column,
        owner: newItem.owner,
        endAt: newItem.endAt,
        description: newItem.description,
        tags: newItem.tags,
        url: newItem.url,
      };
      
      const newContent = [...content, completeItem];
      setContent(newContent);
      setStatus('success');
      return { status: 'success' as Status, data: newContent };
    } catch (error) {
      console.error('Error adding content:', error);
      setError('Failed to add content');
      setStatus('error');
      return { status: 'error' as Status, error: 'Failed to add content' };
    }
  };

  // Function to remove content item
  const removeContent = async (id: string) => {
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