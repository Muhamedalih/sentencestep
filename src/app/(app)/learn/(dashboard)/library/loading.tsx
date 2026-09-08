import { Skeleton } from "@/components/ui/skeleton";

/**
 * Nearer than (dashboard)/loading.tsx, so it wins for /learn/library itself
 * (matching LibraryHome's actual shape: header + search + category pills +
 * a book-cover grid) instead of falling back to the generic list-page
 * skeleton, which looks nothing like this page. Its dynamic [bookId] child
 * has its own, differently-shaped loading.tsx (see that route) rather than
 * inheriting this one — Book Overview looks nothing like a book-cover grid
 * either.
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
          <Skeleton className="h-10 w-full max-w-md rounded-lg" />
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((pill) => (
              <Skeleton key={pill} className="h-8 w-20 shrink-0 rounded-full" />
            ))}
          </div>
        </header>

        <section className="flex flex-col gap-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
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
