'use client';

import { AddContentButton } from '@/components/content/add-content-button';
import { ContentType, User } from '@/types/content';

interface DashboardHeaderProps {
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

export function DashboardHeader({ onAddContent, currentUser }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">My Content</h1>
      <AddContentButton
        onAdd={onAddContent}
        currentUser={currentUser}
      />
    </div>
  );
} 