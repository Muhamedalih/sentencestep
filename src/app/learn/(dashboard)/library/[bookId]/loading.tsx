import { Skeleton } from "@/components/ui/skeleton";

/**
 * Nearer than library/loading.tsx (its parent segment), so it wins for this
 * exact route instead — matching Book Overview's actual shape (back link,
 * cover + detail column, section list) rather than the Library home page's
 * grid. Without this, the parent's book-grid skeleton was shown while THIS
 * page's real content streamed in: a shape mismatch between a short grid
 * skeleton and the much taller cover-plus-section-list page it gets replaced
 * by, which is what produced the unwanted scroll jump on opening a book (the
 * viewport was anchored to the short skeleton's layout, then had to resettle
 * once the real, taller page took its place).
 */
export default function Loading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12 sm:py-16" aria-hidden="true">
      <Skeleton className="h-5 w-32" />

      <div className="grid gap-8 sm:grid-cols-[220px_1fr]">
        <Skeleton className="aspect-[3/4] w-full max-w-[220px] rounded-2xl" />

        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <div>
            <Skeleton className="mb-2 h-9 w-64" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-16 w-full max-w-2xl" />
          <div className="flex gap-6">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-24" />
          </div>
          <Skeleton className="h-11 w-40 rounded-lg" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-28" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[66px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
