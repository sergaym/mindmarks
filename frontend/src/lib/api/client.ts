/**
 * Simple API client for making requests to the backend
 */

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'; 

/**
 * Get the access token from localStorage
 */
function getToken(): { token: string, type: string } | null {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('access_token');
  const tokenType = localStorage.getItem('token_type') || 'Bearer';
  
  if (!token) return null;
  return { token, type: tokenType };
}

/**
 * Make a GET request to the API
 */
export async function apiGet<T = unknown>(endpoint: string): Promise<T> {
  const tokenData = getToken();
  const headers: HeadersInit = {};
  
  if (tokenData) {
    headers['Authorization'] = `${tokenData.type} ${tokenData.token}`;
  }
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });
    
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
 * Make a POST request to the API
 */
export async function apiPost<T = unknown>(endpoint: string, data: Record<string, unknown>, isFormUrlEncoded = false): Promise<T> {
  const tokenData = getToken();
  const headers: HeadersInit = {
    'Content-Type': isFormUrlEncoded ? 'application/x-www-form-urlencoded' : 'application/json',
  };
  
  if (tokenData) {
    headers['Authorization'] = `${tokenData.type} ${tokenData.token}`;
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
export async function login(username: string, password: string): Promise<{ access_token: string; token_type: string }> {
  try {
    console.log("Making login request with username:", username);
    
    const formData = {
      username,
      password,
    };
    
    const result = await apiPost<{ access_token: string; token_type: string }>('/api/v1/auth/login', formData, true);
    
    console.log("Login API response successful:", { 
      tokenReceived: !!result.access_token,
      tokenType: result.token_type 
    });
    
    // Store token type for future requests
    if (typeof window !== 'undefined' && result.token_type) {
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