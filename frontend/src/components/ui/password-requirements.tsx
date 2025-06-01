'use client';

import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordRequirementsProps {
  password: string;
  show?: boolean;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  {
    label: 'At least 8 characters long',
    test: (password) => password.length >= 8,
  },
  {
    label: 'Contains at least one letter',
    test: (password) => /[a-zA-Z]/.test(password),
  },
  {
    label: 'Contains at least one number',
    test: (password) => /\d/.test(password),
  },
];

export function PasswordRequirements({ password, show = true }: PasswordRequirementsProps) {
  if (!show || !password) return null;

  return (
    <div className="mt-2 p-3 bg-muted/50 rounded-md border">
      <p className="text-xs font-medium text-muted-foreground mb-2">Password Requirements:</p>
      <ul className="space-y-1">
        {requirements.map((requirement, index) => {
          const isValid = requirement.test(password);
          return (
            <li key={index} className="flex items-center text-xs">
              <div className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center mr-2 flex-shrink-0",
                isValid 
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}>
                {isValid ? (
                  <Check className="w-2.5 h-2.5" />
                ) : (
                  <X className="w-2.5 h-2.5" />
                )}
              </div>
              <span className={cn(
                isValid 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : "text-muted-foreground"
              )}>
                {requirement.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
} 