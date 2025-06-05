// API barrel exports for clean imports
export * from './auth';
export * from './content';
export * from './client';

// Re-export commonly used types
export type { ContentApiError, CreateContentRequest, UpdateContentRequest } from './content';
export type { AuthResult, User as AuthUser, ApiError } from './auth';

// Default client instance
export { default as apiClient } from './client'; 