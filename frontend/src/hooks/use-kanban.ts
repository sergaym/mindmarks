'use client';

import { useState } from 'react';
import { KanbanColumn, ContentItem } from '@/types/content';

// Default columns for the Kanban board
const defaultColumns: KanbanColumn[] = [
  { id: "planned", name: 'To Read', color: '#6B7280' },
  { id: "in-progress", name: 'In Progress', color: '#F59E0B' },
  { id: "done", name: 'Completed', color: '#10B981' },
];

// Content type icons mapping
export const contentTypeIcons: Record<string, string> = {
  book: "📚",
  article: "📄",
  video: "🎬",
  podcast: "🎧",
  other: "📝"
};

// Date formatters
export const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

/**
 * Custom hook for Kanban board operations
 */
export function useKanban(initialContent: ContentItem[] = []) {
  const [columns, setColumns] = useState<KanbanColumn[]>(defaultColumns);
  
  // Count items in each column
  const getColumnCounts = (content: ContentItem[]) => {
    return columns.reduce<Record<string, number>>((acc, column) => {
      acc[column.id] = content.filter(item => item.column === column.id).length;
      return acc;
    }, {});
  };

  // Move an item from one column to another
  const moveItem = (content: ContentItem[], itemId: string, targetColumn: string): ContentItem[] => {
    return content.map(item => 
      item.id === itemId 
        ? { ...item, column: targetColumn } 
        : item
    );
  };

  // Get items for a specific column
  const getColumnItems = (content: ContentItem[], columnId: string): ContentItem[] => {
    return content.filter(item => item.column === columnId);
  };

  // Add a new column to the board
  const addColumn = (newColumn: Omit<KanbanColumn, 'id'>) => {
    const id = `column-${columns.length + 1}`;
    setColumns([...columns, { ...newColumn, id }]);
    return { id };
  };

  // Remove a column from the board
  const removeColumn = (columnId: string) => {
    setColumns(columns.filter(column => column.id !== columnId));
  };

  // Update a column's properties
  const updateColumn = (columnId: string, updates: Partial<Omit<KanbanColumn, 'id'>>) => {
    setColumns(columns.map(column => 
      column.id === columnId 
        ? { ...column, ...updates } 
        : column
    ));
  };

  return {
    columns,
    contentTypeIcons,
    dateFormatter,
    shortDateFormatter,
    getColumnCounts,
    moveItem,
    getColumnItems,
    addColumn,
    removeColumn,
    updateColumn
  };
} 