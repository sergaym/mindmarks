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
import { SkeletonDashboard } from '@/components/ui/skeleton-dashboard';
import { ErrorState } from '@/components/ui/error-state';
import { useBreadcrumb } from './layout';

export default function DashboardPage() {
  const { setBreadcrumb } = useBreadcrumb();
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Initialize hooks for content management
  const { 
    content, 
    currentUser,
    status, 
    error, 
    isRefreshing,
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
    return await addContent(newItem);
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

  // Loading state - only show skeleton if no cached data
  if (status === 'loading' && content.length === 0) {
    return <SkeletonDashboard />;
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

  // Main content with instant display
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 overflow-hidden">
      {/* Show subtle refresh indicator if background refresh is happening */}
      {isRefreshing && (
        <div className="absolute top-4 right-4 z-50">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md text-sm animate-pulse">
            Syncing...
          </div>
        </div>
      )}

      {currentUser && (
        <DashboardHeader
          onAddContent={handleAddContent}
          currentUser={currentUser}
        />
      )}
      
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