"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { useCurrentLesson } from "@/hooks/use-current-lesson";
import { cn } from "@/lib/utils";
import type { LessonUnit } from "@/types/content";

/**
 * The Home dashboard's small personal-context element (redesign, Section 1)
 * — sits to the left of the enlarged DashboardSummary stats block, using the
 * one piece of real, already-available identity data a signed-in learner
 * has: their own display name (see CurrentUser.displayName, fetched
 * server-side in (dashboard)/[mode]/page.tsx and passed straight through, no
 * new query). A guest, or a signed-in learner who never set a display name,
 * gets the exact same "Welcome back" already used for the login screen
 * (`t.auth.loginHeading`) rather than a broken "Welcome back, null" — never
 * a fabricated name.
 *
 * Also the page's actual highest-intent action: a real "Continue"/"Start"
 * button (useCurrentLesson — the same lookup HomeHero's own big card uses,
 * so the two can never point at different lessons), moved up here rather
 * than left buried below the stats block, which used to be the first thing
 * a returning learner had to scroll past before reaching anything
 * clickable.
 */
export function HomeGreeting({
  displayName,
  units,
  isPremiumUser,
  className,
}: {
  displayName: string | null;
  units: LessonUnit[];
  isPremiumUser: boolean;
  className?: string;
}) {
  const { t } = useLocale();
  const progress = useSharedProgress();
  const { isLoaded, completedIds, currentLesson } = useCurrentLesson(
    units,
    isPremiumUser,
    progress,
  );

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "border-border/60 bg-card/60 flex flex-col justify-center gap-2 rounded-2xl border p-5",
          className,
        )}
        aria-hidden="true"
      >
        <div className="bg-muted h-5 w-32 animate-pulse rounded" />
        <div className="bg-muted h-4 w-40 animate-pulse rounded" />
      </div>
    );
  }

  const ctaLabel = completedIds.length > 0 ? t.common.continueLearning : t.common.startLearning;

  return (
    <div
      className={cn(
        "border-border/60 bg-card/60 flex flex-col justify-center gap-3 rounded-2xl border p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-2.5">
        <p className="text-muted-foreground text-sm font-medium">{t.progress.welcomeBackLabel}</p>
        {displayName ? (
          // Same off-white "sticker" chip language as NeedsReviewWords' word
          // count badge (Word Lists) — the one place on this page that isn't
          // themed to the dark palette, so the learner's own name reads as a
          // small, personal badge rather than blending into the stats row
          // beside it.
          <div
            dir="ltr"
            className="w-fit -rotate-1 rounded-xl bg-[oklch(0.96_0.015_85)] px-4 py-2 text-[oklch(0.32_0.03_60)] shadow-[0_2px_0_0_oklch(0.85_0.03_80)]"
          >
            <span dir="auto" className="block truncate text-lg font-bold tracking-tight sm:text-xl">
              {displayName}
            </span>
          </div>
        ) : (
          <p className="truncate text-lg font-semibold tracking-tight sm:text-xl">
            {t.auth.loginHeading}
          </p>
        )}
      </div>

      {currentLesson && (
        <Button asChild className="w-fit">
          <Link href={`/learn/normal/${currentLesson.id}`}>
            {ctaLabel}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      )}
    </div>
  );
}
