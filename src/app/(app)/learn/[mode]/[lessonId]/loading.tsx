import { Skeleton } from "@/components/ui/skeleton";

/**
 * The lesson player (src/app/learn/[mode]/[lessonId]/page.tsx) renders
 * full-viewport with no header/sidebar (see that route's own layout doc
 * comment) — this matches the same "lesson-shell h-svh w-full" sizing so
 * there's no viewport-height jump once the real session mounts, instead of
 * falling back to the bare centered spinner every other /learn route used
 * to show.
 */
export default function Loading() {
  return (
    <div
      className="lesson-shell bg-background text-foreground flex h-svh w-full flex-col"
      aria-hidden="true"
    >
      <div className="mx-auto w-full max-w-2xl px-6 pt-6">
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-6">
        <Skeleton className="aspect-[16/9] w-full max-w-sm rounded-2xl" />
        <div className="flex w-full flex-col items-center gap-3">
          <Skeleton className="h-7 w-3/4 max-w-md" />
          <Skeleton className="h-7 w-1/2 max-w-sm" />
        </div>
      </div>
    </div>
  );
}
