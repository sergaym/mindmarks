'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ContentType, User, ContentItem } from '@/types/content';
import { Plus } from 'lucide-react';
import { CreateContentDialog } from './create-content-dialog';

interface AddContentButtonProps {
  onAdd: (content: {
    name: string;
    type: ContentType;
    startAt: Date;
    column: string;
    owner: User;
    endAt?: Date;
    description?: string;
    tags?: string[];
    url?: string;
  }) => Promise<{ status: 'success' | 'error'; data?: ContentItem[]; id?: string; error?: string }>;
  currentUser: User;
}

export function AddContentButton({ onAdd, currentUser }: AddContentButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsDialogOpen(true)} 
        className="flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Create Content
      </Button>

      <CreateContentDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAddContent={onAdd}
        currentUser={currentUser}
      />
    </>
  );
} 