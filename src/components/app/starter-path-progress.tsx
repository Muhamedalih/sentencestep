"use client";

import { Check } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { starterPathProgress } from "@/lib/progress/starter-path";
import { cn } from "@/lib/utils";
import type { LessonUnit } from "@/types/content";

/**
 * A calm line on Home for a learner on the free plan: how far they are through
 * the lessons open to everyone. It presents those lessons as the start of a
 * path rather than an allowance running out — the number only ever goes up,
 * there is no "N left", no colour change as the end gets near — and becomes a
 * plain "complete" once they are done. Left out for Premium learners (the
 * caller decides), while progress is still loading, while nothing is free, and
 * until the first lesson is done — a brand-new learner should meet the lesson
 * first, not a counter that shows where the free ones stop.
 */
export function StarterPathProgress({
  units,
  className,
}: {
  units: LessonUnit[];
  className?: string;
}) {
  const { t, dir } = useLocale();
  const { isLoaded, getCompletedIds } = useSharedProgress();
  if (!isLoaded) return null;

  const { done, total, finished } = starterPathProgress(units, getCompletedIds("normal"));
  if (total === 0 || done === 0) return null;

  if (finished) {
    return (
      <p
        className={cn("text-success flex items-center gap-1.5 text-xs font-medium", className)}
        dir={dir}
      >
        <Check className="size-3.5" aria-hidden="true" />
        {t.premium.starterProgressDone}
      </p>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 text-xs", className)} dir={dir}>
      <span className="text-muted-foreground font-medium">{t.premium.starterProgressLabel}</span>
      <div
        role="progressbar"
        aria-label={t.premium.starterProgressAria
          .replace("{done}", String(done))
          .replace("{total}", String(total))}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        className="bg-muted h-1.5 w-20 overflow-hidden rounded-full"
      >
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-500"
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>
      <span className="text-foreground font-semibold tabular-nums" dir="ltr">
        {done}/{total}
      </span>
    </div>
  );
}
