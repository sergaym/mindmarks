'use client';

import { useState, useRef, useEffect } from 'react';
import { ContentPage, ContentPageMetadata } from '@/types/content';
import { getTemplateIcon } from '@/lib/content-templates';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Globe, 
  Lock, 
  Star, 
  Calendar, 
  Clock, 
  User,
  Link as LinkIcon,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentHeaderProps {
  contentPage: ContentPage;
  onUpdate: (metadata: Partial<ContentPageMetadata>) => void;
}

export function ContentHeader({ contentPage, onUpdate }: ContentHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(contentPage.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus title input when editing starts
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSave = () => {
    if (tempTitle.trim() && tempTitle !== contentPage.title) {
      onUpdate({ title: tempTitle.trim() });
    } else {
      setTempTitle(contentPage.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setTempTitle(contentPage.title);
      setIsEditingTitle(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'archived': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      case 'medium': return 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400';
      case 'high': return 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="px-6 py-8 border-b border-border">
      {/* Type and Status Row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 text-2xl">
          <span>{getTemplateIcon(contentPage.type)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getStatusColor(contentPage.status)}>
            {contentPage.status.charAt(0).toUpperCase() + contentPage.status.slice(1)}
          </Badge>
          
          <Badge variant="outline" className={getPriorityColor(contentPage.priority)}>
            {contentPage.priority.charAt(0).toUpperCase() + contentPage.priority.slice(1)} Priority
          </Badge>
          
          {contentPage.isPublic ? (
            <Badge variant="outline" className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Public
            </Badge>
          ) : (
            <Badge variant="outline" className="flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Private
            </Badge>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="mb-6">
        {isEditingTitle ? (
          <Input
            ref={titleInputRef}
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            className="text-4xl font-bold border-none p-0 h-auto bg-transparent text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            style={{ fontSize: '2.25rem', lineHeight: '2.5rem' }}
          />
        ) : (
          <div 
            className="flex items-start gap-2 group cursor-text"
            onClick={() => setIsEditingTitle(true)}
          >
            <h1 className="text-4xl font-bold text-foreground flex-1">
              {contentPage.title}
            </h1>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        {/* Author */}
        {contentPage.author && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4" />
            <span>by {contentPage.author}</span>
          </div>
        )}

        {/* URL */}
        {contentPage.url && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <LinkIcon className="w-4 h-4" />
            <a 
              href={contentPage.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 truncate"
            >
              {new URL(contentPage.url).hostname}
            </a>
          </div>
        )}

        {/* Published Date */}
        {contentPage.publishedDate && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{contentPage.publishedDate.toLocaleDateString()}</span>
          </div>
        )}

        {/* Reading Time */}
        {contentPage.estimatedReadTime && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{contentPage.estimatedReadTime} min read</span>
          </div>
        )}

        {/* Rating */}
        {contentPage.rating && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="w-4 h-4" />
            <div className="flex items-center">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-3 h-3",
                    i < contentPage.rating! 
                      ? "text-yellow-400 fill-yellow-400" 
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {/* Progress */}
        {contentPage.progress !== undefined && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${contentPage.progress}%` }}
                />
              </div>
              <span className="text-xs">{contentPage.progress}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      {contentPage.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {contentPage.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Summary */}
      {contentPage.summary && (
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground italic">{contentPage.summary}</p>
        </div>
      )}
    </div>
  );
} 