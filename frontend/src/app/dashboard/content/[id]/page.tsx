'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ContentPage, ContentPageMetadata } from '@/types/content';
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
  const [isSaving, setIsSaving] = useState(false);
  const [showMetadataPanel, setShowMetadataPanel] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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

