import { jwtDecode } from 'jwt-decode';
import { client, ApiError } from './client';

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

export type AuthResult<T> = 
  | { success: true; data: T } 
  | { success: false; error: ApiError };

export interface PasswordResetRequest {
  message: string;
}

export interface PasswordResetData {
  token: string;
  password: string;
}

/**
 * Convert API errors to AuthResult format
 */
function handleApiError(error: unknown): { success: false; error: ApiError } {
  if (error instanceof ApiError) {
    return { success: false, error };
  }
  
  console.error('Unexpected error:', error);
  return {
    success: false,
    error: new ApiError(500, 'An unexpected error occurred', 'UNKNOWN_ERROR')
  };
}

/**
 * Get user profile data
 */
export async function fetchUser(token: string): Promise<AuthResult<User>> {
  try {
    const userData = await client.get<User>('/api/v1/users/me', {
      headers: { 'Authorization': `Bearer ${token}` },
      requiresAuth: false // We're providing the token manually
    });
    return { success: true, data: userData };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Login user
 */
export async function loginUser(email: string, password: string): Promise<AuthResult<{ user: User; tokens: TokenResponse }>> {
  try {
    // Backend expects username/password for login
    const response = await client.post<TokenResponse>(
      '/api/v1/auth/login',
      {
        username: email, // Backend expects username, but we use email
        password,
      },
      {
        requiresAuth: false,
        contentType: 'form' // Login uses form-urlencoded format
      }
    );

    if (!response?.access_token) {
      return { 
        success: false, 
        error: new ApiError(401, 'Authentication failed: No access token received', 'AUTH_NO_TOKEN')
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
  } catch (error) {
    console.error('Login error:', error);
    return handleApiError(error);
  }
}

/**
 * Register a new user
 */
export async function registerUser(email: string, password: string, name?: string): Promise<AuthResult<{ message: string }>> {
  try {
    const response = await client.post<{ message: string }>(
      '/api/v1/auth/register',
      {
        email,
        password,
        full_name: name || '',
        is_active: true,
        is_superuser: false
      },
      {
        requiresAuth: false,
        contentType: 'json'
      }
    );
    
    return { success: true, data: response };
  } catch (error) {
    console.error('Registration error:', error);
    return handleApiError(error);
  }
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<AuthResult<{ success: boolean }>> {
  try {
    // Call logout endpoint to revoke the refresh token
    await client.post<{ message: string }>(
      '/api/v1/auth/logout',
      {},
      {
        requiresAuth: false, // Don't require auth as we might be logging out due to expired token
        contentType: 'json'
      }
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
  } catch (error) {
    console.error('Logout error:', error);
    
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
    const response = await client.post<TokenResponse>(
      '/api/v1/auth/refresh',
      {},
      {
        requiresAuth: false, // Refresh uses cookie, not authorization header
        contentType: 'json'
      }
    );
    
    if (!response || !response.access_token) {
      return { 
        success: false, 
        error: new ApiError(401, 'Failed to refresh token', 'REFRESH_FAILED')
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
  } catch (error) {
    console.error('Token refresh error:', error);
    return handleApiError(error);
  }
}

/**
 * Store refresh token in HttpOnly cookie via a dedicated backend endpoint
 */
async function setRefreshTokenCookie(refreshToken: string): Promise<void> {
  try {
    await client.post(
      '/api/v1/auth/set-refresh-cookie',
      { refresh_token: refreshToken },
      {
        requiresAuth: false,
        contentType: 'json'
      }
    );
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
    await client.post(
      '/api/v1/auth/clear-refresh-cookie',
      {},
      {
        requiresAuth: false,
        contentType: 'json'
      }
    );
    
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

/**
 * Request password reset (forgot password)
 */
export async function requestPasswordReset(email: string): Promise<AuthResult<PasswordResetRequest>> {
  try {
    console.log('Requesting password reset for:', email);

    const response = await client.post<PasswordResetRequest>(
      '/api/v1/auth/forgot-password',
      {
        email: email.toLowerCase().trim(),
      },
      {
        requiresAuth: false,
        contentType: 'json'
      }
    );

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('Password reset request failed:', error);
    
    if (error instanceof ApiError) {
      let message = 'Failed to send password reset email. Please try again.';
      
      // Handle specific error cases
      if (error.status === 404) {
        // For security, don't reveal if email exists or not
        message = 'If an account with this email exists, you will receive password reset instructions.';
      } else if (error.status === 429) {
        message = 'Too many password reset requests. Please wait before trying again.';
      } else if (error.status >= 500) {
        message = 'Server error occurred. Please try again later.';
      } else if (error.message) {
        // Try to extract user-friendly message from API error
        try {
          const parsedError = JSON.parse(error.message);
          if (parsedError.detail && typeof parsedError.detail === 'string') {
            message = parsedError.detail;
          }
        } catch {
          // If parsing fails, use the raw message if it's user-friendly
          if (error.message.length < 200 && !error.message.includes('{')) {
            message = error.message;
          }
        }
      }

      return {
        success: false,
        error: new ApiError(error.status, message, error.code),
      };
    }

    return handleApiError(error);
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<AuthResult<{ message: string }>> {
  try {
    console.log('Resetting password with token');

    const response = await client.post<{ message: string }>(
      '/api/v1/auth/reset-password',
      {
        token: token.trim(),
        password: newPassword,
      },
      {
        requiresAuth: false,
        contentType: 'json'
      }
    );

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('Password reset failed:', error);
    
    if (error instanceof ApiError) {
      let message = 'Failed to reset password. Please try again.';
      
      // Handle specific error cases
      if (error.status === 400) {
        if (error.message.toLowerCase().includes('token')) {
          message = 'Invalid or expired reset token. Please request a new password reset.';
        } else if (error.message.toLowerCase().includes('password')) {
          message = 'Password does not meet requirements. Please ensure it\'s at least 8 characters long.';
        } else {
          message = 'Invalid request. Please check your information and try again.';
        }
      } else if (error.status === 404) {
        message = 'Reset token not found. Please request a new password reset.';
      } else if (error.status === 410) {
        message = 'Reset token has expired. Please request a new password reset.';
      } else if (error.status === 429) {
        message = 'Too many password reset attempts. Please wait before trying again.';
      } else if (error.status >= 500) {
        message = 'Server error occurred. Please try again later.';
      } else if (error.message) {
        // Try to extract user-friendly message from API error
        try {
          const parsedError = JSON.parse(error.message);
          if (parsedError.detail && typeof parsedError.detail === 'string') {
            message = parsedError.detail;
          }
        } catch {
          // If parsing fails, use the raw message if it's user-friendly
          if (error.message.length < 200 && !error.message.includes('{')) {
            message = error.message;
          }
        }
      }

      return {
        success: false,
        error: new ApiError(error.status, message, error.code),
      };
    }

    return handleApiError(error);
  }
} 