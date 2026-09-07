"use server";

import { createClient } from "@/lib/supabase/server";
import {
  fetchDailyProgress,
  fetchStreak,
  fetchUserProgress,
  fetchXp,
  incrementDailyProgress,
  incrementXp,
  insertLessonAttempt,
  upsertLessonCompletion,
  upsertStreak,
} from "@/lib/supabase/queries/progress";
import { fetchProfileDailyGoal, fetchProfileStartingLevel } from "@/lib/supabase/queries/profile";
import { evaluateAndNotify } from "@/lib/email/notification-triggers";
import { getLessonCountMilestone, getStreakMilestone } from "@/lib/email/milestones";
import { completedEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { getLessonById } from "@/lib/content";
import { hasPremiumAccess } from "@/lib/billing/access";
import { isAdmin } from "@/lib/admin/access";
import { isDailyGoalMet } from "@/lib/progress/daily-goal";
import { getLearnerLevel } from "@/lib/progress/learner-level";
import { updateStreak } from "@/lib/progress/streak";
import { calculateLessonXp } from "@/lib/progress/xp";
import {
  computeMigrationDailyProgress,
  computeMigrationXp,
  mergeStreak,
  selectCompletionsToMigrate,
} from "@/lib/progress/guest-migration";
import { emptyProgressState } from "@/lib/progress/types";
import { setStartingLevelAction } from "@/lib/supabase/profile-actions";
import type { ValidatedGuestCompletion } from "@/lib/progress/guest-migration";
import type { LessonCompletion, ProgressState, RewardEvent } from "@/lib/progress/types";
import type { LearningMode } from "@/types/content";

/**
 * The authenticated user's id, resolved from their session — never accepted
 * as an argument from the client, per "don't trust a client-supplied user
 * id for authorization." Row Level Security enforces the same boundary at
 * the database layer, but there's no reason for these actions to rely on
 * that alone when the session already gives the real answer.
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}

function toCompletions(rows: Awaited<ReturnType<typeof fetchUserProgress>>): LessonCompletion[] {
  return rows
    .filter((row) => row.completed_at)
    .map((row) => ({
      lessonId: row.lesson_id,
      mode: row.mode,
      completedAt: row.completed_at as string,
      accuracy: row.accuracy ?? 1,
    }));
}

/**
 * Reads the signed-in learner's progress from Supabase; an empty state for
 * guests. `todayISO` is the learner's own local calendar date (see
 * todayLocalISODate), passed in by the caller rather than computed here,
 * since a Server Action runs in the server's time zone, not the learner's —
 * same rationale as migrateGuestProgressAction's identical parameter.
 */
export async function fetchProgressAction(todayISO: string): Promise<ProgressState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return emptyProgressState;

  const [rows, streak, xp, dailyProgress, dailyGoal, startingLevel] = await Promise.all([
    fetchUserProgress(userId),
    fetchStreak(userId),
    fetchXp(userId),
    fetchDailyProgress(userId, todayISO),
    fetchProfileDailyGoal(userId),
    fetchProfileStartingLevel(userId),
  ]);
  return {
    completions: toCompletions(rows),
    streak: streak ?? emptyProgressState.streak,
    xp,
    // profiles.daily_goal is the one durable source of truth for "what's my
    // target" (see 20250140000000_settings_onboarding.sql's doc comment) —
    // today's row only ever seeds a goal at creation time (see
    // increment_daily_progress's ON CONFLICT, which deliberately never
    // touches goal on an existing row), so a goal changed in Settings mid-day
    // is reflected here immediately rather than waiting for tomorrow's row.
    dailyProgress: { ...dailyProgress, goal: dailyGoal },
    // Rewards/xpEarned are one-time signals produced by
    // recordCompletionAction only — a plain state fetch never has a "just
    // happened" milestone or XP grant to report.
    rewards: [],
    xpEarned: 0,
    startingLevel,
  };
}

/**
 * Records a completion (and advances the streak) for the signed-in learner,
 * then returns the refreshed state. This is a Server Action, which means
 * it's reachable as a direct POST regardless of what the UI that normally
 * calls it renders — so it re-checks, server-side, that `lessonId` is a real
 * lesson the caller actually has access to (free, or premium with an active
 * subscription) before writing anything. Without this, a crafted request
 * could record — and get milestone-emailed/analytics-tracked for —
 * "completing" premium content never actually unlocked. getLessonById()
 * itself never returns sentences the caller isn't entitled to (see its RLS
 * policy), so this reuses the exact same access boundary the lesson page
 * renders against, rather than re-deriving a second one — including the
 * isAdmin() alternative-"yes" the lesson page also grants access through
 * (see src/app/learn/[mode]/[lessonId]/page.tsx), so an admin who can open
 * and complete a premium lesson can also save that completion.
 */
