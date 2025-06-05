'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/kibo-ui/kanban';
import { useRouter } from 'next/navigation';
import { useKanban, contentTypeIcons, dateFormatter, shortDateFormatter } from '@/hooks/use-kanban';
import { ContentItem } from '@/types/content';
import { DeleteButton } from '@/components/content/delete-button';

interface DashboardContentProps {
  content: ContentItem[];
  onDataChange: (updatedContent: ContentItem[]) => Promise<void>;
  onRemoveContent: (id: string) => void;
}

export function DashboardContent({ content, onDataChange, onRemoveContent }: DashboardContentProps) {
  const router = useRouter();
  const { columns } = useKanban();

  const handleContentClick = (contentId: string) => {
    router.push(`/dashboard/content/${contentId}`);
  };

  return (
    <div className="h-[calc(100vh-160px)] w-full overflow-x-auto md:overflow-x-auto px-1 py-2">
      <div className="w-full md:min-w-[900px]">
        <KanbanProvider
          onDataChange={onDataChange}
          columns={columns}
          data={content}
        >
          {(column) => (
            <KanbanBoard key={column.id} id={column.id} className="mb-4 md:mb-0">
              <KanbanHeader>
                <div className="flex items-center gap-2 px-2 py-3">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <span className="font-medium">{column.name}</span>
                  <span className="ml-1 rounded-full bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                    {content.filter(item => item.column === column.id).length}
                  </span>
                </div>
              </KanbanHeader>
              <KanbanCards id={column.id}>
                {(item: ContentItem) => (
                  <KanbanCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    column={column.id}
                    className="group hover:bg-card/80 cursor-pointer"
                    onClick={() => handleContentClick(item.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{contentTypeIcons[item.type] || "📄"}</span>
                          <p className="m-0 flex-1 font-medium text-sm">
                            {item.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div data-no-drag="true" onClick={(e) => e.stopPropagation()}>
                          <DeleteButton 
                            onDelete={() => onRemoveContent(item.id)}
                          />
                        </div>
                        {item.owner && (
                          <Avatar className="h-6 w-6 shrink-0">
                            <AvatarImage src={item.owner.image} alt={item.owner.name} />
                            <AvatarFallback>
                              {item.owner.name?.slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                    <p className="m-0 mt-2 text-xs text-muted-foreground">
                      {shortDateFormatter.format(item.startAt)} - {item.endAt ? dateFormatter.format(item.endAt) : "Present"}
                    </p>
                  </KanbanCard>
                )}
              </KanbanCards>
            </KanbanBoard>
          )}
        </KanbanProvider>
      </div>
    </div>
  );
} 