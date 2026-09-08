"use client";

import type { useProgress } from "@/hooks/use-progress";
import { findCurrentLesson } from "@/lib/progress/level";
import type { LessonUnit } from "@/types/content";

/**
 * The learner's real next/current Normal-mode lesson — shared by every Home
 * surface that needs to point somewhere "continue" actually means (the top
 * greeting CTA, HomeHero's big card), so they can never quietly disagree
 * about which lesson that is. Pure passthrough to findCurrentLesson.
 *
 * Takes an already-resolved `progress` (from useSharedProgress, both of
 * today's two call sites live inside the Home page's ProgressProvider)
 * rather than calling useProgress() itself — see progress-provider.tsx's
 * doc comment for why: HomeSummary and HomeHero both need this, and each
 * calling its own useProgress() independently used to mean two more
 * redundant fetches on top of the ones HomeSummary/HomeHero already
 * made directly.
 */
export function useCurrentLesson(
  units: LessonUnit[],
  isPremiumUser: boolean,
  progress: Pick<ReturnType<typeof useProgress>, "isLoaded" | "getCompletedIds" | "startingLevel">,
) {
  const { isLoaded, getCompletedIds, startingLevel } = progress;
  const completedIds = isLoaded ? getCompletedIds("normal") : [];
  const currentLesson = findCurrentLesson(units, completedIds, isPremiumUser, startingLevel);
  return { isLoaded, completedIds, currentLesson };
}
