'use client';

import { Card } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  Announcements,
  DndContextProps,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  type HTMLAttributes,
  type ReactNode,
  createContext,
  useContext,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import tunnel from 'tunnel-rat';

const t = tunnel();

export type { DragEndEvent } from '@dnd-kit/core';

type KanbanItemProps = {
  id: string;
  name: string;
  column: string;
} & Record<string, unknown>;

type KanbanColumnProps = {
  id: string;
  name: string;
} & Record<string, unknown>;

type KanbanContextProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = {
  columns: C[];
  data: T[];
  activeCardId: string | null;
};

const KanbanContext = createContext<KanbanContextProps>({
  columns: [],
  data: [],
  activeCardId: null,
});

export type KanbanBoardProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

export const KanbanBoard = ({ id, children, className }: KanbanBoardProps) => {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      className={cn(
        'flex h-full min-h-40 flex-col divide-y divide-muted/30 overflow-hidden rounded-lg border border-muted/20 bg-card/30 text-xs shadow-sm transition-all',
        isOver ? 'ring-1 ring-primary/40' : 'ring-0',
        className
      )}
      ref={setNodeRef}
    >
      {children}
    </div>
  );
};

export type KanbanCardProps<T extends KanbanItemProps = KanbanItemProps> = T & {
  children?: ReactNode;
  className?: string;
  onDelete?: (id: string) => void;
};

export const KanbanCard = <T extends KanbanItemProps = KanbanItemProps>({
  id,
  name,
  children,
  className,
  onDelete,
}: KanbanCardProps<T>) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id,
  });
  const { activeCardId } = useContext(KanbanContext) as KanbanContextProps;

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  // Define card content
  const renderCardContent = () => {
    // If no children are provided, show default layout with delete button
    if (!children) {
      return (
        <div className="flex items-start justify-between gap-2">
          <p className="m-0 flex-1 font-medium text-sm">{name}</p>
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              aria-label="Delete content"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          )}
        </div>
      );
    }
    
    // For custom children, just return the children without a delete button
    return children;
  };

  return (
    <>
      <div style={style} {...listeners} {...attributes} ref={setNodeRef}>
        <Card
          className={cn(
            'cursor-grab gap-4 rounded-md p-3 shadow-sm border border-muted/15 bg-card transition-colors group hover:border-muted/30',
            isDragging && 'pointer-events-none cursor-grabbing opacity-30',
            className
          )}
        >
          {renderCardContent()}
        </Card>
      </div>
      {activeCardId === id && (
        <t.In>
          <Card
            className={cn(
              'cursor-grab gap-4 rounded-md p-3 shadow-sm border border-primary/20 ring-1 ring-primary/40 group',
              isDragging && 'cursor-grabbing',
              className
            )}
          >
            {renderCardContent()}
          </Card>
        </t.In>
      )}
    </>
  );
};

export type KanbanCardsProps<T extends KanbanItemProps = KanbanItemProps> =
  Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'id'> & {
    children: (item: T) => ReactNode;
    id: string;
  };

