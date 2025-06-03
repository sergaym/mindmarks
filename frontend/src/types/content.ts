// Content and Kanban types for the application

export type ContentType = 'book' | 'article' | 'video' | 'podcast' | 'course' | 'research' | 'note' | 'other';

export interface User {
  id: string;
  name: string;
  image: string;
}

// Type for editor content structure (Plate editor)
// Plate editor uses a specific structure with type and children
export type PlateTextNode = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  [key: string]: unknown;
};

export type PlateElementNode = {
  type: string; // 'p', 'h1', 'h2', 'ul', 'li', etc.
  children: Array<PlateTextNode | PlateElementNode>;
  [key: string]: unknown;
};

// Single editor content element for Plate
export type EditorContent = PlateElementNode;

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
  content: EditorContent[]; // Plate editor JSON content
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
  progress?: number;
  priority?: 'low' | 'medium' | 'high';
  [key: string]: unknown; // Allow additional properties for compatibility with Kanban component
}

// Content template for different types
export interface ContentTemplate {
  type: ContentType;
  title: string;
  description: string;
  icon: string;
  defaultContent: EditorContent[]; // Plate editor template
  suggestedTags: string[];
  estimatedTimeRange?: [number, number]; // min/max minutes
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

// Content page metadata for forms
export interface ContentPageMetadata {
  title: string;
  type: ContentType;
  url?: string;
  tags: string[];
  status: 'planned' | 'in-progress' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high';
  author?: string;
  publishedDate?: Date;
  estimatedReadTime?: number;
  isPublic: boolean;
} 