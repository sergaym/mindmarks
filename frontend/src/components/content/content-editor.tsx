'use client';

import { PlateEditor } from '@/components/editor/plate-editor';
import { EditorContent } from '@/types/content';

interface ContentEditorProps {
  content: EditorContent[];
  onChange: (content: EditorContent[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function ContentEditor(props: ContentEditorProps) {
  // TODO: Integrate content and onChange props with PlateEditor
  // For now, using the existing PlateEditor component which has its own state management
  // The PlateEditor already includes all the AI features and editor functionality
  
  // Props are destructured but not used yet - they're available for future integration
  const { content, onChange, placeholder, readOnly } = props;
  
  // Suppress unused variable warnings during development
  void content;
  void onChange;
  void placeholder;
  void readOnly;
  
  return (
    <div className="w-full">
      <PlateEditor />
    </div>
  );
} 