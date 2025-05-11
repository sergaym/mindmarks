'use client';

import { AppSidebar } from "@/components/layout/sidebar/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/kibo-ui/kanban';
import { useState } from 'react';
import { useContent } from '@/hooks/use-content';
import { useKanban, contentTypeIcons, dateFormatter, shortDateFormatter } from '@/hooks/use-kanban';
import { ContentItem, ContentType, User } from '@/types/content';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AddContentButton } from '@/components/content/add-content-button';

export default function Page() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Initialize hooks for content and Kanban management
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
    getColumnCounts 
  } = useKanban(content);

  // Handler for when items are moved between columns
  const handleDataChange = async (updatedContent: ContentItem[]) => {
    await updateContent(updatedContent);
  };

  // Handler for adding new content
  const handleAddContent = async (newItem: Omit<ContentItem, 'id'>) => {
    await addContent(newItem);
  };

  // Show loading state
  if (status === 'loading' && content.length === 0) {
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
          <div className="flex h-[calc(100vh-64px)] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-primary"></div>
              <p className="text-sm text-muted-foreground">Loading your content...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  // Show error state
  if (status === 'error') {
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
          <div className="flex h-[calc(100vh-64px)] items-center justify-center">
            <div className="flex flex-col items-center gap-4 max-w-md text-center px-4">
              <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <h3 className="text-lg font-medium">Error Loading Content</h3>
              <p className="text-sm text-muted-foreground">{error || "There was an error loading your content. Please try again later."}</p>
              <button 
                className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
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
          
          <div className="h-[calc(100vh-160px)] overflow-x-auto">
            <KanbanProvider
              onDataChange={handleDataChange}
              columns={columns}
              data={content}
            >
              {(column) => (
                <KanbanBoard key={column.id} id={column.id}>
                  <KanbanHeader>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                      <span className="font-medium">{column.name}</span>
                      <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
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
                          {item.owner && (
                            <Avatar className="h-6 w-6 shrink-0">
                              <AvatarImage src={item.owner.image} alt={item.owner.name} />
                              <AvatarFallback>
                                {item.owner.name?.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          )}
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
      </SidebarInset>
      
      {/* Add Content Modal */}
      <AddContentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddContent}
        currentUser={getCurrentUser()}
      />
    </SidebarProvider>
  );
}
