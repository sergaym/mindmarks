'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/kibo-ui/kanban';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useContent } from '@/hooks/use-content';
import { useKanban, contentTypeIcons, dateFormatter, shortDateFormatter } from '@/hooks/use-kanban';
import { ContentItem, ContentType, User } from '@/types/content';
import { AddContentButton } from '@/components/content/add-content-button';
import { DeleteButton } from '@/components/content/delete-button';
import { DeleteConfirmationDialog } from '@/components/content/delete-confirmation-dialog';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useBreadcrumb } from './layout';

export default function DashboardPage() {
  const router = useRouter();
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
  
  const { 
    columns,
  } = useKanban();

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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
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
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Content</h1>
            <AddContentButton
              onAdd={handleAddContent}
              currentUser={getCurrentUser()}
            />
          </div>
          
          <div className="h-[calc(100vh-160px)] w-full overflow-x-auto md:overflow-x-auto px-1 py-2">
            <div className="w-full md:min-w-[900px]">
              <KanbanProvider
                onDataChange={handleDataChange}
                columns={columns}
                data={content}
              >
                {(column) => (
                  <KanbanBoard key={column.id} id={column.id} className="mb-4 md:mb-0">
                    <KanbanHeader>
                      <div className="flex items-center gap-2 px-2 py-3">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: column.color }}
                        />
                        <span className="font-medium">{column.name}</span>
                        <span className="ml-1 rounded-full bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                          {content.filter(item => item.column === column.id).length}
                        </span>
                      </div>
                    </KanbanHeader>
                    <KanbanCards id={column.id}>
                      {(item: ContentItem) => (
                        <KanbanCard
                          key={item.id}
                          id={item.id}
                          name={item.name}
                          column={column.id}
                          className="group hover:bg-card/80"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{contentTypeIcons[item.type] || "📄"}</span>
                                <p className="m-0 flex-1 font-medium text-sm">
                                  {item.name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div data-no-drag="true">
                                <DeleteButton 
                                  onDelete={() => handleRemoveContent(item.id)}
                                />
                              </div>
                              {item.owner && (
                                <Avatar className="h-6 w-6 shrink-0">
                                  <AvatarImage src={item.owner.image} alt={item.owner.name} />
                                  <AvatarFallback>
                                    {item.owner.name?.slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          </div>
                          <p className="m-0 mt-2 text-xs text-muted-foreground">
                            {shortDateFormatter.format(item.startAt)} - {item.endAt ? dateFormatter.format(item.endAt) : "Present"}
                          </p>
                        </KanbanCard>
                      )}
                    </KanbanCards>
                  </KanbanBoard>
                )}
              </KanbanProvider>
            </div>
          </div>
        </div>
      </SidebarInset>
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDelete}
        itemId={itemToDelete}
      />
    </SidebarProvider>
  );
}
