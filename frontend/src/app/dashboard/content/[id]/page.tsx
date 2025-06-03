'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ContentPage, ContentPageMetadata, EditorContent } from '@/types/content';
import { getTemplateByType } from '@/lib/content-templates';
import { useUser } from '@/hooks/use-user';
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
  const { user } = useUser();
  const { setBreadcrumb } = useBreadcrumb();
  const contentId = params.id as string;
  
  const [contentPage, setContentPage] = useState<ContentPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMetadataPanel, setShowMetadataPanel] = useState(false);

  // Load content page data
  useEffect(() => {
    async function loadContentPage() {
      setIsLoading(true);
      try {
        // TODO: Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
        
        // Mock data for development
        const template = getTemplateByType('book');
        const mockContentPage: ContentPage = {
          id: contentId,
          title: 'Atomic Habits by James Clear',
          type: 'book',
          url: 'https://amazon.com/atomic-habits',
          tags: ['books', 'habits', 'productivity', 'self-improvement'],
          status: 'in-progress',
          priority: 'high',
          author: 'James Clear',
          publishedDate: new Date('2018-10-16'),
          estimatedReadTime: 288,
          rating: 5,
          progress: 65,
          content: template?.defaultContent || [],
          summary: 'A comprehensive guide to building good habits and breaking bad ones.',
          keyTakeaways: [
            'Small changes compound over time',
            'Focus on systems, not goals',
            'Make good habits obvious, attractive, easy, and satisfying'
          ],
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date(),
          createdBy: user || { id: '1', name: 'You', image: '' },
          lastEditedBy: user || { id: '1', name: 'You', image: '' },
          isPublic: false,
          collaborators: [],
        };
        
        setContentPage(mockContentPage);
      } catch (error) {
        console.error('Failed to load content page:', error);
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