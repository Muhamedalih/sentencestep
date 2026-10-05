"use server";

import { after } from "next/server";

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
import {
  fetchProfileCountry,
  fetchProfileDailyGoal,
  fetchProfileStartingLevel,
} from "@/lib/supabase/queries/profile";
import { evaluateAndNotify } from "@/lib/email/notification-triggers";
import { getLessonCountMilestone, getStreakMilestone } from "@/lib/email/milestones";
import { completedEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { getLessonById } from "@/lib/content";
import { hasPremiumAccess } from "@/lib/billing/access";
import { isAdmin } from "@/lib/admin/access";
import { isDailyGoalMet } from "@/lib/progress/daily-goal";
import { getLearnerLevel } from "@/lib/progress/learner-level";
import { isGraceDay } from "@/lib/progress/streak";
import { calculateLessonXp } from "@/lib/progress/xp";
import {
  computeMigrationDailyProgress,
  computeMigrationXp,
  mergeStreak,
  selectCompletionsToMigrate,
} from "@/lib/progress/guest-migration";
import { emptyProgressState } from "@/lib/progress/types";
import {
  consumeStreakFreezes,
  fetchFreezeUsage,
  recordActivityDay,
  recordStreakBridgeDays,
} from "@/lib/features/activity-queries";
import { disabledFeatures } from "@/lib/features/config";
import { getEffectiveFeatures } from "@/lib/features/queries";
import { awardQuestDayBadgeIfDone, evaluateAndAwardBadges } from "@/lib/features/badge-service";
import { summarizeNewBadges } from "@/lib/features/badges";
import { dealDailyQuests, recordQuestEvents } from "@/lib/features/quest-service";
import { questEventsForLesson } from "@/lib/features/quests";
import { freezesRemaining, monthPeriod, planStreakUpdate } from "@/lib/features/streak-freeze";
import type { StreakPlan } from "@/lib/features/streak-freeze";
import { setCountryAction, setStartingLevelAction } from "@/lib/supabase/profile-actions";
import { recordVocabularyEncountersForLesson } from "@/lib/vocabulary-recall/record-encounters";
import type { ValidatedGuestCompletion } from "@/lib/progress/guest-migration";
import type {
  LessonCompletion,
  ProgressState,
  RewardEvent,
  StreakState,
} from "@/lib/progress/types";
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
 * The streak update for this completion. With the admin "streak calendar &
 * freeze" feature on, extra consecutive missed days (beyond the free
 * one-day grace) are covered by spending freezes from the learner's monthly
 * balance; otherwise it is exactly the original updateStreak behavior. Any
 * failure reading or spending freezes (e.g. the migration isn't applied to
 * this environment yet) degrades to the original behavior — a lesson
 * completion must never fail over an optional protection feature.
 */
async function planStreakForCompletion(
  userId: string,
  beforeStreak: StreakState,
  todayISO: string,
  freezeConfig: { enabled: boolean; monthlyFreezes: number },
): Promise<StreakPlan> {
  if (!freezeConfig.enabled) return planStreakUpdate(beforeStreak, todayISO, 0);
  try {
    const period = monthPeriod(todayISO);
    const usage = await fetchFreezeUsage(userId);
    const available = freezesRemaining(usage, period, freezeConfig.monthlyFreezes);
    const plan = planStreakUpdate(beforeStreak, todayISO, available);
    if (plan.freezesUsed === 0) return plan;
    const spent = await consumeStreakFreezes(period, plan.freezesUsed, freezeConfig.monthlyFreezes);
    // Someone else (another tab) spent the balance first: let the streak
    // fall back to the no-freeze outcome rather than granting a free save.
    return spent >= plan.freezesUsed ? plan : planStreakUpdate(beforeStreak, todayISO, 0);
  } catch (error) {
    console.error("[progress] planStreakForCompletion: freeze handling failed", error);
    return planStreakUpdate(beforeStreak, todayISO, 0);
  }
}

