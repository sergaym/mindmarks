'use client';

import { ButtonHTMLAttributes } from 'react';

interface DeleteButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onDelete: () => void;
}

export function DeleteButton({ onDelete, className, ...props }: DeleteButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent the event from bubbling up to parent elements
    e.preventDefault();
    e.stopPropagation();
    
    // Call the onDelete callback
    onDelete();
  };

  return (
    <button
      onClick={handleClick}
      className={`text-muted-foreground/60 opacity-0 transition-all hover:text-destructive/70 hover:scale-110 group-hover:opacity-100 ${className || ''}`}
      aria-label="Delete content"
      type="button"
      data-no-drag="true"
      onMouseDown={(e) => {
        // Prevent drag start when clicking on this button
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        // Prevent drag start when touching this button on mobile
        e.stopPropagation();
      }}
      {...props}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
        <path d="M3 6h18"></path>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
      </svg>
    </button>
  );
} 