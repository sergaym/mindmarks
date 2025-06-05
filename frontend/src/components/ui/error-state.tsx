import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ 
  title = "Error Loading Content",
  message = "There was an error loading your content. Please try again later.",
  onRetry,
  className = "flex h-[calc(100vh-64px)] items-center justify-center"
}: ErrorStateProps) {
  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
        <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
        {onRetry && (
          <Button onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    </div>
  );
} 