'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AddContentModal } from './add-content-modal';
import { ContentType, User } from '@/types/content';

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
  }) => void;
  currentUser: User;
}

export function AddContentButton({ onAdd, currentUser }: AddContentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsModalOpen(true)}
      >
        Add New
      </Button>
      
      <AddContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={onAdd}
        currentUser={currentUser}
      />
    </>
  );
} 