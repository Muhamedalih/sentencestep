import { Skeleton } from "@/components/ui/skeleton";

/**
 * Nearer than (dashboard)/loading.tsx, so it wins for /learn/stories,
 * matching StoriesLibrary's actual shape (header + three level tabs + a
 * story-card grid) instead of the generic level-grouped list skeleton.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16" aria-hidden="true">
      <div className="mb-8">
        <Skeleton className="mb-2 h-9 w-56" />
        <Skeleton className="h-6 w-72" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((tab) => (
          <Skeleton key={tab} className="h-11 w-full rounded-xl" />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
