'use client';

import { useState, useEffect } from 'react';
import { ContentItem, ContentType, User, Status } from '@/types/content';

// Sample user data - will be replaced with API call
const users: User[] = [
  {
    id: "user1",
    name: "Sergio Ayala",
    image: "/me.png",
  },
  {
    id: "user2",
    name: "Jane Doe",
    image: "/default-avatar.png",
  }
];

// Sample content items - will be replaced with API call
const sampleContent: ContentItem[] = [
  {
    id: "content1",
    name: "Atomic Habits by James Clear",
    startAt: new Date(2023, 10, 1),
    endAt: new Date(2023, 10, 30),
    column: "planned",
    owner: users[0],
    type: "book"
  },
  {
    id: "content2",
    name: "The Psychology of Money",
    startAt: new Date(2023, 9, 15),
    endAt: new Date(2023, 11, 15),
    column: "in-progress",
    owner: users[0],
    type: "book"
  },
  {
    id: "content3",
    name: "Deep Work by Cal Newport",
    startAt: new Date(2023, 8, 1),
    endAt: new Date(2023, 8, 30),
    column: "done",
    owner: users[0],
    type: "book"
  },
  {
    id: "content4",
    name: "How AI Works - Article",
    startAt: new Date(2023, 10, 5),
    endAt: new Date(2023, 10, 6),
    column: "planned",
    owner: users[1],
    type: "article"
  },
  {
    id: "content5",
    name: "The Future of Web Development",
    startAt: new Date(2023, 10, 10),
    endAt: new Date(2023, 10, 11),
    column: "in-progress",
    owner: users[1],
    type: "article"
  },
  {
    id: "content6",
    name: "Learn Next.js in 1 Hour",
    startAt: new Date(2023, 9, 20),
    endAt: new Date(2023, 9, 21),
    column: "done",
    owner: users[0],
    type: "video"
  }
];

/**
 * Custom hook for managing content items
 * In the future, this will connect to a real API instead of using mock data
 */
export function useContent() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  // Simulate API call to fetch content
  useEffect(() => {
    async function fetchContent() {
      setStatus('loading');
      try {
        // Simulate API latency
        await new Promise(resolve => setTimeout(resolve, 500));
        setContent(sampleContent);
        setStatus('success');
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Failed to fetch content');
        setStatus('error');
      }
    }

    fetchContent();
  }, []);

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