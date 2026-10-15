import { Skeleton } from "@/components/ui/skeleton";

/**
 * Covers /admin and every nested route (levels, edit, preview, translations,
 * ...) that doesn't define its own more specific loading.tsx — sits inside
 * admin/layout.tsx, so the header/nav stay mounted and only this content
 * area swaps to skeleton. Approximates the dashboard's own shape (stat card
 * grid + a recent-items list) since that's the /admin landing page; content
 * and library each get a closer, list/table-shaped skeleton of their own
 * (see the sibling loading.tsx files under admin/content and admin/library)
 * rather than reusing this one.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-8" aria-hidden="true">
      <div>
        <Skeleton className="mb-2 h-9 w-40" />
        <Skeleton className="h-5 w-72" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-6">
            <Skeleton className="mb-2 h-8 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-6">
        <Skeleton className="mb-1 h-5 w-36" />
        <Skeleton className="mb-4 h-4 w-56" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
