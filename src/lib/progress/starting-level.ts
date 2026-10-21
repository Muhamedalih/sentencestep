import type { Difficulty } from "@/lib/levels";
import type { LessonCompletion } from "@/lib/progress/types";

/**
 * The 3 placement choices shown by both StartingLevelOnboarding (first
 * visit) and Settings' StartingLevelForm (change it later) — mapped onto
 * the exact same tier levels src/data/units.ts already uses for every mode
 * (level 1 = Beginner, 2 = Intermediate, 3 = Advanced), so picking
 * "Intermediate" here and seeing "Intermediate A2-B1" as your first
 * recommended lesson are one and the same level, not two parallel systems.
 */
export const STARTING_LEVEL_TIERS: readonly { difficulty: Difficulty; level: number }[] = [
  { difficulty: "beginner", level: 1 },
  { difficulty: "intermediate", level: 2 },
  { difficulty: "advanced", level: 3 },
];

/** The one dedicated "opening lesson" written for this exact moment — never the ordinary catalog's own first-incomplete-lesson pick, so a brand-new visitor's very first typing experience is always this specific, deliberately upbeat lesson, matched to the tier they just chose. Used by OnboardingIntroCard (the get-started flow's third and last step) to route "Start" to the right lesson. */
export const OPENING_LESSON_ID: Record<Difficulty, string> = {
  beginner: "onboarding-beginner",
  intermediate: "onboarding-intermediate",
  advanced: "onboarding-advanced",
};

/** Reverses STARTING_LEVEL_TIERS — turns the plain number useProgress persists back into which tier it represents, e.g. for OnboardingIntroCard to know which OPENING_LESSON_ID to route "Start" to once StartingLevelOnboarding has already set it. Accepts null (useProgress().startingLevel's own "never chosen yet" state) as a plain pass-through, so callers never need a separate guard first. */
export function difficultyForStartingLevel(level: number | null): Difficulty | null {
  if (level === null) return null;
  return STARTING_LEVEL_TIERS.find((tier) => tier.level === level)?.difficulty ?? null;
}

/**
 * The tier a guest chose, read back from the opening lesson they finished — for a guest whose saved
 * level is missing (an older bug let the country step overwrite it with null, see store.ts's
 * `latest`). The Intermediate and Advanced opening lessons are never listed in the catalog (see
 * withOpeningLessonPlacement), so the only way to reach one is the tier choice that routes to it:
 * finishing one says which tier was picked. The Beginner one is also pinned as a catalog card, so
 * finishing it says nothing. Null when none of the other two was finished.
 */
export function startingLevelFromOpeningLesson(
  completions: readonly Pick<LessonCompletion, "lessonId" | "completedAt">[],
): number | null {
  const tierOf = (lessonId: string) =>
    STARTING_LEVEL_TIERS.find(
      (tier) => tier.difficulty !== "beginner" && OPENING_LESSON_ID[tier.difficulty] === lessonId,
    );
  const first = [...completions]
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
    .find((entry) => tierOf(entry.lessonId));
  return first ? (tierOf(first.lessonId)?.level ?? null) : null;
}
