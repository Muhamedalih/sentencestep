"use client";

import { useProgress } from "@/hooks/use-progress";
import { findCurrentLesson } from "@/lib/progress/level";
import type { LessonUnit } from "@/types/content";

/**
 * The learner's real next/current Normal-mode lesson — shared by every Home
 * surface that needs to point somewhere "continue" actually means (the top
 * greeting CTA, HomeHero's big card), so they can never quietly disagree
 * about which lesson that is. Pure passthrough to findCurrentLesson with
 * this hook's own progress/premium context resolved once.
 */
export function useCurrentLesson(units: LessonUnit[], isPremiumUser: boolean) {
  const { isLoaded, getCompletedIds, startingLevel } = useProgress();
  const completedIds = isLoaded ? getCompletedIds("normal") : [];
  const currentLesson = findCurrentLesson(units, completedIds, isPremiumUser, startingLevel);
  return { isLoaded, completedIds, currentLesson };
}