/** Runs an optional, best-effort write on the completion path and swallows its failure — see planStreakForCompletion. */
async function bestEffort(label: string, write: () => Promise<void>): Promise<void> {
  try {
    await write();
  } catch (error) {
    console.error(`[progress] ${label} failed`, error);
  }
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

  const [rows, streak, xp, dailyProgress, dailyGoal, startingLevel, country] = await Promise.all([
    fetchUserProgress(userId),
    fetchStreak(userId),
    fetchXp(userId),
    fetchDailyProgress(userId, todayISO),
    fetchProfileDailyGoal(userId),
    fetchProfileStartingLevel(userId),
    fetchProfileCountry(userId),
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
    country,
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
  const [beforeRows, beforeStreak, dailyGoal, completion, features] = await Promise.all([
    fetchUserProgress(userId),
    fetchStreak(userId).then((streak) => streak ?? emptyProgressState.streak),
    fetchProfileDailyGoal(userId),
    upsertLessonCompletion({ userId, lessonId, mode, accuracy: safeAccuracy }),
    getEffectiveFeatures().catch(() => disabledFeatures(true)),
  ]);

  const { isFirstCompletion } = completion;
  const lessonCountBefore = beforeRows.filter((row) => row.completed_at).length;

  const streakPlan = await planStreakForCompletion(
    userId,
    beforeStreak,
    todayISO,
    features.streakCalendar,
  );
  const nextStreak = streakPlan.streak;
  const streakJustMilestoned =
    nextStreak.currentStreak !== beforeStreak.currentStreak &&
    getStreakMilestone(nextStreak.currentStreak) !== null;
  const streakGraceDayUsed = isGraceDay(beforeStreak.lastActiveDate, todayISO);

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

  // Daily quests (admin feature): make sure today's are dealt — a learner may
  // go straight to a lesson without opening Home first — then feed this
  // lesson's events in. Both are best-effort; quest XP is granted atomically
  // in the database when a quest completes, so it is folded into the totals
  // below rather than re-applied here.
  if (features.quests.enabled) {
    await dealDailyQuests(userId, todayISO, features).catch((error: unknown) => {
      console.error("[progress] dealDailyQuests failed", error);
    });
  }
  const completedQuests = features.quests.enabled
    ? await recordQuestEvents(
        questEventsForLesson({ sentenceCount, accuracy: safeAccuracy }),
        todayISO,
        features,
      )
    : [];
  const questXp = completedQuests.reduce((sum, quest) => sum + quest.xp, 0);

  const levelBefore = getLearnerLevel(beforeXp).level.name;
  const levelAfter = getLearnerLevel(nextXp + questXp).level.name;

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
  if (streakGraceDayUsed) rewards.push({ type: "streakGraceDay" });
  if (streakPlan.freezesUsed > 0) {
    rewards.push({ type: "streakFreezeUsed", count: streakPlan.freezesUsed });
  }
  for (const quest of completedQuests) {
    rewards.push({ type: "questCompleted", questType: quest.type, xp: quest.xp });
  }

  await Promise.all([
    upsertStreak(userId, {
      currentStreak: nextStreak.currentStreak,
      longestStreak: nextStreak.longestStreak,
      lastActiveDate: nextStreak.lastActiveDate as string,
    }),
    insertLessonAttempt({ userId, lessonId, mode, accuracy: safeAccuracy, wpm: safeWpm }),
    // The per-day activity log behind the streak calendar — always recorded
    // (cheap, and it means history exists the day the feature is switched
    // on), never at the cost of the completion itself.
    ...(features.streakCalendar.trackActivity
      ? [
          bestEffort("recordActivityDay", () =>
            recordActivityDay(todayISO, sentenceCount, xpEarned),
          ),
          bestEffort("recordStreakBridgeDays", () => recordStreakBridgeDays(streakPlan.bridges)),
        ]
      : []),
  ]);

  // Badges (admin feature): after everything above has landed — streak,
  // activity day, XP, quest XP — so the stats they're measured against are
  // current. Retroactive by construction (see evaluateAndAwardBadges), so
  // many can arrive at once; those collapse into one summary line.
  if (features.badges.enabled) {
    const stat = await evaluateAndAwardBadges(userId, features);
    const questDay = completedQuests.length > 0 ? await awardQuestDayBadgeIfDone(userId) : [];
    const { individual, bulkCount } = summarizeNewBadges([...stat, ...questDay]);
    for (const badgeId of individual) rewards.push({ type: "badgeEarned", badgeId });
    if (bulkCount > 0) rewards.push({ type: "badgesBulk", count: bulkCount });
  }

  const progress = await fetchProgressAction(todayISO);
  progress.rewards = rewards;
  progress.xpEarned = xpEarned + questXp;

  // Milestone emails, analytics, and Vocabulary Recall scheduling are all
  // side effects that never change what this action returns — none of their
  // results feed back into `progress`, and each already catches its own
  // errors internally (evaluateAndNotify, track, recordVocabularyEncountersForLesson
  // — see their own doc comments). They used to run here, awaited, before
  // the learner's "lesson complete" screen could render: on an ordinary
  // completion that's a handful of fast Supabase calls, but the moment a
  // milestone actually fires, evaluateAndNotify also sends a real email
  // through an external provider in the same critical path — the measured
  // cause of "exiting a lesson" occasionally taking far longer than usual
  // (fast on most completions, multi-second on a streak/level/lesson-count
  // milestone day). after() runs this exact same sequence, in the exact
  // same order, immediately once the response carrying `progress` has
  // already been sent to the learner — same total work, same eventual
  // milestone emails/analytics/recall scheduling, just no longer something
  // the learner's screen waits on. Wrapped in its own try/catch purely to
  // keep an unexpected failure here from surfacing as server-log noise; it
  // can no longer affect the response either way, since that already went
  // out.
  after(async () => {
    try {
      const { level, levelCompleted } = await evaluateAndNotify(userId, mode, lessonId, progress);

      await track(completedEvent(mode, lessonId, level ?? 0, safeAccuracy), userId);
      if (levelCompleted && level !== null) {
        await track(
          { name: "LEVEL_COMPLETED", category: "PROGRESS", properties: { mode, level } },
          userId,
        );
      }

      await recordVocabularyEncountersForLesson(lesson);
    } catch (error) {
      console.error("[progress] recordCompletionAction: post-response side effects failed", error);
    }
  });

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

  const [
    existingRows,
    existingStreak,
    dailyGoal,
    existingStartingLevel,
    existingCountry,
    isPremium,
    isAdminUser,
  ] = await Promise.all([
    fetchUserProgress(userId),
    fetchStreak(userId),
    fetchProfileDailyGoal(userId),
    fetchProfileStartingLevel(userId),
    fetchProfileCountry(userId),
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

  if (existingCountry === null && guest.country !== null) {
    await setCountryAction(guest.country);
  }

  return fetchProgressAction(todayISO);
}
