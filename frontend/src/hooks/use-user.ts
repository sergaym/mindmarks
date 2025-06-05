import { useContext } from 'react';
import { UserContext, UserContextType } from '@/contexts/user-context';

/**
 * Custom hook for accessing user state and authentication
 * 
 * @returns User context with state and actions
 * @throws Error if used outside UserProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isLoading, isAuthenticated } = useUser();
 *   
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!isAuthenticated) return <div>Please log in</div>;
 *   
 *   return <div>Welcome, {user.name}!</div>;
 * }
 * ```
 */
export function useUser(): UserContextType {
  const context = useContext(UserContext);
  
  if (context === undefined) {
    throw new Error(
      'useUser must be used within a UserProvider. ' +
      'Make sure your component is wrapped with <UserProvider>.'
    );
  }
  
  return context;
} 