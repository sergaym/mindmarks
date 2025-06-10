// API barrel exports for clean imports
export * from './auth';
export * from './content';
export { client, apiRequest, ApiError, NetworkError, AuthenticationError } from './client';

// Re-export commonly used types
export type { 
  ContentApiError, 
  CreateContentRequest, 
  UpdateContentRequest,
  BackendContentListItem,
  BackendContentRead,
  BackendContentResponse,
  CreateContentResponse
} from './content';

export type { 
  AuthResult, 
  User as AuthUser, 
  TokenResponse,
  JwtPayload,
  PasswordResetRequest,
  PasswordResetData
} from './auth';

export type {
  RequestConfig,
  ApiResponse
} from './client';

// Default exports - unified client
export { default as apiClient } from './client';
export { client as default } from './client'; 