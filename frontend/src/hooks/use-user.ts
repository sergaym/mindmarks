'use client';

import { useState, useEffect } from 'react';
import { apiClient, ApiError, AuthenticationError } from '@/lib/api/client';
import { refreshAccessToken, isTokenExpiringSoon } from '@/lib/api/auth';

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
      setError(null);
      
      try {
        // Check if there's an access token
        const hasAccessToken = 
          typeof window !== 'undefined' && 
          (sessionStorage.getItem('access_token') || localStorage.getItem('access_token'));
        
        if (!hasAccessToken) {
          // No access token available
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        // Check if token needs refresh
        if (isTokenExpiringSoon()) {
          try {
            const refreshResult = await refreshAccessToken();
            if (!refreshResult.success) {
              // Refresh failed, clear tokens
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('access_token');
                localStorage.removeItem('access_token');
                localStorage.removeItem('token_type');
              }
              setUser(null);
              setIsLoading(false);
              return;
            }
          } catch (refreshError) {
            console.warn('Token refresh failed:', refreshError);
            // Continue with existing token and let the API call handle it
          }
        }
        
        // Fetch user data from the API using the new client
        const response = await apiClient.get<User>('/api/v1/users/me');
        const userData = response.data;
        
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
        
        // Our client.ts should already handle token refresh on 401s,
        // but we'll still handle cleanup here just in case
        if (err instanceof Error && err.message.includes('401')) {
          console.log('Session expired, clearing tokens');
          
          // Clear invalid auth data
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
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