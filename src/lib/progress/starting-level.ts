import type { Difficulty } from "@/lib/levels";

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