export async function recordCompletionAction(
  mode: LearningMode,
  lessonId: string,
  accuracy: number,
  wpm: number,
  /** The learner's own local calendar date — see fetchProgressAction's identical parameter for why this can't be computed server-side. */
  todayISO: string,
): Promise<ProgressState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new Error("Sign in to save progress.");

  const lesson = await getLessonById(mode, lessonId);
  if (!lesson) throw new Error("That lesson doesn't exist.");
  if (!lesson.isFree && !(await Promise.all([hasPremiumAccess(), isAdmin()])).some(Boolean)) {
    throw new Error("You don't have access to that lesson.");
  }

  // Clamped defensively, even though a legitimate client always computes
  // this as correctCount / attemptCount (already in range) — the database
  // constraint would reject an out-of-range value anyway; failing that
  // constraint from here would surface as an unhandled 500 instead of this
  // clean clamp. wpm gets the same treatment — a client-timed value, same
  // trust model as accuracy, just clamped to a sane non-negative range
  // rather than [0,1].
  const safeAccuracy = Math.min(1, Math.max(0, accuracy));
  const safeWpm = Math.max(0, Math.round(Number.isFinite(wpm) ? wpm : 0));
  const sentenceCount = lesson.sentences.length;

  // "Before" state, read once so every reward below is a transition (did
  // *this* completion cross a threshold), not just "is the current value on
  // one" — the latter would re-fire the same reward on every later lesson
  // completed while, say, the streak sits unchanged on a milestone day.
  // XP, daily progress, and isFirstCompletion are NOT read here the way
  // streak/lesson-count-before are: each is written via an atomic RPC below
  // (see incrementXp/incrementDailyProgress/upsertLessonCompletion's own doc
  // comments for why a separate read-then-write here would be a real
  // concurrency bug — two near-simultaneous completions of the same lesson
  // could otherwise both be scored as the first one — not just unnecessary),
  // so their "before"/transition values come back from those same atomic
  // calls instead of a racy prior read. lessonCountBefore is a plain count
  // for milestone messaging only, not a correctness-critical write, so a
  // stale read in that same rare race window only means a milestone number
  // display is off by one, never a lost or duplicated reward.
  const [beforeRows, beforeStreak, dailyGoal, completion] = await Promise.all([
    fetchUserProgress(userId),
    fetchStreak(userId).then((streak) => streak ?? emptyProgressState.streak),
    fetchProfileDailyGoal(userId),
    upsertLessonCompletion({ userId, lessonId, mode, accuracy: safeAccuracy }),
  ]);

  const { isFirstCompletion } = completion;
  const lessonCountBefore = beforeRows.filter((row) => row.completed_at).length;

  const nextStreak = updateStreak(beforeStreak, todayISO);
  const streakJustMilestoned =
    nextStreak.currentStreak !== beforeStreak.currentStreak &&
    getStreakMilestone(nextStreak.currentStreak) !== null;

  // Daily progress is incremented first, atomically, because dailyGoalMet
  // feeds into calculateLessonXp below — xpEarned can't be computed (and
  // XP's own increment can't be issued) until this settles. beforeDailyProgress
  // is derived from the atomic result (sentencesCompleted minus what THIS
  // completion just added) rather than a separate prior read, for the same
  // reason beforeXp is below.
  const nextDailyProgress = await incrementDailyProgress(todayISO, sentenceCount, dailyGoal);
  const dailyGoalMetBefore = isDailyGoalMet({
    ...nextDailyProgress,
    sentencesCompleted: nextDailyProgress.sentencesCompleted - sentenceCount,
  });
  const dailyGoalJustMet = !dailyGoalMetBefore && isDailyGoalMet(nextDailyProgress);

  const xpEarned = calculateLessonXp({
    accuracy: safeAccuracy,
    isFirstCompletion,
    dailyGoalMet: dailyGoalJustMet,
  });
  const { previousXp: beforeXp, xp: nextXp } = await incrementXp(xpEarned);
  const levelBefore = getLearnerLevel(beforeXp).level.name;
  const levelAfter = getLearnerLevel(nextXp).level.name;

  const lessonCountAfter = lessonCountBefore + (isFirstCompletion ? 1 : 0);
  const lessonCountJustMilestoned =
    isFirstCompletion && getLessonCountMilestone(lessonCountAfter) !== null;

  const rewards: RewardEvent[] = [];
  if (levelBefore !== levelAfter) rewards.push({ type: "levelUp", levelName: levelAfter });
  if (streakJustMilestoned)
    rewards.push({ type: "streakMilestone", days: nextStreak.currentStreak });
  if (lessonCountJustMilestoned)
    rewards.push({ type: "lessonCountMilestone", count: lessonCountAfter });
  if (dailyGoalJustMet) rewards.push({ type: "dailyGoalReached" });

  await Promise.all([
    upsertStreak(userId, {
      currentStreak: nextStreak.currentStreak,
      longestStreak: nextStreak.longestStreak,
      lastActiveDate: nextStreak.lastActiveDate as string,
    }),
    insertLessonAttempt({ userId, lessonId, mode, accuracy: safeAccuracy, wpm: safeWpm }),
  ]);

  const progress = await fetchProgressAction(todayISO);
  progress.rewards = rewards;
  progress.xpEarned = xpEarned;

  // Milestone emails are a side effect, never a requirement for completion
  // to succeed — evaluateAndNotify catches its own errors internally.
  const { level, levelCompleted } = await evaluateAndNotify(userId, mode, lessonId, progress);

  // Analytics is likewise a side effect only — track() never throws, and a
  // missing/unresolvable level (level === null) just means the completed
  // event carries no level rather than blocking anything.
  await track(completedEvent(mode, lessonId, level ?? 0, safeAccuracy), userId);
  if (levelCompleted && level !== null) {
    await track(
      { name: "LEVEL_COMPLETED", category: "PROGRESS", properties: { mode, level } },
      userId,
    );
  }

  return progress;
}

