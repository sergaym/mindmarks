import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonDashboard() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Kanban Columns Skeleton */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Planned', 'In Progress', 'Completed'].map((column) => (
          <div key={column} className="space-y-4">
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>

            {/* Content Cards */}
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 