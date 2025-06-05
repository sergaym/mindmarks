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
