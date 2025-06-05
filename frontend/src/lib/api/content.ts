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
