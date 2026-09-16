"use client";

import type { useProgress } from "@/hooks/use-progress";
import { findCurrentLesson } from "@/lib/progress/level";
import { getAnyLessonResume } from "@/lib/progress/lesson-resume";
import type { LessonUnit } from "@/types/content";

/**
 * The learner's real next/current Normal-mode lesson — used by HomeHero's
 * big card to know which lesson "continue" actually means.
 *
 * Prefers a genuine in-progress checkpoint (see lesson-resume.ts) over
 * findCurrentLesson's plain "next incomplete lesson in order" when one
 * exists for THIS mode: a lesson the learner actually started and left
 * mid-way through is a stronger "continue" than the next untouched one in
 * the catalog, even if they happen to be the same lesson most of the time.
 * Falls through to findCurrentLesson whenever there's no checkpoint, the
 * checkpointed lesson isn't in this list (wrong mode, or removed from the
 * catalog since), or it's already completed (checkpoint just hadn't been
 * cleared yet for some reason) — never fabricates a resume state.
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

  const resume = getAnyLessonResume();
  const resumedLesson =
    resume?.mode === "normal" && !completedIds.includes(resume.lessonId)
      ? units.find((unit) => unit.id === resume.lessonId)
      : undefined;

  const currentLesson =
    resumedLesson ?? findCurrentLesson(units, completedIds, isPremiumUser, startingLevel);
  const isResumed = Boolean(resumedLesson);

  return { isLoaded, completedIds, currentLesson, isResumed };
}
