import { DEFAULT_DAILY_GOAL } from "@/lib/progress/types";
import type { DailyProgressState } from "@/lib/progress/types";

/**
 * Advances today's sentence tally, mirroring streak.ts's updateStreak
 * shape: a pure function of the previous state plus "what happened," so it
 * can run identically in the guest (localStorage) and signed-in (Supabase)
 * paths. Rolls over to a fresh count (not a no-op) when `todayISO` doesn't
 * match the stored date — daily progress, unlike a streak, must reset each
 * day rather than simply stop advancing.
 */
export function updateDailyProgress(
  state: DailyProgressState,
  todayISO: string,
  sentencesJustCompleted: number,
): DailyProgressState {
  const goal = state.goal || DEFAULT_DAILY_GOAL;

  if (state.date !== todayISO) {
    return { date: todayISO, sentencesCompleted: sentencesJustCompleted, goal };
  }

  return { ...state, sentencesCompleted: state.sentencesCompleted + sentencesJustCompleted };
}

export function isDailyGoalMet(state: DailyProgressState): boolean {
  return state.sentencesCompleted >= (state.goal || DEFAULT_DAILY_GOAL);
}
