'use client';

import React, { createContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { User } from '@/types/content';
import { apiClient, AuthenticationError, ApiError } from '@/lib/api/client';
import { isTokenExpiringSoon, refreshAccessToken } from '@/lib/api/auth';

// Context type definition
export interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  refetchUser: () => Promise<void>;
  clearUser: () => void;
}

// Create context with undefined default (will throw error if used outside provider)
export const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

// API User response type (what the backend returns)
interface ApiUser {
  id: string;
  email: string;
  full_name?: string;
  avatar?: string;
}

/**
 * UserProvider - Manages global user state and authentication
 * 
 * Features:
 * - Single API call for user data (eliminates duplicates)
 * - Automatic token refresh handling
 * - Centralized authentication state
 * - Development mode fallback
 */
export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to track if we're currently fetching to prevent race conditions
  const isFetchingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const clearUser = () => {
    setUser(null);
    setError(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('access_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
      localStorage.removeItem('user_email');
    }
  };

  const fetchUserData = useCallback(async () => {
    // Prevent multiple simultaneous calls (React 18 StrictMode protection)
    if (isFetchingRef.current) {
      console.log('[UserProvider] Already fetching user data, skipping...');
      return;
    }

    // If already initialized and no error, don't fetch again
    if (hasInitializedRef.current && !error) {
      console.log('[UserProvider] Already initialized, skipping fetch...');
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if there's an access token
      const hasAccessToken = 
        typeof window !== 'undefined' && 
        (sessionStorage.getItem('access_token') || localStorage.getItem('access_token'));
      
      if (!hasAccessToken) {
        setUser(null);
        setIsLoading(false);
        hasInitializedRef.current = true;
        return;
      }
      
      // Check if token needs refresh
      if (isTokenExpiringSoon()) {
        try {
          const refreshResult = await refreshAccessToken();
          if (!refreshResult.success) {
            clearUser();
            setIsLoading(false);
            hasInitializedRef.current = true;
            return;
          }
        } catch (refreshError) {
        }
      }
      
      // Fetch user data from the API
      const response = await apiClient.get<ApiUser>('/api/v1/users/me');
      const apiUserData = response.data;
      
      // Transform API response to match our User interface
      const userData: User = {
        id: apiUserData.id,
        name: apiUserData.full_name || apiUserData.email.split('@')[0],
        image: apiUserData.avatar || '/default-avatar.png',
      };
      
      // Save user data
      setUser(userData);
      
      // Store email in localStorage for future reference
      if (typeof window !== 'undefined' && apiUserData.email) {
        localStorage.setItem('user_email', apiUserData.email);
      }
    } catch (err) {
      
      if (err instanceof AuthenticationError) {
        clearUser();
        
        // Redirect to login if not already there
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        setError('Authentication failed. Please log in again.');
      } else if (err instanceof ApiError) {
        setError(`Failed to fetch user data: ${err.message}`);
        setUser(null);
      } else {
        setError('An unexpected error occurred');
        setUser(null);
      }
    } finally {
      setIsLoading(false);
      hasInitializedRef.current = true;
      isFetchingRef.current = false;
      console.log('[UserProvider] User data fetch completed');
    }
  }, [error]); // Only depend on error to allow retries

  // Development mode fallback user
  useEffect(() => {
    if (!user && !isLoading && !error && process.env.NODE_ENV === 'development' && hasInitializedRef.current) {
      setUser({
        id: 'dev-user-1',
        name: 'Development User',
        image: '/default-avatar.png',
      });
    }
  }, [user, isLoading, error]);

  // Fetch user data on mount - with cleanup for React 18 StrictMode
  useEffect(() => {
    
    if (!hasInitializedRef.current) {
      fetchUserData();
    }

    // Cleanup function for React 18 StrictMode
    return () => {
      isFetchingRef.current = false;
    };
  }, [fetchUserData]); // Add fetchUserData to dependencies

  const contextValue: UserContextType = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    refetchUser: fetchUserData,
    clearUser,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
} 