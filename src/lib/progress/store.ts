import { isDailyGoalMet, updateDailyProgress } from "@/lib/progress/daily-goal";
import { getLearnerLevel } from "@/lib/progress/learner-level";
import { getLessonCountMilestone, getStreakMilestone } from "@/lib/email/milestones";
import { todayLocalISODate, updateStreak } from "@/lib/progress/streak";
import { calculateLessonXp } from "@/lib/progress/xp";
import { emptyDailyProgress, emptyProgressState } from "@/lib/progress/types";
import type { LessonCompletion, ProgressState, RewardEvent } from "@/lib/progress/types";
import type { LearningMode } from "@/types/content";

const STORAGE_KEY = "looma:progress:v2";

export function readProgress(): ProgressState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgressState;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      completions: parsed.completions ?? [],
      streak: parsed.streak ?? emptyProgressState.streak,
      xp: parsed.xp ?? 0,
      dailyProgress: parsed.dailyProgress ?? emptyDailyProgress,
      rewards: [],
      xpEarned: 0,
      startingLevel: parsed.startingLevel ?? null,
    };
  } catch {
    return emptyProgressState;
  }
}

function writeProgress(state: ProgressState): void {
  // Rewards/xpEarned are one-time completion-screen signals, not history —
  // never persisted, so a returning guest never sees a stale reward banner
  // or XP toast replay.
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, rewards: [], xpEarned: 0 }));
}

/**
 * Called once a guest's progress has been successfully folded into their new
 * account (see migrateGuestProgressAction) — only ever after that server
 * call resolves without throwing, so a failed migration leaves the local
 * copy in place for the next attempt instead of silently losing it.
 */
export function clearProgress(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Same best-effort posture as readProgress/writeProgress — a storage
    // failure here just means the guest blob lingers, not a crash.
  }
}

/** A guest's counterpart to setStartingLevelAction — same null/0/N meaning, kept in the same localStorage blob as the rest of a guest's progress rather than a separate key. */
export function setStartingLevel(state: ProgressState, level: number): ProgressState {
  const next: ProgressState = { ...state, startingLevel: level };
  writeProgress(next);
  return next;
}

/** Records (or updates) a lesson completion, advancing streak/XP/daily-goal — mirrors the signed-in path in src/lib/progress/actions.ts exactly, so guests and signed-in learners get identical rewards logic. */
export function recordCompletion(
  state: ProgressState,
  mode: LearningMode,
  lessonId: string,
  accuracy: number,
  sentenceCount: number,
): ProgressState {
  const isFirstCompletion = !state.completions.some((entry) => entry.lessonId === lessonId);
  const todayISO = todayLocalISODate();

  const completion: LessonCompletion = {
    lessonId,
    mode,
    accuracy,
    completedAt: new Date().toISOString(),
  };
  const withoutExisting = state.completions.filter((entry) => entry.lessonId !== lessonId);
  const completions = [...withoutExisting, completion];

  const nextStreak = updateStreak(state.streak, todayISO);
  const streakJustMilestoned =
    nextStreak.currentStreak !== state.streak.currentStreak &&
    getStreakMilestone(nextStreak.currentStreak) !== null;

  const dailyGoalMetBefore = isDailyGoalMet(state.dailyProgress);
  const nextDailyProgress = updateDailyProgress(state.dailyProgress, todayISO, sentenceCount);
  const dailyGoalJustMet = !dailyGoalMetBefore && isDailyGoalMet(nextDailyProgress);

  const xpEarned = calculateLessonXp({
    accuracy,
    isFirstCompletion,
    dailyGoalMet: dailyGoalJustMet,
  });
  const nextXp = state.xp + xpEarned;

  const lessonCountAfter = completions.length;
  const lessonCountJustMilestoned =
    isFirstCompletion && getLessonCountMilestone(lessonCountAfter) !== null;

  const levelBefore = getLearnerLevel(state.xp).level.name;
  const levelAfter = getLearnerLevel(nextXp).level.name;

  const rewards: RewardEvent[] = [];
  if (levelBefore !== levelAfter) rewards.push({ type: "levelUp", levelName: levelAfter });
  if (streakJustMilestoned)
    rewards.push({ type: "streakMilestone", days: nextStreak.currentStreak });
  if (lessonCountJustMilestoned)
    rewards.push({ type: "lessonCountMilestone", count: lessonCountAfter });
  if (dailyGoalJustMet) rewards.push({ type: "dailyGoalReached" });

  const next: ProgressState = {
    completions,
    streak: nextStreak,
    xp: nextXp,
    dailyProgress: nextDailyProgress,
    rewards,
    xpEarned,
    startingLevel: state.startingLevel,
  };

  writeProgress(next);
  return next;
}
