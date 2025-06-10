'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ContentPageMetadata, EditorContent } from '@/types/content';
import { useContentPage } from '@/hooks/use-content';
import { ContentMetadataPanel } from '@/components/content/content-metadata-panel';
import { ContentHeader } from '@/components/content/content-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useBreadcrumb } from '../../layout';

// Dynamic import for heavy content editor
const ContentEditor = dynamic(
  () => import('@/components/content/content-editor').then(mod => ({ default: mod.ContentEditor })),
  {
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    ),
    ssr: false, // Editor is client-side only
  }
);

export default function ContentPageView() {
  const params = useParams();
  const router = useRouter();
  const { setBreadcrumb } = useBreadcrumb();
  const contentId = params.id as string;
  
  // Use the new useContentPage hook instead of useContent
  const { 
    contentPage, 
    error, 
    isLoading, 
    updateContentPage 
  } = useContentPage(contentId);
  
  const [showMetadataPanel, setShowMetadataPanel] = useState(false);

  // Set breadcrumb when content is loaded
  useEffect(() => {
    if (contentPage) {
      setBreadcrumb(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {contentPage.title || 'Content'}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    } else {
      setBreadcrumb(
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Content</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    }
  }, [contentPage, setBreadcrumb]);

  // Save content changes
  const handleContentChange = async (content: EditorContent[]) => {
    if (!contentPage) return;
    
    try {
      const success = await updateContentPage(contentPage.id, { content });
      if (success) {
        setContentPage(prev => prev ? { ...prev, content, updatedAt: new Date() } : null);
      }
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  };

  // Update metadata
  const handleMetadataUpdate = async (metadata: Partial<ContentPageMetadata>) => {
    if (!contentPage) return;
    
    try {
      const success = await updateContentPage(contentPage.id, metadata);
      if (success) {
        setContentPage(prev => prev ? { ...prev, ...metadata, updatedAt: new Date() } : null);
      }
    } catch (error) {
      console.error('Failed to update metadata:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !contentPage) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">
            {error === 'Content not found' ? 'Content not found' : 'Error loading content'}
          </h1>
          <p className="text-muted-foreground mb-4">
            {error === 'Content not found' 
              ? "The content page you're looking for doesn't exist." 
              : 'There was an error loading this content page.'}
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Content Header */}
        <ContentHeader
          contentPage={contentPage}
          onUpdate={handleMetadataUpdate}
        />

        {/* Main Editor */}
        <div className="px-6 pb-20">
          <ContentEditor
            content={contentPage.content}
            onChange={handleContentChange}
            placeholder="Start writing your notes..."
          />
        </div>
      </div>

      {/* Metadata Panel */}
      <ContentMetadataPanel
        contentPage={contentPage}
        isOpen={showMetadataPanel}
        onClose={() => setShowMetadataPanel(false)}
        onUpdate={handleMetadataUpdate}
      />
    </div>
  );
} 