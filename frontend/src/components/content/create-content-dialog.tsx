'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContentType, User } from '@/types/content';
import { contentTemplates, getTemplateByType } from '@/lib/content-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, ArrowLeft, Plus, ExternalLink, Search, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContent: (newItem: {
    name: string;
    type: ContentType;
    startAt: Date;
    column: string;
    owner: User;
    endAt?: Date;
    description?: string;
    tags?: string[];
    url?: string;
  }) => Promise<void>;
  currentUser: User;
}

// Custom Dialog Components for Content Creation
function CustomDialog({ isOpen, onClose, children }: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Enhanced Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Dialog Container */}
      <div className="relative w-[95vw] max-w-7xl h-[90vh] bg-background/95 backdrop-blur-lg rounded-2xl border-2 border-border/40 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-10 h-10 rounded-xl bg-background/80 hover:bg-background border-2 border-border/40 hover:border-border/60 flex items-center justify-center transition-all duration-200 group"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
        
        {children}
      </div>
    </div>
  );
}

function CustomDialogTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-xl font-bold text-foreground tracking-tight", className)} {...props}>
      {children}
    </h2>
  );
}

function CustomDialogDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground leading-relaxed", className)} {...props}>
      {children}
    </p>
  );
}

