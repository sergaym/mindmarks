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
    const errorText = await response.text();
    const error: ApiError = {
      status: response.status,
      message: errorText,
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
  } catch (err) {
    console.error('Token validation error:', err);
    return null;
  }
}; 