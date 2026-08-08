import type { LearningMode } from "@/types/content";

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

export interface ProgressState {
  completions: LessonCompletion[];
  streak: StreakState;
}

export const emptyStreak: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: null,
};

export const emptyProgressState: ProgressState = {
  completions: [],
  streak: emptyStreak,
};
