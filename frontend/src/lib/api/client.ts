/**
 * Unified API client with comprehensive error handling, retry logic, and token management
 * Consolidates all API request functionality across the application
 */
import { refreshAccessToken, isTokenExpiringSoon } from './auth';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Unified error types
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

// Content type mappings
const CONTENT_TYPE_MAP = {
  json: 'application/json',
  form: 'application/x-www-form-urlencoded',
  multipart: 'multipart/form-data',
} as const;

// Request configuration
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
  requiresAuth?: boolean;
  contentType?: keyof typeof CONTENT_TYPE_MAP;
}

// Response wrapper
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
}

// Token management state
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

/**
 * Get the current access token from storage
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Try sessionStorage first (preferred), then localStorage (fallback)
  return sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
}

/**
 * Get authentication headers
 */
function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  const tokenType = localStorage.getItem('token_type') || 'Bearer';
  
  if (!token) return {};
  
  return {
    'Authorization': `${tokenType} ${token}`
  };
}

/**
 * Subscribe to token refresh completion
 */
function subscribeTokenRefresh(callback: (token: string | null) => void): void {
  refreshSubscribers.push(callback);
}

/**
 * Notify all subscribers when token refresh completes
 */
function onTokenRefreshed(token: string | null): void {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

/**
 * Handle token refresh with queue management to prevent concurrent refreshes
 */
async function handleTokenRefresh(): Promise<string | null> {
  if (isRefreshing) {
    // Wait for ongoing refresh
    return new Promise((resolve) => {
      subscribeTokenRefresh(resolve);
    });
  }

  isRefreshing = true;
      
  try {
    const result = await refreshAccessToken();
      
    if (result.success) {
      const newToken = result.data.access_token;
      onTokenRefreshed(newToken);
      return newToken;
    } else {
      onTokenRefreshed(null);
      throw new AuthenticationError('Token refresh failed', result.error.code);
    }
  } catch (error) {
    onTokenRefreshed(null);
    throw error;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Prepare request body based on content type
 */
function prepareRequestBody(data: unknown, contentType: string): { body: string | FormData; headers: Record<string, string> } {
  const headers: Record<string, string> = {};
  
  switch (contentType) {
    case CONTENT_TYPE_MAP.json:
      headers['Content-Type'] = CONTENT_TYPE_MAP.json;
      return { body: JSON.stringify(data), headers };
    
    case CONTENT_TYPE_MAP.form:
      headers['Content-Type'] = CONTENT_TYPE_MAP.form;
      if (data && typeof data === 'object') {
        const formData = new URLSearchParams();
        Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
        return { body: formData.toString(), headers };
      }
      return { body: '', headers };
    
    case CONTENT_TYPE_MAP.multipart:
      // Don't set Content-Type for multipart - let browser set it with boundary
      if (data instanceof FormData) {
        return { body: data, headers };
      }
      if (data && typeof data === 'object') {
        const formData = new FormData();
        Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
          if (value instanceof File || value instanceof Blob) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        });
        return { body: formData, headers };
      }
      return { body: new FormData(), headers };
    
    default:
      headers['Content-Type'] = CONTENT_TYPE_MAP.json;
      return { body: JSON.stringify(data), headers };
  }
}

/**
 * Parse API error response
 */
async function parseErrorResponse(response: Response): Promise<{ message: string; code?: string }> {
  try {
    const errorData = await response.json();
    
    // Handle different API error response formats
    if (errorData.detail) {
      // FastAPI format: {"detail": "message"}
      return { message: errorData.detail };
    } else if (errorData.message) {
      // Custom format: {"message": "text", "code": "ERROR_CODE"}
      return { message: errorData.message, code: errorData.code };
    } else if (typeof errorData === 'string') {
      return { message: errorData };
    } else {
      // Fallback for unknown JSON structure
      return { message: JSON.stringify(errorData) };
    }
  } catch {
    // If JSON parsing fails, use response text
    const errorText = await response.text().catch(() => `HTTP ${response.status} Error`);
    return { message: errorText };
  }
}

/**
 * Unified API request function that consolidates all request patterns
 */
async function apiRequest<T = unknown>(
  endpoint: string, 
  config: RequestConfig = {}
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = 30000,
    retries = 3,
    requiresAuth = true,
    contentType = 'json'
  } = config;

  // Check if token refresh is needed before making the request
  if (requiresAuth && isTokenExpiringSoon()) {
    try {
      await handleTokenRefresh();
    } catch (error) {
      console.warn('Proactive token refresh failed:', error);
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  // Build headers
  const requestHeaders: Record<string, string> = { ...headers };
  
  // Add auth headers if required
  if (requiresAuth) {
    Object.assign(requestHeaders, getAuthHeaders());
  }
  
  // Prepare body and content-type headers
  let requestBody: string | FormData | undefined;
  if (body && method !== 'GET') {
    const { body: preparedBody, headers: contentHeaders } = prepareRequestBody(body, CONTENT_TYPE_MAP[contentType]);
    requestBody = preparedBody;
    Object.assign(requestHeaders, contentHeaders);
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  let lastError: Error = new Error('Unknown error');
  
  // Retry logic
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`[API] ${method} ${url}${attempt > 0 ? ` (attempt ${attempt + 1})` : ''}`, body ? { body } : '');
      
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal,
        credentials: 'include', // Include cookies for refresh tokens
      });

      clearTimeout(timeoutId);

      // Handle authentication errors
      if (response.status === 401 && requiresAuth) {
        // Try to refresh token and retry once
        if (attempt === 0) {
          try {
            await handleTokenRefresh();
            // Update auth headers with new token
            Object.assign(requestHeaders, getAuthHeaders());
            continue; // Retry with new token
          } catch {
            throw new AuthenticationError('Authentication failed. Please log in again.');
          }
        } else {
          throw new AuthenticationError('Authentication failed after token refresh.');
        }
      }

      // Handle other HTTP errors
      if (!response.ok) {
        const { message, code } = await parseErrorResponse(response);
        throw new ApiError(response.status, message, code);
      }

      // Handle successful responses
      if (response.status === 204) {
        console.log(`[API] ${method} ${url} - Success: No Content`);
        return undefined as T;
      }

      const result = await response.json();
      console.log(`[API] ${method} ${url} - Success:`, result);
      return result as T;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (controller.signal.aborted) {
        lastError = new NetworkError('Request timeout');
      } else if (error instanceof ApiError || error instanceof AuthenticationError) {
        throw error; // Don't retry API errors
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        lastError = new NetworkError('Network error: Unable to connect to the server', error);
      } else {
        lastError = error as Error;
      }

      // Don't retry on the last attempt
      if (attempt === retries) {
        break;
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error(`[API] ${method} ${url} - Failed after ${retries + 1} attempts:`, lastError);
  throw lastError;
}

// Export the unified API client
export const client = {
  /**
   * GET request
   */
  get: <T = unknown>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...config, method: 'GET' }),

  /**
   * POST request
   */
  post: <T = unknown>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method'>) =>
    apiRequest<T>(endpoint, { ...config, method: 'POST', body }),

  /**
   * PUT request
   */
  put: <T = unknown>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method'>) =>
    apiRequest<T>(endpoint, { ...config, method: 'PUT', body }),

  /**
   * PATCH request
   */
  patch: <T = unknown>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method'>) =>
    apiRequest<T>(endpoint, { ...config, method: 'PATCH', body }),

  /**
   * DELETE request
   */
  delete: <T = unknown>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) =>
    apiRequest<T>(endpoint, { ...config, method: 'DELETE' }),
};

// Legacy support - expose the raw function for backward compatibility
export { apiRequest };

// Export the client as default
export default client;

// Export utility functions for testing
export const __internal = {
  getAccessToken,
  getAuthHeaders,
  parseErrorResponse,
  prepareRequestBody,
}; 