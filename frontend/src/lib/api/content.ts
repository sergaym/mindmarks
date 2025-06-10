import { ContentItem, ContentType, User, ContentPage, EditorContent } from '@/types/content';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  status: 'planned' | 'in_progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
}

export interface UpdateContentRequest {
  title?: string;
  type?: ContentType;
  url?: string;
  description?: string;
  tags?: string[];
  status?: 'planned' | 'in_progress' | 'completed' | 'archived';
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

// Backend response types (matching the backend schemas)
export interface BackendContentListItem {
  id: string;
  name: string;
  type: ContentType;
  start_at: string; // ISO date string
  end_at?: string;
  column: string;
  owner: {
    id: string;
    name: string;
    image?: string;
  };
  description?: string;
  tags: string[];
  url?: string;
  progress: number;
  priority: 'low' | 'medium' | 'high';
}

export interface BackendContentRead {
  id: string;
  title: string;
  type: ContentType;
  url?: string;
  summary?: string;
  tags: string[];
  status: 'planned' | 'in_progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  content: Array<{
    type: string;
    children: Array<{ [key: string]: any }>;
    attrs?: { [key: string]: any };
  }>;
  key_takeaways: string[];
  progress: number;
  created_at: string;
  updated_at: string;
  author?: string;
  published_date?: string;
  estimated_read_time?: number;
  rating?: number;
  is_public: boolean;
  created_by: {
    id: string;
    name: string;
    image?: string;
  };
  last_edited_by?: {
    id: string;
    name: string;
    image?: string;
  };
  collaborators: Array<{
    user: {
      id: string;
      name: string;
      image?: string;
    };
    permission: string;
    invited_at: string;
    accepted_at?: string;
  }>;
}

export interface BackendContentResponse {
  id: string;
  content: BackendContentListItem;
  content_page: BackendContentRead;
}

// Response types
export interface CreateContentResponse {
  id: string;
  content: ContentItem;
  contentPage: ContentPage;
}

/**
 * Get authentication headers (for future API implementation)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// API request function will be implemented when backend endpoints are ready
// async function apiRequest<T>(endpoint: string, method: string = 'GET', data?: unknown): Promise<T>

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
    const response = await apiRequest<BackendContentListItem[]>('/api/v1/content/me');
    return response.map(backendContentToFrontend);
  } catch (error) {
    console.error('Error fetching user content:', error);
    throw error;
  }
}

/**
 * Create new content item
 */
export async function createContent(
  request: CreateContentRequest,
  user: User
): Promise<CreateContentResponse> {
  try {
    // Transform frontend request to backend format
    const backendRequest = {
      title: request.title,
      type: request.type,
      url: request.url,
      description: request.description,
      tags: request.tags || [],
      status: request.status,
      priority: request.priority,
      content: getDefaultContent(request.type),
    };

    const response = await apiRequest<BackendContentResponse>('/api/v1/content', 'POST', backendRequest);
    
    return {
      id: response.id,
      content: backendContentToFrontend(response.content),
      contentPage: backendContentPageToFrontend(response.content_page),
    };
  } catch (error) {
    console.error('Error creating content:', error);
    throw error;
  }
}

/**
 * Fetch content page by ID
 */
export async function fetchContentById(id: string, user: User): Promise<ContentPage | null> {
  try {
    const response = await apiRequest<BackendContentRead>(`/api/v1/content/${id}`);
    return backendContentPageToFrontend(response);
  } catch (error) {
    if (error instanceof ContentApiError && error.status === 404) {
      return null;
    }
    console.error('Error fetching content by ID:', error);
    throw error;
  }
}

/**
 * Update content item
 */
export async function updateContent(
  id: string,
  request: UpdateContentRequest,
  user: User
): Promise<ContentPage> {
  try {
    // Transform frontend request to backend format
    const backendRequest: any = {};
    
    if (request.title !== undefined) backendRequest.title = request.title;
    if (request.type !== undefined) backendRequest.type = request.type;
    if (request.url !== undefined) backendRequest.url = request.url;
    if (request.description !== undefined) backendRequest.description = request.description;
    if (request.tags !== undefined) backendRequest.tags = request.tags;
    if (request.status !== undefined) backendRequest.status = request.status;
    if (request.priority !== undefined) backendRequest.priority = request.priority;
    if (request.content !== undefined) backendRequest.content = request.content;
    if (request.summary !== undefined) backendRequest.summary = request.summary;
    if (request.keyTakeaways !== undefined) backendRequest.key_takeaways = request.keyTakeaways;
    if (request.author !== undefined) backendRequest.author = request.author;
    if (request.publishedDate !== undefined) backendRequest.published_date = request.publishedDate.toISOString();
    if (request.estimatedReadTime !== undefined) backendRequest.estimated_read_time = request.estimatedReadTime;
    if (request.rating !== undefined) backendRequest.rating = request.rating;
    if (request.progress !== undefined) backendRequest.progress = request.progress;
    if (request.isPublic !== undefined) backendRequest.is_public = request.isPublic;

    const response = await apiRequest<BackendContentRead>(`/api/v1/content/${id}`, 'PATCH', backendRequest);
    return backendContentPageToFrontend(response);
  } catch (error) {
    console.error('Error updating content:', error);
    throw error;
  }
}

/**
 * Delete content item
 */
export async function deleteContent(id: string, user: User): Promise<void> {
  try {
    await apiRequest<void>(`/api/v1/content/${id}`, 'DELETE');
  } catch (error) {
    console.error('Error deleting content:', error);
    throw error;
  }
} 