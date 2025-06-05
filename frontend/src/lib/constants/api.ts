/**
 * API Configuration Constants
 * Centralized configuration following Next.js best practices
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    USER: '/api/v1/users/me',
  },
  CONTENT: {
    LIST: (userId: string) => `/api/v1/content/user/${userId}`,
    CREATE: '/api/v1/content',
    DETAIL: (id: string) => `/api/v1/content/${id}`,
    UPDATE: (id: string) => `/api/v1/content/${id}`,
    DELETE: (id: string) => `/api/v1/content/${id}`,
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const; 