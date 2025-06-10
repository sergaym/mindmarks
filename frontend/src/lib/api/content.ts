import { ContentItem, ContentType, User, ContentPage, EditorContent } from '@/types/content';
import { client, ApiError } from './client';

// Legacy alias for backward compatibility
export class ContentApiError extends ApiError {
  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(status, message, code, details);
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
    children: Array<Record<string, unknown>>;
    attrs?: Record<string, unknown>;
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
 * Convert backend ContentListItem to frontend ContentItem
 */
function backendContentToFrontend(backendContent: BackendContentListItem): ContentItem {
  // Convert backend user to frontend User, providing default image if missing
  const convertUser = (backendUser: { id: string; name: string; image?: string }): User => ({
    id: backendUser.id,
    name: backendUser.name,
    image: backendUser.image || '/default-avatar.png', // Provide default image
  });

  return {
    id: backendContent.id,
    name: backendContent.name,
    type: backendContent.type,
    startAt: new Date(backendContent.start_at),
    endAt: backendContent.end_at ? new Date(backendContent.end_at) : undefined,
    column: backendContent.column,
    owner: convertUser(backendContent.owner),
    description: backendContent.description,
    tags: backendContent.tags,
    url: backendContent.url,
    progress: backendContent.progress,
    priority: backendContent.priority,
  };
}

/**
 * Convert backend ContentRead to frontend ContentPage
 */
function backendContentPageToFrontend(backendPage: BackendContentRead): ContentPage {
  // Convert backend user to frontend User, providing default image if missing
  const convertUser = (backendUser: { id: string; name: string; image?: string }): User => ({
    id: backendUser.id,
    name: backendUser.name,
    image: backendUser.image || '/default-avatar.png', // Provide default image
  });

  return {
    id: backendPage.id,
    title: backendPage.title,
    type: backendPage.type,
    url: backendPage.url,
    tags: backendPage.tags,
    status: backendPage.status,
    priority: backendPage.priority,
    content: backendPage.content as EditorContent[],
    summary: backendPage.summary,
    keyTakeaways: backendPage.key_takeaways,
    progress: backendPage.progress,
    createdAt: new Date(backendPage.created_at),
    updatedAt: new Date(backendPage.updated_at),
    author: backendPage.author,
    publishedDate: backendPage.published_date ? new Date(backendPage.published_date) : undefined,
    estimatedReadTime: backendPage.estimated_read_time,
    rating: backendPage.rating,
    isPublic: backendPage.is_public,
    createdBy: convertUser(backendPage.created_by),
    lastEditedBy: backendPage.last_edited_by ? convertUser(backendPage.last_edited_by) : convertUser(backendPage.created_by),
    collaborators: backendPage.collaborators.map(collab => convertUser(collab.user)),
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
export async function fetchUserContent(): Promise<ContentItem[]> {
  try {
    const response = await client.get<BackendContentListItem[]>('/api/v1/content/me');
    return response.map(backendContentToFrontend);
  } catch (error) {
    console.error('Error fetching user content:', error);
    
    // Convert to legacy ContentApiError for backward compatibility
    if (error instanceof ApiError) {
      throw new ContentApiError(error.status, error.message, error.code, error.details);
    }
    throw error;
  }
}

/**
 * Create new content item
 */
export async function createContent(
  request: CreateContentRequest
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

    const response = await client.post<BackendContentResponse>('/api/v1/content', backendRequest);
    
    return {
      id: response.id,
      content: backendContentToFrontend(response.content),
      contentPage: backendContentPageToFrontend(response.content_page),
    };
  } catch (error) {
    console.error('Error creating content:', error);
    
    // Convert to legacy ContentApiError for backward compatibility
    if (error instanceof ApiError) {
      throw new ContentApiError(error.status, error.message, error.code, error.details);
    }
    throw error;
  }
}

/**
 * Fetch content page by ID
 */
export async function fetchContentById(id: string): Promise<ContentPage | null> {
  try {
    const response = await client.get<BackendContentRead>(`/api/v1/content/${id}`);
    return backendContentPageToFrontend(response);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    console.error('Error fetching content by ID:', error);
    
    // Convert to legacy ContentApiError for backward compatibility
    if (error instanceof ApiError) {
      throw new ContentApiError(error.status, error.message, error.code, error.details);
    }
    throw error;
  }
}

/**
 * Update content item
 */
export async function updateContent(
  id: string,
  request: UpdateContentRequest
): Promise<ContentPage> {
  try {
    // Transform frontend request to backend format
    const backendRequest: Record<string, unknown> = {};
    
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

    const response = await client.patch<BackendContentRead>(`/api/v1/content/${id}`, backendRequest);
    return backendContentPageToFrontend(response);
  } catch (error) {
    console.error('Error updating content:', error);
    
    // Convert to legacy ContentApiError for backward compatibility
    if (error instanceof ApiError) {
      throw new ContentApiError(error.status, error.message, error.code, error.details);
    }
    throw error;
  }
}

/**
 * Delete content item
 */
export async function deleteContent(id: string): Promise<void> {
  try {
    await client.delete<void>(`/api/v1/content/${id}`);
  } catch (error) {
    console.error('Error deleting content:', error);
    
    // Convert to legacy ContentApiError for backward compatibility
    if (error instanceof ApiError) {
      throw new ContentApiError(error.status, error.message, error.code, error.details);
    }
    throw error;
  }
} 