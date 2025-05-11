'use client';

import { useState } from 'react';
import { ContentType, User } from '@/types/content';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (content: {
    name: string;
    type: ContentType;
    startAt: Date;
    column: string;
    owner: User;
  }) => void;
  currentUser: User;
}

export function AddContentModal({ isOpen, onClose, onAdd, currentUser }: AddContentModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ContentType>('book');
  const [error, setError] = useState<string | null>(null);

  const contentTypes: { value: ContentType; label: string; icon: string }[] = [
    { value: 'book', label: 'Book', icon: '📚' },
    { value: 'article', label: 'Article', icon: '📄' },
    { value: 'video', label: 'Video', icon: '🎬' },
    { value: 'podcast', label: 'Podcast', icon: '🎧' },
    { value: 'other', label: 'Other', icon: '📝' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name.trim()) {
      setError('Please enter a title');
      return;
    }

    // Create new content
    onAdd({
      name: name.trim(),
      type,
      startAt: new Date(),
      column: 'planned', // Default column is "To Read"
      owner: currentUser,
    });

    // Reset form
    setName('');
    setType('book');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Content</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Title
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter title"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="type" className="block text-sm font-medium">
              Content Type
            </label>
            <div className="grid grid-cols-5 gap-2">
              {contentTypes.map((contentType) => (
                <button
                  key={contentType.value}
                  type="button"
                  onClick={() => setType(contentType.value)}
                  className={`flex flex-col items-center justify-center rounded-md p-2 text-center ${
                    type === contentType.value
                      ? 'bg-primary/10 text-primary ring-1 ring-primary'
                      : 'bg-muted/40 hover:bg-muted'
                  }`}
                >
                  <span className="text-xl">{contentType.icon}</span>
                  <span className="mt-1 text-xs">{contentType.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <DialogFooter className="gap-2 pt-4">
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">
              Add Content
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 