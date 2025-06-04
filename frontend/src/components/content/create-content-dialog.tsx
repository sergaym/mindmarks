'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContentType, User } from '@/types/content';
import { contentTemplates, getTemplateByType } from '@/lib/content-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, ArrowLeft, Plus, ExternalLink, Search, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateContentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContent: (newItem: {
    name: string;
    type: ContentType;
    startAt: Date;
    column: string;
    owner: User;
    endAt?: Date;
    description?: string;
    tags?: string[];
    url?: string;
  }) => Promise<void>;
  currentUser: User;
}

// Custom Dialog Components for Content Creation
function CustomDialog({ isOpen, onClose, children }: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Enhanced Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Dialog Container */}
      <div className="relative w-[95vw] max-w-7xl h-[90vh] bg-background/95 backdrop-blur-lg rounded-2xl border-2 border-border/40 shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-10 h-10 rounded-xl bg-background/80 hover:bg-background border-2 border-border/40 hover:border-border/60 flex items-center justify-center transition-all duration-200 group"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
        
        {children}
      </div>
    </div>
  );
}

function CustomDialogTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-xl font-bold text-foreground tracking-tight", className)} {...props}>
      {children}
    </h2>
  );
}

function CustomDialogDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground leading-relaxed", className)} {...props}>
      {children}
    </p>
  );
}