/**
 * Folds a guest's localStorage progress into their account right after they
 * authenticate — see useProgress's call site and
 * src/lib/progress/guest-migration.ts for the merge rules this relies on.
 * Never trusts the guest's own numbers directly: every completion is
 * re-validated against real content + access exactly like
 * recordCompletionAction (a forged localStorage entry for a premium lesson
 * must never become a real completion), a lesson already completed
 * server-side is left untouched rather than overwritten, and XP/daily
 * progress are recomputed from the validated completions rather than taken
 * from the guest's own (client-controlled) totals. Safe to call more than
 * once — a re-run finds no completions still missing server-side and
 * changes nothing, which is what lets the caller not worry about a mount
 * racing itself.
 *
 * `todayISO` is the learner's own local calendar date (see
 * todayLocalISODate), passed in by the caller rather than computed here,
 * since a Server Action runs in the server's time zone, not the learner's.
 */
export async function migrateGuestProgressAction(
  guest: ProgressState,
  todayISO: string,
): Promise<ProgressState> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return emptyProgressState;

  const [existingRows, existingStreak, dailyGoal, existingStartingLevel, isPremium, isAdminUser] =
    await Promise.all([
      fetchUserProgress(userId),
      fetchStreak(userId),
      fetchProfileDailyGoal(userId),
      fetchProfileStartingLevel(userId),
      hasPremiumAccess(),
      isAdmin(),
    ]);
  const existingLessonIds = new Set(
    existingRows.filter((row) => row.completed_at).map((row) => row.lesson_id),
  );

  const validated: ValidatedGuestCompletion[] = [];
  for (const completion of guest.completions) {
    const lesson = await getLessonById(completion.mode, completion.lessonId);
    if (!lesson) continue;
    if (!lesson.isFree && !isPremium && !isAdminUser) continue;
    validated.push({
      lessonId: completion.lessonId,
      mode: completion.mode,
      accuracy: Math.min(1, Math.max(0, completion.accuracy)),
      completedAt: completion.completedAt,
      sentenceCount: lesson.sentences.length,
    });
  }

  const toMigrate = selectCompletionsToMigrate(validated, existingLessonIds);

  for (const completion of toMigrate) {
    await upsertLessonCompletion({
      userId,
      lessonId: completion.lessonId,
      mode: completion.mode,
      accuracy: completion.accuracy,
    });
  }

  const xpDelta = computeMigrationXp(toMigrate);
  if (xpDelta > 0) await incrementXp(xpDelta);

  const dailyDelta = computeMigrationDailyProgress(toMigrate, todayISO);
  if (dailyDelta > 0) await incrementDailyProgress(todayISO, dailyDelta, dailyGoal);

  const { streak: nextStreak, changed: streakChanged } = mergeStreak(existingStreak, guest.streak);
  if (streakChanged) {
    await upsertStreak(userId, {
      currentStreak: nextStreak.currentStreak,
      longestStreak: nextStreak.longestStreak,
      lastActiveDate: nextStreak.lastActiveDate as string,
    });
  }

  if (existingStartingLevel === null && guest.startingLevel !== null) {
    await setStartingLevelAction(guest.startingLevel);
  }

  return fetchProgressAction(todayISO);
}
