/**
 * Enhanced API client with comprehensive error handling, retry logic, and token management
 */
import { refreshAccessToken, isTokenExpiringSoon } from './auth';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Error types for better error handling
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string, code?: string) {
    super(401, message, code);
    this.name = 'AuthenticationError';
  }
}

// Request configuration
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  requiresAuth?: boolean;
  contentType?: 'json' | 'form-urlencoded' | 'multipart';
}

// Response wrapper
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
}

// Token management
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

/**
 * Get the current access token
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try sessionStorage first (preferred), then localStorage (fallback)
  return sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
}

  const tokenType = localStorage.getItem('token_type') || 'Bearer';
  
  if (!accessToken) return null;
  return { accessToken, refreshToken: refreshToken || '', type: tokenType };
}

/**
 * Subscribe a callback to be executed when tokens refresh
 */
function subscribeTokenRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers about new token
 */
function onTokenRefreshed(token: string): void {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

/**
 * Handle token refresh for 401 errors
 */
async function handleTokenRefresh(): Promise<string | null> {
  try {
    if (!isRefreshing) {
      isRefreshing = true;
      
      const refreshResult = await refreshAccessToken();
      
      if (refreshResult.success && refreshResult.data.access_token) {
        onTokenRefreshed(refreshResult.data.access_token);
        return refreshResult.data.access_token;
      }
      
      // If refresh failed, clear all tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_type');
      
      // Redirect to login page if in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login?error=session_expired';
      }
      
      return null;
    } else {
      // If already refreshing, return a promise that resolves when refreshed
      return new Promise<string>((resolve) => {
        subscribeTokenRefresh((token: string) => {
          resolve(token);
        });
      });
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Make a GET request to the API with token refresh support
 */
export async function apiGet<T = unknown>(endpoint: string, retrying = false): Promise<T> {
  const tokenData = getToken();
  const headers: HeadersInit = {};
  
  if (tokenData) {
    headers['Authorization'] = `${tokenData.type} ${tokenData.accessToken}`;
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    
    // Handle 401 with token refresh
    if (response.status === 401 && tokenData?.refreshToken && !retrying) {
      const newToken = await handleTokenRefresh();
      
      if (newToken) {
        // Retry the request with the new token
        return apiGet<T>(endpoint, true);
      } else {
        throw new Error('Session expired. Please login again.');
      }
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error calling GET ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Make a POST request to the API with token refresh support
 */
export async function apiPost<T = unknown>(
  endpoint: string, 
  data: Record<string, unknown>, 
  isFormUrlEncoded = false,
  retrying = false
): Promise<T> {
  const tokenData = getToken();
  const headers: HeadersInit = {
    'Content-Type': isFormUrlEncoded ? 'application/x-www-form-urlencoded' : 'application/json',
  };
  
  if (tokenData) {
    headers['Authorization'] = `${tokenData.type} ${tokenData.accessToken}`;
  }
  
  let body: string;
  
  if (isFormUrlEncoded) {
    const formData = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    body = formData.toString();
  } else {
    body = JSON.stringify(data);
  }
  
  try {
    console.log(`Making API request to ${endpoint}`, { 
      method: 'POST',
      headers: { ...headers, Authorization: headers.Authorization ? 'REDACTED' : undefined },
      bodyPreview: isFormUrlEncoded ? body : 'JSON data' 
    });
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body,
    });
    
    // Handle 401 with token refresh
    if (response.status === 401 && tokenData?.refreshToken && !retrying) {
      const newToken = await handleTokenRefresh();
      
      if (newToken) {
        // Retry the request with the new token
        return apiPost<T>(endpoint, data, isFormUrlEncoded, true);
      } else {
        throw new Error('Session expired. Please login again.');
      }
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Error calling POST ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Login function that returns a token
 */
export async function login(username: string, password: string): Promise<{ access_token: string; refresh_token: string; token_type: string }> {
  try {
    console.log("Making login request with username:", username);
    
    const formData = {
      username,
      password,
    };
    
    const result = await apiPost<{ access_token: string; refresh_token: string; token_type: string }>(
      '/api/v1/auth/login', 
      formData, 
      true
    );
    
    console.log("Login API response successful:", { 
      tokenReceived: !!result.access_token,
      refreshTokenReceived: !!result.refresh_token,
      tokenType: result.token_type 
    });
    
    // Store token type for future requests
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('refresh_token', result.refresh_token);
      localStorage.setItem('token_type', result.token_type);
    }
    
    // Validation check - if no token was returned but the request didn't throw an error
    if (!result.access_token) {
      console.error("API returned success but no access token was found in the response");
      throw new Error("Authentication failed: No token received");
    }
    
    return result;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
} 