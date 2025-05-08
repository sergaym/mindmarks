import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto py-8">
      <div className="container px-4 mx-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Mindmarks. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground">
              A product from{' '}
              <Link 
                href="https://eseaemefund.xyz" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-medium hover:text-foreground transition-colors underline underline-offset-4"
              >
                eseaeme
              </Link>
            </p>
          </div>
          
          <div className="flex gap-8">
            <Link 
              href="/privacy" 
              className={cn(
                "text-sm text-muted-foreground hover:text-foreground transition-colors",
                "relative hover:after:w-full after:absolute after:left-0 after:right-0 after:bottom-[-4px] after:h-[1px] after:bg-foreground after:w-0 after:transition-all"
              )}
            >
              Privacy
            </Link>
            <Link 
              href="/terms" 
              className={cn(
                "text-sm text-muted-foreground hover:text-foreground transition-colors",
                "relative hover:after:w-full after:absolute after:left-0 after:right-0 after:bottom-[-4px] after:h-[1px] after:bg-foreground after:w-0 after:transition-all"
              )}
            >
              Terms
            </Link>
            <Link 
              href="https://eseaemefund.xyz" 
              target="_blank" 
              rel="noopener noreferrer" 
              className={cn(
                "text-sm text-muted-foreground hover:text-foreground transition-colors",
                "relative hover:after:w-full after:absolute after:left-0 after:right-0 after:bottom-[-4px] after:h-[1px] after:bg-foreground after:w-0 after:transition-all"
              )}
            >
              eseaeme
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 