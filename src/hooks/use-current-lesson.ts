"use client";

import type { useProgress } from "@/hooks/use-progress";
import { findCurrentLesson } from "@/lib/progress/level";
import type { LessonUnit } from "@/types/content";

/**
 * The learner's real next/current Normal-mode lesson — used by HomeHero's
 * big card to know which lesson "continue" actually means. Pure passthrough
 * to findCurrentLesson.
 *
 * Takes an already-resolved `progress` (from useSharedProgress, inside the
 * Home page's ProgressProvider) rather than calling useProgress() itself —
 * see progress-provider.tsx's doc comment for the shared-instance rationale.
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
