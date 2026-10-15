import { Skeleton } from "@/components/ui/skeleton";

/** Shown while the Passages list loads — the same header and card grid the page draws, as plain blocks. */
export default function PassagesLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10" aria-busy="true">
      <div className="mb-8 flex items-start gap-4">
        <Skeleton className="size-12 rounded-2xl" />
        <div className="flex-1">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-3 h-4 w-full max-w-md" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
