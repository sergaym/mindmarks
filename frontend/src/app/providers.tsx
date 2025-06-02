'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { UserProvider } from '@/contexts/user-context';

interface ProvidersProps {
  children: ReactNode;
}

// Global providers wrapper - in the future, add any global providers here
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" enableSystem>
      <UserProvider>
        {children}
      </UserProvider>
    </ThemeProvider>
  );
} 