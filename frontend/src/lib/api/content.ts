import { ContentItem, ContentType, User, ContentPage, EditorContent } from '@/types/content';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Error class for content API errors
export class ContentApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ContentApiError';
  }
}

// Request types
export interface CreateContentRequest {
  title: string;
  type: ContentType;
  url?: string;
  description?: string;
  tags?: string[];
  status: 'planned' | 'in-progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
}

export interface UpdateContentRequest {
  title?: string;
  type?: ContentType;
  url?: string;
  description?: string;
  tags?: string[];
  status?: 'planned' | 'in-progress' | 'completed' | 'archived';
  priority?: 'low' | 'medium' | 'high';
  content?: EditorContent[];
  summary?: string;
  keyTakeaways?: string[];
  author?: string;
  publishedDate?: Date;
  estimatedReadTime?: number;
  rating?: number;
  progress?: number;
  isPublic?: boolean;
}

// Response types
export interface CreateContentResponse {
  id: string;
  content: ContentItem;
  contentPage: ContentPage;
}

/**
 * Get authentication headers
 */
function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
  const tokenType = localStorage.getItem('token_type') || 'Bearer';
  
  if (!token) return {};
  
  return {
    'Authorization': `${tokenType} ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Make API request with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  method: string = 'GET',
  data?: unknown
): Promise<T> {
  const headers = getAuthHeaders();
  
  const options: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (!response.ok) {
    let errorMessage: string;
    let errorCode: string | undefined;

    try {
      const errorData = await response.json();
      
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
      errorMessage = await response.text() || `HTTP ${response.status} Error`;
    }

    throw new ContentApiError(
      response.status,
      errorMessage,
      errorCode
    );
  }

  return response.json() as T;
}

