import { signOut } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Helper function to check API responses
 */
export const checkResponse = async <T = unknown>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`HTTP error! Status: ${response.status}, Error: ${errorText}`);
  }
  
  if (response.status === 204) {
    return {} as T;
  }
  
  return response.json() as T;
};

/**
 * Generic function to make API calls with proper error handling
 */
export const fetchClient = async <T = unknown>(
  endpoint: string,
  method = 'GET',
  token?: string | null,
  data?: Record<string, unknown>
): Promise<T> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add authorization header if token is provided
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  // Add request body for non-GET methods
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    
    // Handle authentication errors
    if (response.status === 401 && token) {
      // Token is expired or invalid, sign out the user
      await signOut({ redirectTo: '/login?error=session_expired' });
      throw new Error('Authentication failed. Please sign in again.');
    }
    
    return await checkResponse<T>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`API request failed: ${error.message}`);
    } else {
      throw new Error('An unknown error occurred during the API request');
    }
  }
}; 