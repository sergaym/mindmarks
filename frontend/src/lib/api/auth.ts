import { jwtDecode } from 'jwt-decode';
import { User as NextAuthUser } from 'next-auth';
import { fetchClient } from '@/lib/api/fetchClient';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface DecodedToken {
  sub?: string;
  user_id?: string;
  id?: string;
  userId?: string;
  exp?: number;
  jti?: string;
  [key: string]: unknown;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  expires_in: number;
}

// Helper for checking HTTP responses
const checkResponse = async <T = unknown>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`HTTP error! Status: ${response.status}, Error: ${errorText}`);
  }
  
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json() as T;
};

export const loginUser = async (email: string, password: string): Promise<NextAuthUser | null> => {
  try {
    const resData = await fetchClient<{
      access_token: string;
      refresh_token?: string;
      user_id: string;
    }>('/api/v1/users/login', 'POST', null, { email, password });

    if (!resData || !resData.access_token) {
      return null;
    }

    try {
      // Fetch user details using the token
      const userData = await fetchUser(resData.access_token);

      // Return user with auth data
      return {
        ...userData,
        created_at: userData.created_at || new Date().toISOString(),
        accessToken: resData.access_token,
        refreshToken: resData.refresh_token || undefined
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      
      // If we can't fetch detailed user data, return minimal info
      return {
        id: resData.user_id,
        email: email,
        is_active: true,
        is_superuser: false,
        created_at: new Date().toISOString(),
        accessToken: resData.access_token,
        refreshToken: resData.refresh_token || undefined
      };
    }
  } catch (error) {
    console.error('Error during login:', error);
    return null;
  }
};

export const refreshToken = async (token: unknown): Promise<RefreshTokenResponse | null> => {
  try {
    // Check if the token is valid
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return null;
    }

    const refreshToken = token as string;

    try {
      return await fetchClient<RefreshTokenResponse>(
        '/api/v1/users/refresh-token', 
        'POST', 
        null, 
        { refresh_token: refreshToken }
      );
    } catch (error) {
      return null;
    }
  } catch (error) {
    return null;
  }
};

export const fetchUser = async (token: string): Promise<User> => {
  try {
    // Decode the JWT token to get the user_id
    const decoded = jwtDecode<DecodedToken>(token);
    
    // Check for user ID in different possible fields
    let userId = decoded.user_id || decoded.userId || decoded.sub || decoded.id;
    
    // If no userId found, check for jti as fallback
    if (!userId && decoded.jti) {
      userId = decoded.jti;
    }
    
    if (!userId) {
      throw new Error('No user ID found in token');
    }
    
    return await fetchClient<User>(`/api/v1/users/${userId}`, 'GET', token);
  } catch (error) {
    throw error;
  }
};

export const registerUser = async (email: string, password: string, full_name?: string): Promise<{ message: string }> => {
  return await fetchClient<{ message: string }>(
    '/api/v1/users/register',
    'POST',
    null,
    {
      email,
      password,
      full_name: full_name || '',
      is_active: true,
    }
  );
}; 