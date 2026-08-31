/**
 * Which achievements are meaningful enough to email about — a config
 * table, not a scatter of `if` statements across components. Adding or
 * changing a threshold is a one-line edit here.
 */

/** Ordinary ("normal" mode) lessons are short single sentences, so only these totals are worth an email — not every single one. */
export const LESSON_COUNT_MILESTONES: readonly number[] = [1, 5, 10, 25, 50];

/** Streak lengths (days) worth celebrating. */
export const STREAK_MILESTONES: readonly number[] = [3, 7, 14, 30, 60, 100];

/** Days of no activity before a reminder becomes appropriate. */
export const INACTIVITY_THRESHOLD_DAYS = 3;

/** Returns the matching milestone number if `count` lands exactly on one, else null. */
export function getLessonCountMilestone(count: number): number | null {
  return LESSON_COUNT_MILESTONES.includes(count) ? count : null;
}

/** Returns the matching milestone number if `streak` lands exactly on one, else null. */
export function getStreakMilestone(streak: number): number | null {
  return STREAK_MILESTONES.includes(streak) ? streak : null;
}
