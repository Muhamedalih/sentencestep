"use client";

import { useLocale } from "@/components/providers/locale-provider";
import type { FreePath } from "@/lib/progress/free-path";
import { cn } from "@/lib/utils";

/**
 * The free path of the level a learner on the free plan is on, as one calm card at the
 * top of the Daily Lessons: how many of its lessons are done, one segment for each, and a
 * single line. It presents those lessons as a path to walk, not an allowance running out:
 * the number only ever goes up, nothing changes colour near the end, and nothing says what
 * is "left". The caller decides who sees it (free learners only, once their progress has
 * loaded) — see LessonListView.
 */
export function FreePathCard({ path, className }: { path: FreePath; className?: string }) {
  const { t } = useLocale();
  const { done, total, finished } = path;
  if (total === 0) return null;

  const count = t.freePath.counterCount
    .replace("{done}", String(done))
    .replace("{total}", String(total));

  return (
    <section
      aria-label={t.freePath.counterTitle}
      className={cn("border-border bg-card rounded-xl border p-4", className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 dir="auto" className="text-sm font-semibold">
          {t.freePath.counterTitle}
        </h2>
        {/* dir="auto": "2 من 4" reads right to left in Arabic and "2 of 4" left to right in the others, as one string. */}
        <span dir="auto" className="text-primary text-sm font-semibold tabular-nums">
          {count}
        </span>
      </div>
      {/* One segment per lesson, always left to right like every other progress bar here. */}
      <div
        dir="ltr"
        role="progressbar"
        aria-label={t.freePath.counterAria
          .replace("{done}", String(done))
          .replace("{total}", String(total))}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        className="my-2.5 flex gap-1"
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-500",
              index < done ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>
      <p dir="auto" className="text-muted-foreground text-xs">
        {finished ? t.freePath.counterDoneHint : t.freePath.counterHint}
      </p>
    </section>
  );
}
