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

