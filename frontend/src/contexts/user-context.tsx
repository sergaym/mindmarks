'use client';

import React, { createContext, useState, useEffect, ReactNode } from 'react';
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
