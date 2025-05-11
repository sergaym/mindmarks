'use client';

import { useState, useEffect } from 'react';
import { getCookie } from 'cookies-next';
import { apiGet } from '@/lib/api/client';

export type User = {
  id: string;
  full_name: string;
  email: string;
  avatar?: string;
};

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      setIsLoading(true);
      
      try {
        // Check if there's an auth token in cookies or localStorage
        const hasAuthToken = 
          getCookie('auth_token') || 
          (typeof window !== 'undefined' && localStorage.getItem('access_token'));
        
        if (!hasAuthToken) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        // Fetch user data from the API
        const userData = await apiGet<User>('/api/v1/users/me');
        
        // Ensure full_name is set - use email username part if full_name is missing
        if (!userData.full_name && userData.email) {
          userData.full_name = userData.email.split('@')[0];
        }
        
        // Save user data
        setUser(userData);
        
        // Store email in localStorage for future reference
        if (typeof window !== 'undefined' && userData.email) {
          localStorage.setItem('user_email', userData.email);
        }
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        
        // Handle case when token is expired or invalid
        if (err instanceof Error && err.message.includes('401')) {
          // Clear invalid auth data
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('token_type');
          }
        }
        
        setError('Failed to fetch user data');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, []);

  // For demo/development purposes - create a fallback user when no authentication is available
  useEffect(() => {
    if (!user && !isLoading && process.env.NODE_ENV === 'development') {
      // Only use fallback data in development
      setUser({
        id: 'user1',
        full_name: 'Sergio Ayala',
        email: 'sergioayala.contacto@gmail.com',
        avatar: '/me.png',
      });
    }
  }, [user, isLoading]);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
} 