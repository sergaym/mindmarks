'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ContentPage, ContentPageMetadata, EditorContent } from '@/types/content';
import { useContent } from '@/hooks/use-content';
import { ContentMetadataPanel } from '@/components/content/content-metadata-panel';
import { ContentEditor } from '@/components/content/content-editor';
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

export default function ContentPageView() {
  const params = useParams();
  const router = useRouter();
  const { setBreadcrumb } = useBreadcrumb();
  const { getContentPage, updateContentPage } = useContent();
  const contentId = params.id as string;
  
  const [contentPage, setContentPage] = useState<ContentPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMetadataPanel, setShowMetadataPanel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load content page data from unified store
  useEffect(() => {
    async function loadContentPage() {
      if (!contentId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const page = await getContentPage(contentId);
        if (page) {
          setContentPage(page);
        } else {
          setError('Content not found');
        }
      } catch (error) {
        console.error('Failed to load content page:', error);
        setError('Failed to load content page');
      } finally {
        setIsLoading(false);
      }
    }

    if (contentId) {
      loadContentPage();
    }
  }, [contentId, user]);

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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setContentPage(prev => prev ? { ...prev, content, updatedAt: new Date() } : null);
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  };

  // Update metadata
  const handleMetadataUpdate = async (metadata: Partial<ContentPageMetadata>) => {
    if (!contentPage) return;
    
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setContentPage(prev => prev ? { ...prev, ...metadata, updatedAt: new Date() } : null);
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

  if (!contentPage) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Content not found</h1>
          <p className="text-muted-foreground mb-4">The content page you&apos;re looking for doesn&apos;t exist.</p>
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