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
 * Add request to refresh queue
 */
function subscribeTokenRefresh(callback: (token: string | null) => void): void {
  refreshSubscribers.push(callback);
}

/**
 * Process refresh queue
 */
function onTokenRefreshed(token: string | null): void {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

/**
 * Handle token refresh with queue management
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
 * Create AbortController with timeout
 */
function createTimeoutController(timeout: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
}

/**
 * Prepare request body based on content type
 */
function prepareRequestBody(data: unknown, contentType: string): string | FormData {
  switch (contentType) {
    case 'application/json':
      return JSON.stringify(data);
    
    case 'application/x-www-form-urlencoded':
      if (data && typeof data === 'object') {
        const formData = new URLSearchParams();
        Object.entries(data as Record<string, unknown>).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
        return formData.toString();
      }
      return '';
    
    case 'multipart/form-data':
      if (data instanceof FormData) {
        return data;
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
        return formData;
      }
      return new FormData();
    
    default:
      return JSON.stringify(data);
  }
}

/**
 * Make API request with enhanced error handling and retry logic
 */
async function makeRequest<T = unknown>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
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
      // If refresh fails, continue with the request - let the 401 handler deal with it
      console.warn('Proactive token refresh failed:', error);
    }
  }

  const url = `${API_URL}${endpoint}`;
  
  // Prepare headers based on content type
  const baseHeaders: Record<string, string> = {};
  
  if (contentType === 'json') {
    baseHeaders['Content-Type'] = 'application/json';
  } else if (contentType === 'form-urlencoded') {
    baseHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
  }
  // For multipart, we let the browser set the boundary automatically
  
  const requestHeaders: Record<string, string> = {
    ...baseHeaders,
    ...headers,
    ...(requiresAuth ? getAuthHeaders() : {})
  };

  const requestBody = body ? prepareRequestBody(body, baseHeaders['Content-Type'] || 'application/json') : undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = createTimeoutController(timeout);
    
    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        credentials: 'include',
        signal: controller.signal
      });

      // Handle authentication errors
      if (response.status === 401 && requiresAuth && attempt === 0) {
        try {
          const newToken = await handleTokenRefresh();
          if (newToken) {
            // Retry with new token
            const newHeaders = { ...requestHeaders, ...getAuthHeaders() };
            const retryResponse = await fetch(url, {
              method,
              headers: newHeaders,
              body: requestBody,
              credentials: 'include',
              signal: createTimeoutController(timeout).signal
            });
            
            if (!retryResponse.ok) {
              let errorMessage: string;
              let errorCode: string | undefined;

              try {
                // Try to parse JSON error response
                const errorData = await retryResponse.json();
                
                // Handle different API error response formats
                if (errorData.detail) {
                  errorMessage = errorData.detail;
                } else if (errorData.message) {
                  errorMessage = errorData.message;
                  errorCode = errorData.code;
                } else if (typeof errorData === 'string') {
                  errorMessage = errorData;
                } else {
                  errorMessage = JSON.stringify(errorData);
                }
              } catch {
                try {
                  errorMessage = await retryResponse.text() || `HTTP ${retryResponse.status} Error`;
                } catch {
                  errorMessage = `HTTP ${retryResponse.status} Error`;
                }
              }

              throw new ApiError(
                retryResponse.status,
                errorMessage,
                errorCode
              );
            }
            
            return {
              data: await retryResponse.json(),
              status: retryResponse.status,
              headers: retryResponse.headers
            };
          }
        } catch {
          // Clear invalid tokens and redirect to login
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('access_token');
            localStorage.removeItem('access_token');
            localStorage.removeItem('token_type');
            window.location.href = '/login';
          }
          throw new AuthenticationError('Authentication failed', 'AUTH_FAILED');
        }
      }

      // Handle other HTTP errors
      if (!response.ok) {
        let errorMessage: string;
        let errorCode: string | undefined;

        try {
          // Try to parse JSON error response
          const errorData = await response.json();
          
          // Handle different API error response formats
          if (errorData.detail) {
            // FastAPI format: {"detail": "message"}
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            // Custom format: {"message": "text", "code": "ERROR_CODE"}
            errorMessage = errorData.message;
            errorCode = errorData.code;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else {
            // Fallback for unknown JSON structure
            errorMessage = JSON.stringify(errorData);
          }
        } catch {
          // If JSON parsing fails, use response text or generic message
          try {
            errorMessage = await response.text() || `HTTP ${response.status} Error`;
          } catch {
            errorMessage = `HTTP ${response.status} Error`;
          }
        }
        
        if (response.status >= 500 && attempt < retries) {
          // Retry server errors
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        
        throw new ApiError(response.status, errorMessage, errorCode);
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: T;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as unknown as T;
      }

      return {
        data,
        status: response.status,
        headers: response.headers
      };

    } catch (error) {
      // Handle network errors and timeouts
      if (error instanceof ApiError || error instanceof AuthenticationError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        throw new NetworkError('Request timeout', error);
      }
      
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      throw new NetworkError('Network request failed', error as Error);
    }
  }

  throw new NetworkError('Max retries exceeded');
}

// Convenience methods
export const apiClient = {
  /**
   * GET request
   */
  get: <T = unknown>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) =>
    makeRequest<T>(endpoint, { ...config, method: 'GET' }),

  /**
   * POST request
   */
  post: <T = unknown>(endpoint: string, data?: unknown, config?: Omit<RequestConfig, 'method'>) =>
    makeRequest<T>(endpoint, { ...config, method: 'POST', body: data }),

  /**
   * PUT request
   */
  put: <T = unknown>(endpoint: string, data?: unknown, config?: Omit<RequestConfig, 'method'>) =>
    makeRequest<T>(endpoint, { ...config, method: 'PUT', body: data }),

  /**
   * DELETE request
   */
  delete: <T = unknown>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) =>
    makeRequest<T>(endpoint, { ...config, method: 'DELETE' }),

  /**
   * PATCH request
   */
  patch: <T = unknown>(endpoint: string, data?: unknown, config?: Omit<RequestConfig, 'method'>) =>
    makeRequest<T>(endpoint, { ...config, method: 'PATCH', body: data }),
};

// Legacy exports for backward compatibility
export const login = async (email: string, password: string) => {
  const response = await apiClient.post('/api/v1/auth/login', {
    username: email,
    password,
  }, { 
    requiresAuth: false, 
    contentType: 'form-urlencoded' 
  });
  
  return response.data;
};

export default apiClient; 