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

/**
 * Convert ContentPage to ContentItem for dashboard view
 */
function contentPageToItem(page: ContentPage): ContentItem {
  return {
    id: page.id,
    name: page.title,
    startAt: page.createdAt,
    endAt: undefined, // Can be enhanced based on content type
    column: page.status,
    owner: page.createdBy,
    type: page.type,
    description: page.summary,
    tags: page.tags,
    url: page.url,
    progress: page.progress,
    priority: page.priority,
  };
}

/**
 * Generate default content template based on content type
 */
function getDefaultContent(type: ContentType): EditorContent[] {
  const baseContent: EditorContent[] = [
    {
      type: 'h1',
      children: [{ text: 'Overview' }],
    },
    {
      type: 'p',
      children: [{ text: 'Add your notes and insights here...' }],
    },
  ];

  switch (type) {
    case 'book':
      return [
        ...baseContent,
        {
          type: 'h2',
          children: [{ text: 'Key Takeaways' }],
        },
        {
          type: 'ul',
          children: [
            {
              type: 'li',
              children: [{ text: 'Main insight 1' }],
            },
            {
              type: 'li',
              children: [{ text: 'Main insight 2' }],
            },
          ],
        },
        {
          type: 'h2',
          children: [{ text: 'Quotes & Highlights' }],
        },
        {
          type: 'p',
          children: [{ text: 'Important quotes and highlighted passages...' }],
        },
      ];
    
    case 'article':
      return [
        ...baseContent,
        {
          type: 'h2',
          children: [{ text: 'Summary' }],
        },
        {
          type: 'p',
          children: [{ text: 'Article summary...' }],
        },
        {
          type: 'h2',
          children: [{ text: 'Key Points' }],
        },
        {
          type: 'ul',
          children: [
            {
              type: 'li',
              children: [{ text: 'Point 1' }],
            },
          ],
        },
      ];
    
    case 'video':
    case 'podcast':
      return [
        ...baseContent,
        {
          type: 'h2',
          children: [{ text: 'Timestamps' }],
        },
        {
          type: 'p',
          children: [{ text: '00:00 - Introduction' }],
        },
        {
          type: 'h2',
          children: [{ text: 'Notes' }],
        },
        {
          type: 'p',
          children: [{ text: 'Your notes here...' }],
        },
      ];
    
    default:
      return baseContent;
  }
}

/**
 * Fetch user's content items
 */
export async function fetchUserContent(user: User): Promise<ContentItem[]> {
  try {
    // For now, return mock data since backend endpoints may not be fully implemented
    // In a real implementation, this would call: /api/v1/content/user/${user.id}
    
    const mockContentPages: ContentPage[] = [
      {
        id: '1',
        title: 'Clean Code',
        type: 'book',
        tags: ['programming', 'best-practices'],
        status: 'in-progress',
        priority: 'high',
        content: getDefaultContent('book'),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        createdBy: user,
        lastEditedBy: user,
        isPublic: false,
        collaborators: [],
        progress: 45,
        author: 'Robert C. Martin',
        estimatedReadTime: 480,
      },
      {
        id: '2',
        title: 'React Best Practices',
        type: 'article',
        url: 'https://example.com/react-best-practices',
        tags: ['react', 'frontend'],
        status: 'planned',
        priority: 'medium',
        content: getDefaultContent('article'),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        createdBy: user,
        lastEditedBy: user,
        isPublic: false,
        collaborators: [],
        estimatedReadTime: 15,
      },
    ];

    return mockContentPages.map(contentPageToItem);
    
    // Real implementation would be:
    // const response = await apiRequest<ContentPage[]>(`/api/v1/content/user/${user.id}`);
    // return response.map(contentPageToItem);
  } catch (error) {
    console.error('Error fetching user content:', error);
    throw error;
  }
}
