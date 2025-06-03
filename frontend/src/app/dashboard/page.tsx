'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useState, useEffect, useCallback } from 'react';
import { useContent } from '@/hooks/use-content';
import { useKanban } from '@/hooks/use-kanban';
import { ContentItem, ContentType, User } from '@/types/content';
import { DeleteConfirmationDialog } from '@/components/content/delete-confirmation-dialog';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useBreadcrumb } from './layout';

export default function DashboardPage() {
  const { setBreadcrumb } = useBreadcrumb();
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Initialize hooks for content management
  const { 
    content, 
    status, 
    error, 
    updateContent,
    addContent,
    removeContent,
    getCurrentUser
  } = useContent();
  
  // Note: useKanban hook is available for future kanban functionality
  useKanban();

  // Set breadcrumb for this page
  useEffect(() => {
    setBreadcrumb(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>My Content</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }, [setBreadcrumb]);

  // Handler for when items are moved between columns
  const handleDataChange = useCallback(async (updatedContent: ContentItem[]) => {
    await updateContent(updatedContent);
  }, [updateContent]);

  // Handler for adding new content
  const handleAddContent = useCallback(async (newItem: {
    name: string;
    type: ContentType;
    startAt: Date;
    column: string;
    owner: User;
    endAt?: Date;
    description?: string;
    tags?: string[];
    url?: string;
  }) => {
    await addContent(newItem);
  }, [addContent]);

  // Handler for removing content
  const handleRemoveContent = useCallback((id: string) => {
    setItemToDelete(id);
  }, []);

  // Confirm deletion
  const confirmDelete = useCallback(async () => {
    if (itemToDelete) {
      await removeContent(itemToDelete);
      setItemToDelete(null);
    }
  }, [itemToDelete, removeContent]);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // Loading state
  if (status === 'loading' && content.length === 0) {
    return <LoadingState message="Loading your content..." />;
  }

  // Error state
  if (status === 'error') {
    return (
      <ErrorState 
        message={error || "There was an error loading your content. Please try again later."}
        onRetry={handleRetry}
      />
    );
  }

  // Main content
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 overflow-hidden">
      <DashboardHeader
        onAddContent={handleAddContent}
        currentUser={getCurrentUser()}
      />
      
      <DashboardContent
        content={content}
        onDataChange={handleDataChange}
        onRemoveContent={handleRemoveContent}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        itemId={itemToDelete}
      />
    </div>
  );
}