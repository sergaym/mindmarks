'use client';

import { useState } from 'react';
import { ContentPage, ContentPageMetadata, ContentType } from '@/types/content';
import { contentTemplates, getTemplateIcon } from '@/lib/content-templates';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetClose 
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  X, 
  Calendar as CalendarIcon, 
  Star, 
  Plus,
  Globe,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ContentMetadataPanelProps {
  contentPage: ContentPage;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (metadata: Partial<ContentPageMetadata>) => void;
}

export function ContentMetadataPanel({ 
  contentPage, 
  isOpen, 
  onClose, 
  onUpdate 
}: ContentMetadataPanelProps) {
  const [formData, setFormData] = useState<ContentPageMetadata>({
    title: contentPage.title,
    type: contentPage.type,
    url: contentPage.url || '',
    tags: contentPage.tags,
    status: contentPage.status,
    priority: contentPage.priority,
    author: contentPage.author || '',
    publishedDate: contentPage.publishedDate,
    estimatedReadTime: contentPage.estimatedReadTime || 0,
    isPublic: contentPage.isPublic,
  });

  const [newTag, setNewTag] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleSave = () => {
    onUpdate(formData);
    onClose();
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span>{getTemplateIcon(contentPage.type)}</span>
            Properties
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Content title"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Content Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: ContentType) => 
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contentTemplates.map((template) => (
                  <SelectItem key={template.type} value={template.type}>
                    <div className="flex items-center gap-2">
                      <span>{template.icon}</span>
                      <span>{template.title}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Source URL</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => 
                setFormData(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">📋 Planned</SelectItem>
                <SelectItem value="in-progress">🔄 In Progress</SelectItem>
                <SelectItem value="completed">✅ Completed</SelectItem>
                <SelectItem value="archived">📦 Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: any) => 
                setFormData(prev => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Low</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="high">🔴 High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Author */}
          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
              placeholder="Author name"
            />
          </div>

          {/* Published Date */}
          <div className="space-y-2">
            <Label>Published Date</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.publishedDate ? (
                    format(formData.publishedDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.publishedDate}
                  onSelect={(date) => {
                    setFormData(prev => ({ ...prev, publishedDate: date }));
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Reading Time */}
          <div className="space-y-2">
            <Label htmlFor="readingTime">Estimated Reading Time (minutes)</Label>
            <Input
              id="readingTime"
              type="number"
              min="0"
              value={formData.estimatedReadTime}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                estimatedReadTime: parseInt(e.target.value) || 0 
              }))}
              placeholder="30"
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibility</Label>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isPublic}
                onCheckedChange={(checked: boolean) => 
                  setFormData(prev => ({ ...prev, isPublic: checked }))
                }
              />
              <div className="flex items-center gap-2">
                {formData.isPublic ? (
                  <>
                    <Globe className="w-4 h-4" />
                    <span className="text-sm">Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span className="text-sm">Private</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add tag"
                  className="flex-1"
                />
                <Button size="sm" onClick={handleAddTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-8 pt-6 border-t">
          <Button onClick={handleSave} className="flex-1">
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
} 