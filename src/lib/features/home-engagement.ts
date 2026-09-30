import type { CurrentUser } from "@/lib/supabase/auth";
import { fetchActivityRange, fetchFreezeUsage } from "@/lib/features/activity-queries";
import type { ActivityDay } from "@/lib/features/activity-queries";
import type { StreakCalendarData } from "@/lib/features/calendar-actions";
import type { EffectiveFeatures } from "@/lib/features/config";
import { estimateSessionMinutes } from "@/lib/features/daily-session";
import type { DailySessionSummary } from "@/lib/features/daily-session-actions";
import { fetchDailySessionDone } from "@/lib/features/daily-session-queries";
import { countDailySessionCandidates } from "@/lib/features/daily-session-service";
import { getFeatureConfig } from "@/lib/features/queries";
import { fetchDailyQuests } from "@/lib/features/quest-queries";
import { dealDailyQuests } from "@/lib/features/quest-service";
import { allQuestsCompleted } from "@/lib/features/quests";
import type { DailyQuest, DailyQuestsPayload } from "@/lib/features/quests";
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
  /** Today's quests if the caller already read them (see startHomeEngagement); null/undefined = read them here. */
  alreadyRead?: DailyQuest[] | null,
): Promise<DailyQuestsPayload | null> {
  if (!features.quests.enabled) return null;
  try {
    const quests = await dealDailyQuests(userId, todayISO, features, alreadyRead ?? undefined);
    if (quests.length === 0) return null;
    return { quests, allDone: allQuestsCompleted(quests) };
  } catch (error) {
    console.error("[quests] loadDailyQuests failed", error);
    return null;
  }
}

/** The raw rows behind the streak strip — split from the feature gating so Home can start reading them before the gate is known. */
export interface StreakRows {
  days: ActivityDay[];
  usage: { period: string; used: number } | null;
}

export async function readStreakRows(
  userId: string,
  fromISO: string,
  toISO: string,
): Promise<StreakRows> {
  const [days, usage] = await Promise.all([
    fetchActivityRange(userId, fromISO, toISO),
    fetchFreezeUsage(userId),
  ]);
  return { days, usage };
}

export async function loadStreakCalendar(
  userId: string,
  fromISO: string,
  toISO: string,
  todayISO: string,
  features: EffectiveFeatures,
  /** The rows if the caller already read them (see startHomeEngagement); null/undefined = read them here. */
  alreadyRead?: StreakRows | null,
): Promise<StreakCalendarData | null> {
  if (!features.streakCalendar.enabled) return null;
  try {
    const { days, usage } = alreadyRead ?? (await readStreakRows(userId, fromISO, toISO));
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
 * Home's three cards as INDEPENDENT promises, so each renders the moment its own
 * data is ready instead of all of them waiting for the slowest (today's session
 * counts a lot of things; the streak strip and quests are a single read each).
 */
interface EarlyReads {
  quests: Promise<DailyQuest[] | null> | null;
  streak: Promise<StreakRows | null> | null;
}

export interface HomeEngagementStream {
  /** The learner's local date these were loaded for. */
  todayISO: string;
  dailySession: Promise<DailySessionSummary | null>;
  quests: Promise<DailyQuestsPayload | null>;
  streak: Promise<StreakCalendarData | null>;
}

/**
 * Called by the Home page BEFORE it awaits its own batch, so this runs
 * concurrently with it. `todayISO` is null when the browser hasn't yet told the
 * server its time zone (first ever visit) — returns null then, and the client
 * falls back to asking for the data itself. The promises never reject.
 *
 * Why the quests and streak strip read speculatively: whether a card is open to
 * THIS visitor is only known after the feature switches resolve, and while a
 * feature is in "Admin preview" that means an admin-role lookup first. Waiting
 * for it before touching the database put a whole extra round trip in front of
 * two single-query cards — the reason they trailed the rest of the page. So when
 * the stored setting isn't Off, their (cheap, indexed, own-rows-only) reads start
 * at once and the result is only used after the switch confirms the card is
 * open; nothing reaches the browser otherwise. Nothing is WRITTEN speculatively:
 * dealing a new day's quests still waits for that confirmation.
 */
export function startHomeEngagement(input: {
  todayISO: string | null;
  features: Promise<EffectiveFeatures>;
  user: Promise<CurrentUser | null>;
  weakWordCount: Promise<number>;
}): HomeEngagementStream | null {
  const { todayISO } = input;
  if (!todayISO) return null;
  const stripFrom = addDays(todayISO, -STRIP_LOOKBACK_DAYS);

  const early: Promise<EarlyReads> = Promise.all([input.user, getFeatureConfig()])
    .then(([user, config]) => ({
      quests:
        user && config.features.quests.state !== "off"
          ? fetchDailyQuests(user.id, todayISO).catch(() => null)
          : null,
      streak:
        user && config.features.streakCalendar.state !== "off"
          ? readStreakRows(user.id, stripFrom, todayISO).catch(() => null)
          : null,
    }))
    .catch(() => ({ quests: null, streak: null }));

  const settled = Promise.all([input.user, input.features, early]);
  const card = <T>(
    label: string,
    load: (userId: string, features: EffectiveFeatures, started: EarlyReads) => Promise<T | null>,
  ): Promise<T | null> =>
    settled
      .then(([user, features, started]) => (user ? load(user.id, features, started) : null))
      .catch((error: unknown) => {
        console.error(`[home-engagement] ${label} failed`, error);
        return null;
      });

  return {
    todayISO,
    dailySession: card("dailySession", (userId, features) =>
      loadDailySessionSummary(userId, todayISO, features, input.weakWordCount),
    ),
    quests: card("quests", async (userId, features, started) =>
      loadDailyQuests(userId, todayISO, features, started.quests ? await started.quests : null),
    ),
    streak: card("streak", async (userId, features, started) =>
      loadStreakCalendar(
        userId,
        stripFrom,
        todayISO,
        todayISO,
        features,
        started.streak ? await started.streak : null,
      ),
    ),
  };
}