export function CreateContentDialog({ 
  isOpen, 
  onClose, 
  onAddContent, 
  currentUser 
}: CreateContentDialogProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<'template' | 'details'>('template');
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Filter templates based on search query
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return contentTemplates;
    
    const query = searchQuery.toLowerCase();
    return contentTemplates.filter(template => 
      template.title.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.suggestedTags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  // Focus search when dialog opens
  useEffect(() => {
    if (isOpen && step === 'template') {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, step]);

  // Reset state when dialog closes
  const handleClose = () => {
    setStep('template');
    setSelectedType(null);
    setTitle('');
    setUrl('');
    setIsCreating(false);
    setSearchQuery('');
    setError('');
    onClose();
  };

  const handleTemplateSelect = (type: ContentType) => {
    setSelectedType(type);
    setStep('details');
    setError('');
  };

  const handleBackToTemplates = () => {
    setStep('template');
    setSelectedType(null);
    setTitle('');
    setUrl('');
    setError('');
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return false;
    }
    if (url && !isValidUrl(url)) {
      setError('Please enter a valid URL');
      return false;
    }
    setError('');
    return true;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  const handleCreateContent = async () => {
    if (!selectedType || !validateForm()) return;
    
    setIsCreating(true);
    setError('');
    
    try {
      await onAddContent({
        name: title.trim(),
        type: selectedType,
        startAt: new Date(),
        column: 'planned',
        owner: currentUser,
        url: url.trim() || undefined,
        tags: getTemplateByType(selectedType)?.suggestedTags || [],
      });

      // Then navigate to the editor
      const contentId = Math.random().toString(36).substr(2, 9);
      router.push(`/dashboard/content/${contentId}`);
      
      handleClose();
    } catch (error) {
      console.error('Failed to create content:', error);
      setError('Failed to create content. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const formatTimeRange = (range?: [number, number]) => {
    if (!range) return '';
    const [min, max] = range;
    if (min === max) return `${min}m`;
    return `${min}-${max}m`;
  };

  // Handle keyboard navigation for template selection
  const handleKeyDown = (event: React.KeyboardEvent, type: ContentType) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTemplateSelect(type);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  return (
    <CustomDialog isOpen={isOpen} onClose={handleClose}>
      <div className="h-full flex flex-col">
        {step === 'template' ? (
          <>
            {/* Enhanced Header with Search */}
            <div className="flex-shrink-0 px-8 pt-8 pb-6 border-b border-border/30 bg-gradient-to-br from-background via-background to-muted/20">
              <div className="flex items-start gap-5 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/20 shadow-sm">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CustomDialogTitle className="mb-2">
                    Create New Content
                  </CustomDialogTitle>
                  <CustomDialogDescription>
                    Choose a template to get started with your reading journey
                  </CustomDialogDescription>
                </div>
              </div>
              
              {/* Enhanced Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates by name, description, or tags..."
                  className="pl-11 pr-11 h-10 text-sm bg-background/80 border-2 border-border/60 focus:border-primary/60 focus:bg-background transition-all duration-200 placeholder:text-muted-foreground/60 shadow-sm"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted/80 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Enhanced Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-8">
                {filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-6 border border-border/30">
                      <Search className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-2">No templates found</h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                      Try adjusting your search or browse all available templates
                    </p>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={clearSearch}
                      className="mt-2"
                    >
                      Clear search
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                      <Card 
                        key={template.type}
                        className={cn(
                          "group relative cursor-pointer transition-all duration-200",
                          "hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-2",
                          "border-2 border-border/40 hover:border-primary/60",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                          "overflow-hidden bg-card/50 backdrop-blur-sm",
                          "h-full min-h-[240px]"
                        )}
                        tabIndex={0}
                        onClick={() => handleTemplateSelect(template.type)}
                        onKeyDown={(e) => handleKeyDown(e, template.type)}
                        role="button"
                        aria-label={`Create ${template.title}`}
                      >
                        {/* Header Section */}
                        <div className="p-6 pb-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 group-hover:scale-110 transition-all duration-200">
                                <span className="text-3xl leading-none">{template.icon}</span>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-tight mb-1">
                                  {template.title}
                                </h3>
                                {template.estimatedTimeRange && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-full px-2.5 py-1 w-fit">
                                    <Clock className="w-3 h-3" />
                                    <span className="font-medium">
                                      {formatTimeRange(template.estimatedTimeRange)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-3 min-h-[3.75rem]">
                            {template.description}
                          </p>
                        </div>

                        {/* Tags Section */}
                        <div className="px-6 pb-6">
                          {template.suggestedTags.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wide">
                                Suggested Tags
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {template.suggestedTags.slice(0, 4).map((tag) => (
                                  <Badge 
                                    key={tag} 
                                    variant="secondary" 
                                    className="text-xs px-2.5 py-1 h-6 bg-muted/60 hover:bg-muted text-muted-foreground border-0 font-medium"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {template.suggestedTags.length > 4 && (
                                  <Badge 
                                    variant="secondary" 
                                    className="text-xs px-2.5 py-1 h-6 bg-primary/10 text-primary border-0 font-medium"
                                  >
                                    +{template.suggestedTags.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Hover Effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
                        
                        {/* Selection Indicator */}
                        <div className="absolute top-4 right-4 w-6 h-6 rounded-full border-2 border-border/40 bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <Plus className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Enhanced Header with Back Button */}
            <div className="flex-shrink-0 px-8 pt-8 pb-6 border-b border-border/30 bg-gradient-to-br from-background via-background to-muted/20">
              <div className="flex items-start gap-5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToTemplates}
                  className="h-10 w-10 p-0 hover:bg-muted/60 -ml-1 rounded-xl border border-border/40 hover:border-border/60 transition-all"
                  aria-label="Back to templates"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                
                <div className="flex items-start gap-5 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/20 shadow-sm">
                    <span className="text-2xl">{getTemplateByType(selectedType!)?.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <CustomDialogTitle>
                      {getTemplateByType(selectedType!)?.title}
                    </CustomDialogTitle>
                    <CustomDialogDescription>
                      Add details to create your content
                    </CustomDialogDescription>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Scrollable Form */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="p-8">
                <div className="max-w-2xl mx-auto space-y-8">
                  {/* Error Display */}
                  {error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border-2 border-destructive/20 text-destructive">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{error}</span>
                    </div>
                  )}

                  {/* Enhanced Title Field */}
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-sm font-semibold text-foreground flex items-center gap-2">
                      Content Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => {
                        setTitle(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Enter a descriptive title for your content..."
                      className={cn(
                        "h-10 text-sm transition-all duration-200 border-2",
                        error && title.length === 0 
                          ? "border-destructive/60 focus:border-destructive" 
                          : "border-border/60 focus:border-primary/60"
                      )}
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Choose a clear, descriptive title that helps you find this content later
                    </p>
                  </div>

                  {/* Enhanced URL Field */}
                  <div className="space-y-3">
                    <Label htmlFor="url" className="text-sm font-semibold text-foreground flex items-center gap-2">
                      Source URL
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </Label>
                    <Input
                      id="url"
                      type="url"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="https://example.com/article"
                      className={cn(
                        "h-10 text-sm transition-all duration-200 border-2",
                        error && url.length > 0 && !isValidUrl(url) 
                          ? "border-destructive/60 focus:border-destructive" 
                          : "border-border/60 focus:border-primary/60"
                      )}
                    />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Link to the original content source (optional but recommended)
                    </p>
                  </div>

                  {/* Enhanced Template Details */}
                  <div className="bg-gradient-to-br from-muted/40 to-muted/20 rounded-2xl p-6 border-2 border-border/30">
                    <h4 className="text-base font-bold text-foreground mb-5 flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20">
                        <span className="text-base">{getTemplateByType(selectedType!)?.icon}</span>
                      </div>
                      Template Details
                    </h4>
                    
                    <div className="space-y-5">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {getTemplateByType(selectedType!)?.description}
                      </p>
                      
                      {getTemplateByType(selectedType!)?.estimatedTimeRange && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-muted/60 border border-border/30">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="text-sm text-foreground font-semibold">
                              {formatTimeRange(getTemplateByType(selectedType!)?.estimatedTimeRange)}
                            </span>
                            <span className="text-xs text-muted-foreground">estimated time</span>
                          </div>
                        </div>
                      )}

                      {getTemplateByType(selectedType!)?.suggestedTags && (
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-foreground uppercase tracking-wide">Suggested Tags:</p>
                          <div className="flex flex-wrap gap-2">
                            {getTemplateByType(selectedType!)?.suggestedTags.map((tag) => (
                              <Badge 
                                key={tag} 
                                variant="secondary" 
                                className="text-xs px-3 py-1.5 h-7 bg-muted/80 hover:bg-muted text-muted-foreground border-0 font-medium"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Footer */}
            <div className="flex-shrink-0 px-8 py-6 border-t border-border/30 bg-gradient-to-br from-muted/20 via-background to-background">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                <Button
                  variant="outline"
                  onClick={handleBackToTemplates}
                  className="flex items-center gap-2 h-10 px-4 border-2 border-border/60 hover:border-border/80 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Templates
                </Button>
                
                <Button
                  onClick={handleCreateContent}
                  disabled={isCreating || !title.trim()}
                  className="flex items-center gap-2 min-w-[130px] h-10 px-5 font-semibold shadow-lg disabled:shadow-none transition-all"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Content
                    </>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </CustomDialog>
  );
} 