export const KanbanCards = <T extends KanbanItemProps = KanbanItemProps>({
  children,
  className,
  ...props
}: KanbanCardsProps<T>) => {
  const { data } = useContext(KanbanContext) as KanbanContextProps<T>;
  const filteredData = data.filter((item) => item.column === props.id);
  const items = filteredData.map((item) => item.id);

  return (
    <ScrollArea className="overflow-hidden">
      <SortableContext items={items}>
        <div
          className={cn('flex flex-grow flex-col gap-2 p-2', className)}
          {...props}
        >
          {filteredData.map(children)}
        </div>
      </SortableContext>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
};

export type KanbanHeaderProps = HTMLAttributes<HTMLDivElement>;

export const KanbanHeader = ({ className, ...props }: KanbanHeaderProps) => (
  <div className={cn('m-0 p-2 font-semibold text-sm', className)} {...props} />
);

export type KanbanProviderProps<
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
> = Omit<DndContextProps, 'children'> & {
  children: (column: C) => ReactNode;
  className?: string;
  columns: C[];
  data: T[];
  onDataChange?: (data: T[]) => void;
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
};

export const KanbanProvider = <
  T extends KanbanItemProps = KanbanItemProps,
  C extends KanbanColumnProps = KanbanColumnProps,
>({
  children,
  onDragStart,
  onDragEnd,
  onDragOver,
  className,
  columns,
  data,
  onDataChange,
  ...props
}: KanbanProviderProps<T, C>) => {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<T | null>(null);

  const mouseSensor = useSensor(MouseSensor, {
    // Require the mouse to move by 10 pixels before activating
    activationConstraint: {
      distance: 10,
    },
    // Don't start drag when clicking on elements with data-no-drag attribute
    modifiers: {
      beforeStartDragging: (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        // Check if the click was on or inside an element with data-no-drag attribute
        if (target.closest('[data-no-drag]')) {
          return false;
        }
        return true;
      }
    }
  });
  
  const touchSensor = useSensor(TouchSensor, {
    // Press delay of 250ms, with tolerance of 5px of movement
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  
  const keyboardSensor = useSensor(KeyboardSensor);

  const sensors = useSensors(
    mouseSensor,
    touchSensor,
    keyboardSensor
  );

  const handleDragStart = (event: DragStartEvent) => {
    const cardId = event.active.id as string;
    const card = data.find((item) => item.id === cardId);
    if (card) {
      setActiveCardId(cardId);
      setActiveItem(card as T);
    }
    onDragStart?.(event);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const activeItem = data.find((item) => item.id === active.id);
    const overItem = data.find((item) => item.id === over.id);

    if (!activeItem || !overItem) {
      return;
    }

    const activeColumn = activeItem.column;
    const overColumn = overItem.column;

    if (activeColumn !== overColumn) {
      let newData = [...data];
      const activeIndex = newData.findIndex((item) => item.id === active.id);
      const overIndex = newData.findIndex((item) => item.id === over.id);

      newData[activeIndex].column = overColumn;
      newData = arrayMove(newData, activeIndex, overIndex);

      onDataChange?.(newData);
    }

    onDragOver?.(event);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null);

    onDragEnd?.(event);

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    let newData = [...data];

    const oldIndex = newData.findIndex((item) => item.id === active.id);
    const newIndex = newData.findIndex((item) => item.id === over.id);

    newData = arrayMove(newData, oldIndex, newIndex);

    onDataChange?.(newData);
  };

  const announcements: Announcements = {
    onDragStart({ active }) {
      const { name, column } = data.find((item) => item.id === active.id) ?? {};

      return `Picked up the card "${name}" from the "${column}" column`;
    },
    onDragOver({ active, over }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};
      const newColumn = columns.find((column) => column.id === over?.id)?.name;

      return `Dragged the card "${name}" over the "${newColumn}" column`;
    },
    onDragEnd({ active, over }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};
      const newColumn = columns.find((column) => column.id === over?.id)?.name;

      return `Dropped the card "${name}" into the "${newColumn}" column`;
    },
    onDragCancel({ active }) {
      const { name } = data.find((item) => item.id === active.id) ?? {};

      return `Cancelled dragging the card "${name}"`;
    },
  };

  return (
    <KanbanContext.Provider value={{ columns, data, activeCardId }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        accessibility={{ announcements }}
        {...props}
      >
        <div
          className={cn(
            'grid w-full grid-cols-1 md:grid-cols-3 gap-4',
            className
          )}
        >
          {columns.map((column) => children(column))}
        </div>
        {typeof window !== 'undefined' &&
          createPortal(
            <DragOverlay>
              {activeItem ? (
                <Card className="cursor-grabbing gap-4 rounded-md p-3 shadow-md border border-primary/20 bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <p className="m-0 flex-1 font-medium text-sm">{activeItem.name}</p>
                  </div>
                </Card>
              ) : null}
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </KanbanContext.Provider>
  );
};
