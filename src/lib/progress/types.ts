import type { LearningMode } from "@/types/content";

/**
 * A milestone newly crossed by a single markComplete call. Structured
 * (rather than a preformatted string) specifically so the rendering layer —
 * LessonCompletion, which already has useLocale()'s `t` — can localize each
 * one, instead of the reward text being baked in English at the point it's
 * computed (guest localStorage path in store.ts, signed-in Server Action
 * path in actions.ts), which neither of those two places can do since
 * neither has access to the viewer's locale/dictionary.
 */
export type RewardEvent =
  | { type: "levelUp"; levelName: string }
  | { type: "streakMilestone"; days: number }
  | { type: "lessonCountMilestone"; count: number }
  | { type: "dailyGoalReached" };

export interface LessonCompletion {
  lessonId: string;
  mode: LearningMode;
  /** ISO timestamp of the most recent completion. */
  completedAt: string;
  /** 0–1 ratio of correct to total keystrokes across the lesson's last attempt. */
  accuracy: number;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  /** Local YYYY-MM-DD of the last day a lesson was completed, or null. */
  lastActiveDate: string | null;
}

export interface DailyProgressState {
  /** Local YYYY-MM-DD this count applies to. */
  date: string;
  sentencesCompleted: number;
  goal: number;
}

export interface ProgressState {
  completions: LessonCompletion[];
  streak: StreakState;
  /** Running total, server-derived — see src/lib/progress/xp.ts. Learner level is always computed from this, never stored (see learner-level.ts). */
  xp: number;
  dailyProgress: DailyProgressState;
  /** Newly crossed milestones from the most recent markComplete call, meant to be shown once on the lesson-completion screen — never persisted or re-derived from history. */
  rewards: RewardEvent[];
  /** XP earned by the most recent markComplete call specifically (not the running total) — same one-time, never-persisted shape as rewards. */
  xpEarned: number;
  /** Null = never asked (see StartingLevelOnboarding), 0 = asked and skipped, a positive integer = the chosen tier level. Guests keep this in localStorage alongside the rest of their progress; signed-in learners keep it on profiles.starting_level. */
  startingLevel: number | null;
}

export const DEFAULT_DAILY_GOAL = 5;

export const emptyStreak: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
};

export const emptyDailyProgress: DailyProgressState = {
  date: "",
  sentencesCompleted: 0,
  goal: DEFAULT_DAILY_GOAL,
};

export const emptyProgressState: ProgressState = {
  completions: [],
  streak: emptyStreak,
  xp: 0,
  dailyProgress: emptyDailyProgress,
  rewards: [],
  xpEarned: 0,
  startingLevel: null,
};
