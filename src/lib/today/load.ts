import { countTodayReviewCandidates } from "@/lib/features/daily-session-service";
import { localISODateInTimeZone } from "@/lib/features/learner-date";
import { cefrForLevel } from "@/lib/home-plan/plan";
import type { SupportLocale } from "@/lib/i18n/locales";
import type { ProgressState } from "@/lib/progress/types";
import { todayLocalISODate } from "@/lib/progress/streak";
import { WEEK_TARGET_DAYS } from "@/lib/session-end/summary";
import { fetchWordProgress } from "@/lib/supabase/queries/word-progress";
import { getLessonSummaries } from "@/lib/content";
import type { LessonCounts } from "@/lib/content";
import { fetchProgressCached } from "@/lib/progress/cached";
import type { LessonUnit } from "@/types/content";

import { pickNewItems } from "./next";
import type { TodayItem } from "./next";
import { daysBetween, defaultLengthFor, planAllLengths } from "./plan";
import type { SessionLength, TodayPlan } from "./plan";
import { fetchSessionDatesSince } from "./queries";
import { weekDates, weekDots, weekStartFor, weekdayInitial } from "./week";
import type { WeekDot } from "./week";

export interface TodayStats {
  sentences: number;
  /** Sentences typed in lessons finished in the last seven days. */
  sentencesThisWeek: number;
  lessons: number;
  /** Words finished in Word Lists; the card leaves the stat out at 0. */
  words: number;
}

export interface TodayData {
  plans: Record<SessionLength, TodayPlan>;
  defaultLength: SessionLength;
  next: TodayItem | null;
  upcoming: TodayItem[];
  locked: TodayItem | null;
  /** A Today session was already finished on the learner's calendar day. */
  doneToday: boolean;
  week: { dots: WeekDot[]; done: number; target: number };
  stats: TodayStats;
  /** CEFR code of the level Today is serving (A1, A2-B1, B2). */
  levelCode: string;
  /** Free learners only: free lessons and stories finished out of all free ones. */
  freeContent: { done: number; total: number } | null;
  dateLabel: string;
}

async function quiet<T>(label: string, read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    console.error(`[today] ${label} failed`, error);
    return fallback;
  }
}

/** "Wednesday 21 October" in the learner's language and zone; Arabic keeps Western digits like the rest of the app. */
function formatDate(locale: SupportLocale | null, timeZone: string | undefined): string {
  const tag = locale === "ar" ? "ar-u-nu-latn" : (locale ?? "en");
  try {
    return new Intl.DateTimeFormat(tag, {
      weekday: "long",
      day: "numeric",
      month: "long",
      ...(timeZone ? { timeZone } : {}),
    }).format(new Date());
  } catch {
    return "";
  }
}

/**
 * Everything Today needs for one signed-in learner, in one go. The lists and the learner's progress
 * are what Home already loaded (passed in, never fetched twice); what is added is the review count,
 * the learner's session days and their finished Word Lists words — each quiet on failure, so a
 * missing table or a slow read leaves that part empty instead of breaking Home.
 */
