import { jwtDecode } from 'jwt-decode';

// Define user types
export type User = {
  id: string;
  email: string;
  name?: string;
  accessToken?: string;
};

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface JwtPayload {
  sub: string;
  exp: number;
  token_type?: string;
  [key: string]: string | number | boolean | undefined;
}

export type ApiError = {
  status: number;
  message: string;
  code?: string;
};

export type AuthResult<T> = 
  | { success: true; data: T } 
  | { success: false; error: ApiError };

/**
 * Makes a request to the API with the appropriate content type
 */
async function apiRequest<T>(
  endpoint: string, 
  method: string, 
  data?: Record<string, unknown>, 
  token?: string,
  contentType: 'json' | 'form-urlencoded' = 'form-urlencoded'
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': contentType === 'json' 
      ? 'application/json'
      : 'application/x-www-form-urlencoded',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Prepare request options
  const options: RequestInit = {
    method,
    headers,
    credentials: 'include', // Include cookies in requests
  };

  // Format the request body based on content type
  if (data) {
    if (contentType === 'json') {
      options.body = JSON.stringify(data);
    } else {
      // Convert data to form-urlencoded format
      const formData = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      options.body = formData.toString();
    }
  }

  // Make the request
  const apiUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}${endpoint}`;
  const response = await fetch(apiUrl, options);

  // Handle errors
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
      // If JSON parsing fails, use response text
      errorMessage = await response.text() || `HTTP ${response.status} Error`;
    }

    const error: ApiError = {
      status: response.status,
      message: errorMessage,
      code: errorCode
    };
    throw error;
  }

  // Return response data
  return response.json() as T;
}

/**
 * Get user profile data
 */
export async function fetchUser(token: string): Promise<AuthResult<User>> {
  try {
    const userData = await apiRequest<User>('/api/v1/users/me', 'GET', undefined, token);
    return { success: true, data: userData };
  } catch (err) {
    const error = err as ApiError;
    return { 
      success: false, 
      error: {
        status: error.status || 500,
        message: error.message || 'Failed to fetch user data',
        code: 'USER_FETCH_ERROR'
      }
    };
  }
}

/**
 * Login user
 */
export async function loginUser(email: string, password: string): Promise<AuthResult<{ user: User; tokens: TokenResponse }>> {
  try {
    // Backend expects username/password for login
    const response = await apiRequest<TokenResponse>(
      '/api/v1/auth/login', 
      'POST', 
      {
        username: email, // Backend expects username, but we use email
        password,
      },
      undefined,
      'form-urlencoded' // Login uses form-urlencoded format
    );

    if (!response?.access_token) {
      return { 
        success: false, 
        error: {
          status: 401,
          message: 'Authentication failed: No access token received',
          code: 'AUTH_NO_TOKEN'
        }
      };
    }

    // Store access token in memory for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('access_token', response.access_token);
      localStorage.setItem('token_type', response.token_type);
      
      // Set expiry time for proactive refresh
      const decodedToken = jwtDecode<JwtPayload>(response.access_token);
      if (decodedToken.exp) {
        sessionStorage.setItem('token_expiry', decodedToken.exp.toString());
      }
    }

    // Store refresh token in HttpOnly cookie via API endpoint
    await setRefreshTokenCookie(response.refresh_token);

    // Basic user info
    const user = {
      id: 'user-id', // This will be replaced when we fetch the actual user data
      email: email,
      name: email,
      accessToken: response.access_token,
    };

    return {
      success: true,
      data: {
        user, 
        tokens: response
      }
    };
  } catch (err) {
    console.error('Login error:', err);
    const error = err as ApiError;
    return { 
      success: false, 
      error: {
        status: error.status || 401,
        message: error.message || 'Authentication failed',
        code: 'AUTH_FAILED'
      }
    };
  }
}

/**
 * Register a new user
 */
export async function registerUser(email: string, password: string, name?: string): Promise<AuthResult<{ message: string }>> {
  try {
    // Use the same apiRequest approach as loginUser for consistency
    const response = await apiRequest<{ message: string }>(
      '/api/v1/auth/register', 
      'POST', 
      {
        email,
        password,
        full_name: name || '',
        is_active: true,
        is_superuser: false
      },
      undefined,
      'json' // Explicitly use JSON format
    );
    
    return { success: true, data: response };
  } catch (err) {
    console.error('Registration error:', err);
    const error = err as ApiError;
    return { 
      success: false, 
      error: {
        status: error.status || 500,
        message: error.message || 'Registration failed',
        code: 'REGISTRATION_FAILED'
      }
    };
  }
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<AuthResult<{ success: boolean }>> {
  try {
    // Call logout endpoint to revoke the refresh token
    // The cookie will be included automatically with credentials: 'include'
    await apiRequest<{ message: string }>(
      '/api/v1/auth/logout', 
      'POST', 
      {},
      undefined,
      'json'
    );
    
    // Clear stored tokens
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('token_expiry');
      localStorage.removeItem('token_type');
      
      // Also clear the refresh token cookie by setting an expired one
      await clearRefreshTokenCookie();
    }
    
    return { 
      success: true, 
      data: { success: true } 
    };
  } catch (err) {
    console.error('Logout error:', err);
    
    // Still clear tokens even if API call fails
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('token_expiry');
      localStorage.removeItem('token_type');
      await clearRefreshTokenCookie();
    }
    
    // Even if the API call fails, we consider the logout successful on the client side
    return {
      success: true,
      data: { success: true }
    };
  }
}

/**
 * Check if token is about to expire and needs refreshing
 * Returns true if token will expire within the buffer time
 */
export function isTokenExpiringSoon(bufferMinutes = 5): boolean {
  try {
    const tokenExpiry = sessionStorage.getItem('token_expiry');
    if (!tokenExpiry) {
      return true; // If we don't know when it expires, assume it's expiring soon
    }
    
    const expiryTime = parseInt(tokenExpiry, 10) * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const bufferTime = bufferMinutes * 60 * 1000; // Convert minutes to milliseconds
    
    return expiryTime - currentTime < bufferTime;
  } catch (err) {
    console.error('Error checking token expiry:', err);
    return true; // If there's an error, assume it's expiring soon
  }
}

/**
 * Refresh an access token using a refresh token from HttpOnly cookie
 */
export async function refreshAccessToken(): Promise<AuthResult<TokenResponse>> {
  try {
    // The refresh token is sent automatically via HttpOnly cookie
    const response = await apiRequest<TokenResponse>(
      '/api/v1/auth/refresh', 
      'POST', 
      {},
      undefined,
      'json'
    );
    
    if (!response || !response.access_token) {
      return { 
        success: false, 
        error: {
          status: 401,
          message: 'Failed to refresh token',
          code: 'REFRESH_FAILED'
        }
      };
    }
    
    // Update stored access token and expiry time
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('access_token', response.access_token);
      localStorage.setItem('token_type', response.token_type);
      
      // Update expiry time
      const decodedToken = jwtDecode<JwtPayload>(response.access_token);
      if (decodedToken.exp) {
        sessionStorage.setItem('token_expiry', decodedToken.exp.toString());
      }
    }
    
    return { success: true, data: response };
  } catch (err) {
    console.error('Token refresh error:', err);
    const error = err as ApiError;
    return { 
      success: false, 
      error: {
        status: error.status || 401,
        message: error.message || 'Failed to refresh token',
        code: 'REFRESH_FAILED'
      }
    };
  }
}

/**
 * Store refresh token in HttpOnly cookie via a dedicated backend endpoint
 */
async function setRefreshTokenCookie(refreshToken: string): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/set-refresh-cookie`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      credentials: 'include', // Important for cookies
    });
  } catch (err) {
    console.error('Error setting refresh token cookie:', err);
    // Fallback to localStorage only if cookie setting fails
    localStorage.setItem('refresh_token', refreshToken);
  }
}

/**
 * Clear refresh token cookie
 */
async function clearRefreshTokenCookie(): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/clear-refresh-cookie`, {
      method: 'POST',
      credentials: 'include',
    });
    
    // Also clear any fallback in localStorage
    localStorage.removeItem('refresh_token');
  } catch (err) {
    console.error('Error clearing refresh token cookie:', err);
    // Still remove from localStorage if clearing cookie fails
    localStorage.removeItem('refresh_token');
  }
}

/**
 * Get the current access token from storage
 * @internal Exported for testing
 */
export function __internal_getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  const accessToken = sessionStorage.getItem('access_token');
  if (!accessToken) {
    // Legacy support - check localStorage
    return localStorage.getItem('access_token');
  }
  
  return accessToken;
}

/**
 * Get appropriate authentication headers
 * @internal Exported for testing
 */
export function __internal_getAuthHeaders(): Record<string, string> {
  const accessToken = __internal_getAccessToken();
  const tokenType = localStorage.getItem('token_type') || 'Bearer';
  
  if (!accessToken) return {};
  
  return {
    'Authorization': `${tokenType} ${accessToken}`
  };
} 