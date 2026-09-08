import { Skeleton } from "@/components/ui/skeleton";

/**
 * Fallback for every /learn/(dashboard) route that doesn't define its own
 * more specific loading.tsx (the [mode] list pages — Normal/Conversation —
 * plus Saved/Settings/Word Lists). Sits inside (dashboard)/layout.tsx, so
 * the header and sidebar stay mounted and only this <main> area swaps to
 * skeleton — before this existed, the nearest boundary was the bare
 * full-page spinner at src/app/learn/loading.tsx, which blanked out the
 * header/sidebar chrome too on every navigation between dashboard routes.
 * Approximates the richest of these routes (the Normal-mode Home page:
 * HomeHeaderBar's borderless identity/stats row, HomeHero's three-card
 * composition, and LessonListView's unit sections) since it's the
 * most-visited entry point; Library and Stories get their own shape-matched
 * skeletons (see the sibling loading.tsx files) since their layout differs
 * enough that this one would be a poor stand-in.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16" aria-hidden="true">
      {/* HomeHeaderBar */}
      <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-3.5">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-6 w-36" />
          </div>
        </div>
        <div className="flex gap-8">
          <Skeleton className="h-10 w-14" />
          <Skeleton className="h-10 w-14" />
          <Skeleton className="h-10 w-14" />
        </div>
      </div>

      {/* HomeHero: large main card + two stacked right cards */}
      <div className="mb-10 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-2xl lg:h-full" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 w-full flex-1 rounded-2xl" />
          <Skeleton className="h-32 w-full flex-1 rounded-2xl" />
        </div>
      </div>

      {/* Title + progress */}
      <Skeleton className="mb-2 h-9 w-64" />
      <Skeleton className="mb-8 h-6 w-80" />
      <Skeleton className="mb-10 h-2 w-full rounded-full" />

      {/* Unit section: heading + lesson card grid */}
      <div className="flex flex-col gap-10">
        {[0, 1].map((section) => (
          <section key={section}>
            <Skeleton className="mb-4 h-6 w-48" />
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((card) => (
                <div
                  key={card}
                  className="border-border flex items-start gap-4 rounded-xl border px-5 py-4"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
