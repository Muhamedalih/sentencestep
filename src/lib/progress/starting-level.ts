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
