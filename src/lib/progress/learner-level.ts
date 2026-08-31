import type { Dictionary } from "@/lib/i18n/dictionary/types";

/**
 * Learner (XP-based) levels — deliberately not named level.ts, since
 * src/lib/progress/level.ts already exists and returns an unrelated concept
 * (content difficulty tier, e.g. `LessonUnit.level`). A learner's level here
 * is always *derived* from their total XP, never stored, so adding more
 * tiers later is a one-line edit to LEARNER_LEVELS, not a schema change.
 */
export interface LearnerLevel {
  /** A stable English identifier (also the dictionary key in the `learnerLevels` section — see learnerLevelSupportLabel), not itself learner-facing display text. */
  name: string;
  minXp: number;
}

export const LEARNER_LEVELS: readonly LearnerLevel[] = [
  { name: "Beginner", minXp: 0 },
  { name: "Explorer", minXp: 200 },
  { name: "Builder", minXp: 600 },
  { name: "Fluent", minXp: 1500 },
  { name: "Advanced", minXp: 3500 },
];

const LEARNER_LEVEL_DICTIONARY_KEYS: Record<string, keyof Dictionary["learnerLevels"]> = {
  Beginner: "beginner",
  Explorer: "explorer",
  Builder: "builder",
  Fluent: "fluent",
  Advanced: "advanced",
};

/** Translates a LearnerLevel.name for display — same "never English for a support-locale learner" rule as tierSupportLabel in src/lib/levels.ts. Falls back to the raw English name if somehow not in the map (never expected, since LEARNER_LEVELS and the dictionary are both fixed). */
export function learnerLevelSupportLabel(name: string, t: Dictionary): string {
  const key = LEARNER_LEVEL_DICTIONARY_KEYS[name];
  return key ? t.learnerLevels[key] : name;
}

export interface LearnerLevelProgress {
  level: LearnerLevel;
  /** The next tier, or null if already at the highest defined level. */
  next: LearnerLevel | null;
  /** 0–1 progress toward `next`; 1 if there is no next tier. */
  progress: number;
}

export function getLearnerLevel(xp: number): LearnerLevelProgress {
  let current = LEARNER_LEVELS[0]!;
  let currentIndex = 0;

  for (let i = 0; i < LEARNER_LEVELS.length; i++) {
    const level = LEARNER_LEVELS[i]!;
    if (xp >= level.minXp) {
      current = level;
      currentIndex = i;
    }
  }

  const next = LEARNER_LEVELS[currentIndex + 1] ?? null;
  const progress = next ? (xp - current.minXp) / (next.minXp - current.minXp) : 1;

  return { level: current, next, progress: Math.min(1, Math.max(0, progress)) };
}
