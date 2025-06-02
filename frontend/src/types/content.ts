// Content and Kanban types for the application

export type ContentType = 'book' | 'article' | 'video' | 'podcast' | 'course' | 'research' | 'note' | 'other';

export interface User {
  id: string;
  name: string;
  image: string;
}

export interface ContentItem {
  id: string;
  name: string;
  startAt: Date;
  endAt?: Date;
  column: string;
  owner: User;
  type: ContentType;
  description?: string;
  tags?: string[];
  url?: string;
  [key: string]: unknown; // Allow additional properties for compatibility with Kanban component
}

export interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  [key: string]: unknown; // Add index signature to make it compatible with Record<string, unknown>
}

// Status types for data fetching
export type Status = 'idle' | 'loading' | 'success' | 'error';

// Response type for API calls
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: Status;
} 