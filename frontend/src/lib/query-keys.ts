/**
 * Query Keys for consistent cache management
 * Following React Query / TanStack Query patterns
 */

export const queryKeys = {
  // Content queries
  content: {
    all: ['content'] as const,
    user: (userId: string) => [...queryKeys.content.all, 'user', userId] as const,
    detail: (id: string) => [...queryKeys.content.all, 'detail', id] as const,
    byType: (type: string) => [...queryKeys.content.all, 'type', type] as const,
    byStatus: (status: string) => [...queryKeys.content.all, 'status', status] as const,
  },

  // Auth queries
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },

  // Upload queries
  uploads: {
    all: ['uploads'] as const,
    byUser: (userId: string) => [...queryKeys.uploads.all, 'user', userId] as const,
  },
} as const;

export default queryKeys; 