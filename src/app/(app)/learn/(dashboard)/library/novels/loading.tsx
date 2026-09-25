import { Skeleton } from "@/components/ui/skeleton";

/**
 * Matches NovelsHome's actual shape: header + a single grid, no search box
 * or category pills (see NovelsHome's own doc comment for why it skips
 * those, unlike the Library homepage's loading.tsx this mirrors).
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16" aria-hidden="true">
      <div className="flex flex-col gap-12">
        <header className="flex flex-col gap-5">
          <div>
            <Skeleton className="mb-2 h-9 w-56" />
            <Skeleton className="h-6 w-72" />
          </div>
          <Skeleton className="h-10 w-40 rounded-full" />
        </header>

        <section className="flex flex-col gap-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
