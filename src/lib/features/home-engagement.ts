import type { CurrentUser } from "@/lib/supabase/auth";
import { fetchActivityRange, fetchFreezeUsage } from "@/lib/features/activity-queries";
import type { StreakCalendarData } from "@/lib/features/calendar-actions";
import type { EffectiveFeatures } from "@/lib/features/config";
import { estimateSessionMinutes } from "@/lib/features/daily-session";
import type { DailySessionSummary } from "@/lib/features/daily-session-actions";
import { fetchDailySessionDone } from "@/lib/features/daily-session-queries";
import { countDailySessionCandidates } from "@/lib/features/daily-session-service";
import { dealDailyQuests } from "@/lib/features/quest-service";
import { allQuestsCompleted } from "@/lib/features/quests";
import type { DailyQuestsPayload } from "@/lib/features/quests";
import { addDays, freezesRemaining, monthPeriod } from "@/lib/features/streak-freeze";

/**
 * Everything Home's three engagement cards (today's session, daily quests,
 * streak strip) show, loaded in ONE parallel pass. They used to be three
 * separate Server Actions fired from the browser after hydration — Next runs
 * Server Actions one at a time, so they queued behind each other, and each
 * one re-resolved the feature switches and the session from scratch. Now the
 * Home page starts this alongside its own queries (see startHomeEngagement)
 * and the cards arrive with the page; the one remaining Server Action
 * (fetchHomeEngagementAction) is only a fallback that runs this same code.
 *
 * Every loader is decoration on Home: it returns null — rendering nothing —
 * when the feature isn't open to this visitor or anything at all fails, and
 * never throws.
 */

export interface HomeEngagementData {
  /** The learner's local date these were loaded for (the client re-checks it against its own clock). */
  todayISO: string;
  dailySession: DailySessionSummary | null;
  quests: DailyQuestsPayload | null;
  streak: StreakCalendarData | null;
}

export function emptyHomeEngagement(todayISO: string): HomeEngagementData {
  return { todayISO, dailySession: null, quests: null, streak: null };
}

/** How many days back the 7-day strip reaches (today plus the six before it). */
const STRIP_LOOKBACK_DAYS = 6;

export async function loadDailySessionSummary(
  userId: string,
  todayISO: string,
  features: EffectiveFeatures,
  /** The page already computed the weak-word list — reuse its count rather than repeating that whole read. */
  weakWordCount?: Promise<number>,
): Promise<DailySessionSummary | null> {
  if (!features.dailySession.enabled) return null;
  try {
    const [completedToday, ready] = await Promise.all([
      fetchDailySessionDone(userId, todayISO).catch(() => false),
      countDailySessionCandidates(userId, features, weakWordCount),
    ]);
    return {
      ready,
      minutes: estimateSessionMinutes(ready),
      xpReward: features.dailySession.xpReward,
      completedToday,
    };
  } catch (error) {
    console.error("[daily-session] loadDailySessionSummary failed", error);
    return null;
  }
}

export async function loadDailyQuests(
  userId: string,
  todayISO: string,
  features: EffectiveFeatures,
): Promise<DailyQuestsPayload | null> {
  if (!features.quests.enabled) return null;
  try {
    const quests = await dealDailyQuests(userId, todayISO, features);
    if (quests.length === 0) return null;
    return { quests, allDone: allQuestsCompleted(quests) };
  } catch (error) {
    console.error("[quests] loadDailyQuests failed", error);
    return null;
  }
}

export async function loadStreakCalendar(
  userId: string,
  fromISO: string,
  toISO: string,
  todayISO: string,
  features: EffectiveFeatures,
): Promise<StreakCalendarData | null> {
  if (!features.streakCalendar.enabled) return null;
  try {
    const [days, usage] = await Promise.all([
      fetchActivityRange(userId, fromISO, toISO),
      fetchFreezeUsage(userId),
    ]);
    return {
      days,
      freezesRemaining: freezesRemaining(
        usage,
        monthPeriod(todayISO),
        features.streakCalendar.monthlyFreezes,
      ),
      monthlyFreezes: features.streakCalendar.monthlyFreezes,
    };
  } catch (error) {
    console.error("[features] loadStreakCalendar failed", error);
    return null;
  }
}

export async function loadHomeEngagement(
  userId: string,
  todayISO: string,
  features: EffectiveFeatures,
  weakWordCount?: Promise<number>,
): Promise<HomeEngagementData> {
  const [dailySession, quests, streak] = await Promise.all([
    loadDailySessionSummary(userId, todayISO, features, weakWordCount),
    loadDailyQuests(userId, todayISO, features),
    loadStreakCalendar(
      userId,
      addDays(todayISO, -STRIP_LOOKBACK_DAYS),
      todayISO,
      todayISO,
      features,
    ),
  ]);
  return { todayISO, dailySession, quests, streak };
}

/**
 * Called by the Home page BEFORE it awaits its own batch, so this runs
 * concurrently with it. `todayISO` is null when the browser hasn't yet told
 * the server its time zone (first ever visit) — resolves to null then, and
 * the client falls back to asking for the data itself. Never rejects.
 */
export async function startHomeEngagement(input: {
  todayISO: string | null;
  features: Promise<EffectiveFeatures>;
  user: Promise<CurrentUser | null>;
  weakWordCount: Promise<number>;
}): Promise<HomeEngagementData | null> {
  const { todayISO } = input;
  if (!todayISO) return null;
  try {
    const [features, user] = await Promise.all([input.features, input.user]);
    if (!user) return emptyHomeEngagement(todayISO);
    return await loadHomeEngagement(user.id, todayISO, features, input.weakWordCount);
  } catch (error) {
    console.error("[home-engagement] startHomeEngagement failed", error);
    return null;
  }
}
