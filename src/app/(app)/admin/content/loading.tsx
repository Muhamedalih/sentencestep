import { Skeleton } from "@/components/ui/skeleton";

/**
 * Nearer than admin/loading.tsx, so it wins for /admin/content — matches
 * that page's actual shape (header + filter bar + a table of rows) instead
 * of the dashboard-shaped stat-card fallback.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Skeleton className="mb-2 h-9 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <div className="rounded-xl border p-6">
        <div className="flex flex-wrap items-end gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-32 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <div className="bg-muted/50 h-10 w-full" />
        <div className="divide-border divide-y">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="ml-auto h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
