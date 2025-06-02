'use client';

import { PlateEditor } from '@/components/editor/plate-editor';

interface ContentEditorProps {
  content: any[];
  onChange: (content: any[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function ContentEditor({ 
  content, 
  onChange, 
  placeholder = "Start writing...",
  readOnly = false 
}: ContentEditorProps) {
  
  // For now, use the existing PlateEditor component as-is
  // In the future, we can customize it to handle the content prop
  // The existing PlateEditor already includes all the AI features
  
  return (
    <div className="w-full">
      <PlateEditor />
    </div>
  );
} 