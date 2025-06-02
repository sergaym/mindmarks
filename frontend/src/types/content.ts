// Content and Kanban types for the application

export type ContentType = 'book' | 'article' | 'video' | 'podcast' | 'course' | 'research' | 'note' | 'other';

export interface User {
  id: string;
  name: string;
  image: string;
}

// Rich content page structure (Notion-style)
export interface ContentPage {
  id: string;
  title: string;
  type: ContentType;
  url?: string;
  tags: string[];
  status: 'planned' | 'in-progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  
  // Rich metadata
  author?: string;
  publishedDate?: Date;
  estimatedReadTime?: number; // in minutes
  rating?: number; // 1-5 stars
  progress?: number; // 0-100%
  
  // Rich content (Plate editor)
  content: any[]; // Plate editor JSON content
  summary?: string;
  keyTakeaways?: string[];
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: User;
  lastEditedBy: User;
  isPublic: boolean;
  collaborators: User[];
}

// Simplified version for dashboard/kanban view
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