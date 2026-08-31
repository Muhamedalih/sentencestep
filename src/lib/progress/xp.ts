/**
 * Pure XP calculation, mirroring the shape of streak.ts's updateStreak —
 * called server-side in recordCompletionAction (and client-side in
 * store.ts's guest path) from already-validated inputs, never from anything
 * the client asserts about its own reward.
 */
export interface LessonXpInput {
  /** 0–1 ratio of correct to total keystrokes across the lesson. */
  accuracy: number;
  /** Whether this is the first time this exact lesson has ever been completed. */
  isFirstCompletion: boolean;
  /** Whether completing this lesson is what pushed today's daily goal over the line. */
  dailyGoalMet: boolean;
}

const BASE_XP = 20;
const HIGH_ACCURACY_THRESHOLD = 0.95;
const HIGH_ACCURACY_BONUS = 10;
const FIRST_COMPLETION_BONUS = 15;
const DAILY_GOAL_BONUS = 10;

/** Kept intentionally small — meaningful per lesson, not an inflationary point system. */
export function calculateLessonXp({
  accuracy,
  isFirstCompletion,
  dailyGoalMet,
}: LessonXpInput): number {
  let xp = BASE_XP;
  if (accuracy >= HIGH_ACCURACY_THRESHOLD) xp += HIGH_ACCURACY_BONUS;
  if (isFirstCompletion) xp += FIRST_COMPLETION_BONUS;
  if (dailyGoalMet) xp += DAILY_GOAL_BONUS;
  return xp;
}