export async function loadToday(args: {
  userId: string;
  locale: SupportLocale | null;
  timeZone: string | undefined;
  units: LessonUnit[];
  storiesUnits: LessonUnit[];
  lessonStats: Record<string, LessonCounts>;
  progress: ProgressState | undefined;
  isPremium: boolean;
  floor: boolean;
  weakWordCount?: Promise<number>;
}): Promise<TodayData> {
  const { userId, locale, timeZone, units, storiesUnits, lessonStats, progress } = args;
  const todayISO = localISODateInTimeZone(timeZone) ?? todayLocalISODate();
  const weekStart = weekStartFor(locale ?? "en");
  const thisWeek = weekDates(todayISO, weekStart);
  const completions = progress?.completions ?? [];
  const startingLevel = progress?.startingLevel ?? null;

  const [dueReview, sessionDates, wordIds] = await Promise.all([
    quiet("review count", () => countTodayReviewCandidates(userId, args.weakWordCount), 0),
    quiet("session dates", () => fetchSessionDatesSince(userId, thisWeek[0]!), [] as string[]),
    quiet("word progress", () => fetchWordProgress(userId), [] as string[]),
  ]);

  const dayOf = (iso: string) =>
    localISODateInTimeZone(timeZone, new Date(iso)) ?? iso.slice(0, 10);
  const activeDays = new Set<string>(sessionDates);
  for (const entry of completions) activeDays.add(dayOf(entry.completedAt));

  const lastActive =
    [...activeDays]
      .filter((day) => day <= todayISO)
      .sort()
      .pop() ?? null;
  const daysAway = lastActive ? daysBetween(lastActive, todayISO) : null;

  const pick = pickNewItems({
    units,
    storiesUnits,
    completions,
    startingLevel,
    isPremium: args.isPremium,
    floor: args.floor,
  });
  const plans = planAllLengths({
    dueReview,
    hasNew: pick.next !== null,
    hasHistory: completions.length > 0,
    daysAway,
  });

  const sevenDaysAgo = Date.now() - 7 * 86_400_000;
  let sentences = 0;
  let sentencesThisWeek = 0;
  for (const entry of completions) {
    const typed = lessonStats[`${entry.mode}:${entry.lessonId}`]?.sentences ?? 0;
    sentences += typed;
    if (Date.parse(entry.completedAt) >= sevenDaysAgo) sentencesThisWeek += typed;
  }

  const dots = weekDots(activeDays, todayISO, weekStart, (iso) =>
    weekdayInitial(iso, locale ?? "en"),
  );

  let freeContent: TodayData["freeContent"] = null;
  if (!args.isPremium) {
    const free = [...units, ...storiesUnits].filter((unit) => unit.isFree);
    const freeIds = new Set(free.map((unit) => `${unit.mode}:${unit.id}`));
    freeContent = {
      done: new Set(
        completions
          .map((entry) => `${entry.mode}:${entry.lessonId}`)
          .filter((id) => freeIds.has(id)),
      ).size,
      total: free.length,
    };
  }

  return {
    plans,
    defaultLength: defaultLengthFor(plans[7].variant),
    next: pick.next,
    upcoming: pick.upcoming,
    locked: pick.locked,
    doneToday: activeDays.has(todayISO) && sessionDates.includes(todayISO),
    week: { dots, done: dots.filter((dot) => dot.on).length, target: WEEK_TARGET_DAYS },
    stats: {
      sentences,
      sentencesThisWeek,
      lessons: new Set(completions.map((entry) => `${entry.mode}:${entry.lessonId}`)).size,
      words: wordIds.length,
    },
    levelCode: cefrForLevel(pick.next?.level ?? startingLevel ?? 1),
    freeContent,
    dateLabel: formatDate(locale, timeZone),
  };
}

/**
 * Just the lesson or story Today opens after the review (the review page and the finish page need
 * only this, not the whole card). Reads the lists and the learner's progress fresh. Null when
 * nothing this learner can open is left, or anything fails.
 */
export async function loadTodayNextItem(args: {
  locale: SupportLocale | null;
  isPremium: boolean;
  floor: boolean;
}): Promise<{ item: TodayItem | null; locked: TodayItem | null }> {
  try {
    const [units, storiesUnits, progress] = await Promise.all([
      getLessonSummaries("normal", args.locale ?? undefined),
      getLessonSummaries("stories", args.locale ?? undefined),
      fetchProgressCached(todayLocalISODate()),
    ]);
    const pick = pickNewItems({
      units,
      storiesUnits,
      completions: progress?.completions ?? [],
      startingLevel: progress?.startingLevel ?? null,
      isPremium: args.isPremium,
      floor: args.floor,
    });
    return { item: pick.next, locked: pick.locked };
  } catch (error) {
    console.error("[today] loadTodayNextItem failed", error);
    return { item: null, locked: null };
  }
}
