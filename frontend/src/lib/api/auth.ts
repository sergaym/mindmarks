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

// Define user types
export type User = {
  id: string;
  email: string;
  name?: string;
  accessToken?: string;
};

/**
 * Makes a form-urlencoded request to the API
 */
async function apiRequest<T>(endpoint: string, method: string, data?: Record<string, string>, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Prepare request options
  const options: RequestInit = {
    method,
    headers,
  };

  // Convert data to form-urlencoded format
  if (data) {
    const formData = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    options.body = formData.toString();
  }

  // Make the request
  const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`;
  const response = await fetch(apiUrl, options);

  // Handle errors
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  // Return response data
  return response.json();
}

/**
 * Get user profile data
 */
export async function fetchUser(token: string): Promise<User> {
  return apiRequest<User>('/api/v1/users/me', 'GET', undefined, token);
}

/**
 * Login user
 */
export async function loginUser(email: string, password: string): Promise<User | null> {
  try {
    // Backend expects username/password for login
    const response = await apiRequest<{ access_token: string }>('/api/v1/auth/login', 'POST', {
      username: email, // Backend expects username, but we use email
      password,
    });

    if (!response?.access_token) {
      return null;
    }

    // Basic user info, can be enhanced by calling fetchUser if needed
    return {
      id: 'user-id',
      email: email,
      name: email,
      accessToken: response.access_token,
    };
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

/**
 * Register a new user
 */
export async function registerUser(email: string, password: string, name?: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/v1/users/register', 'POST', {
    email,
    password,
    full_name: name || '',
  });
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