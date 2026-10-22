import { getLessonSummaries } from "@/lib/content";
import { localISODateInTimeZone } from "@/lib/features/learner-date";
import { cefrForLevel, pickNextWordBlock } from "@/lib/home-plan/plan";
import type { SupportLocale } from "@/lib/i18n/locales";
import { fetchPassageProgress, fetchPassageSummaries } from "@/lib/passages/queries";
import type { PassageProgress, PassageSummary } from "@/lib/passages/types";
import { fetchProgressCached } from "@/lib/progress/cached";
import { todayLocalISODate } from "@/lib/progress/streak";
import type { ProgressState } from "@/lib/progress/types";
import { WEEK_TARGET_DAYS } from "@/lib/session-end/summary";
import { fetchLessonSentenceStats } from "@/lib/supabase/queries/content";
import { fetchWordProgress } from "@/lib/supabase/queries/word-progress";
import { fetchDueVocabularyRecallCount } from "@/lib/supabase/queries/vocabulary-recall";
import { getWordGroupSummaries } from "@/lib/word-lists";
import type { LessonUnit } from "@/types/content";

import { pickPassage, pickStory } from "./next";
import { WORDS_MINUTES, estimateStoryMinutes, medianWpm, planToday } from "./plan";
import type { StepKind, StepPlan } from "./plan";
import { fetchRecentWpm, fetchSessionDatesSince } from "./queries";
import { weekDates, weekDots, weekStartFor, weekdayInitial } from "./week";
import type { WeekDot } from "./week";

export interface TodayStepData extends StepPlan {
  /** English title of the passage or story ("" for the words step). */
  title: string;
  /** The same title in the learner's language, when there is one. */
  supportTitle: string | null;
  /** The passage's level (A1…B2) or the story's CEFR code. */
  levelCode: string | null;
  /** Where Start goes: the next passage or story, or the words page. */
  href: string;
  /** Where "do it again" goes for a step finished today (the passage or story it was), or null. */
  redoHref: string | null;
}

export interface TodayData {
  steps: TodayStepData[];
  current: StepKind | null;
  remainingMinutes: number;
  totalMinutes: number;
  /** Every step that exists is done (or the finish screen was reached today). */
  allDone: boolean;
  week: { dots: WeekDot[]; done: number; target: number };
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

/** What is open to this learner for each step, read once (the passage lists are share-cached, the rest are the learner's own rows). */
async function readPicks(args: {
  userId: string;
  locale: SupportLocale | null;
  isPremium: boolean;
  startingLevel: number | null;
  passagesEnabled: boolean;
  storiesUnits: LessonUnit[];
  completedStoryIds: string[];
  weakWordCount?: Promise<number>;
}) {
  const { userId, locale, startingLevel } = args;
  const [summaries, passageProgress, groups, wordIds, dueRecall, weakCount] = await Promise.all([
    args.passagesEnabled
      ? quiet("passages", () => fetchPassageSummaries(), [] as PassageSummary[])
      : ([] as PassageSummary[]),
    args.passagesEnabled
      ? quiet("passage progress", () => fetchPassageProgress(userId), [] as PassageProgress[])
      : ([] as PassageProgress[]),
    quiet("word groups", () => getWordGroupSummaries(locale ?? undefined), []),
    quiet("word progress", () => fetchWordProgress(userId), [] as string[]),
    quiet("due recall", () => fetchDueVocabularyRecallCount(userId), 0),
    args.weakWordCount ?? 0,
  ]);

  const passage = pickPassage(
    summaries,
    new Map(passageProgress.map((entry) => [entry.passageId, entry])),
    args.isPremium,
    startingLevel,
  );
  const story = pickStory(args.storiesUnits, args.completedStoryIds, args.isPremium, startingLevel);
  const block = pickNextWordBlock(groups, new Set(wordIds), {
    isPremiumUser: args.isPremium,
    startingLevel,
    floor: true,
  });
  return {
    summaries,
    passageProgress,
    passage,
    story,
    /** There is something for the words step: new words to learn, or review words due. */
    wordsAvailable: block !== null || dueRecall > 0 || weakCount > 0,
  };
}

/**
 * Everything Today needs for one signed-in learner. Each read is quiet on failure (a missing table
 * or a slow read leaves that part empty instead of breaking Home). The learner's finished lessons
 * come from the progress Home already loads; what is added is the passage list and progress, the
 * word groups and the learner's finished words, how many review words are due, their typing speed
 * (for an honest time estimate) and the days they finished a session.
 */
export async function loadToday(args: {
  userId: string;
  locale: SupportLocale | null;
  timeZone: string | undefined;
  progress: ProgressState | undefined;
  isPremium: boolean;
  passagesEnabled: boolean;
  weakWordCount?: Promise<number>;
}): Promise<TodayData> {
  const { userId, locale, timeZone, progress } = args;
  const todayISO = localISODateInTimeZone(timeZone) ?? todayLocalISODate();
  const weekStart = weekStartFor(locale ?? "en");
  const thisWeek = weekDates(todayISO, weekStart);
  const completions = progress?.completions ?? [];
  const storyCompletions = completions.filter((entry) => entry.mode === "stories");
  const dayOf = (iso: string) =>
    localISODateInTimeZone(timeZone, new Date(iso)) ?? iso.slice(0, 10);

  const [storiesUnits, sessionDates, wpmValues] = await Promise.all([
    quiet("stories", () => getLessonSummaries("stories", locale ?? undefined), [] as LessonUnit[]),
    quiet("session dates", () => fetchSessionDatesSince(userId, thisWeek[0]!), [] as string[]),
    quiet("typing speed", () => fetchRecentWpm(userId), [] as (number | null)[]),
  ]);
  const picks = await readPicks({
    userId,
    locale,
    isPremium: args.isPremium,
    startingLevel: progress?.startingLevel ?? null,
    passagesEnabled: args.passagesEnabled,
    storiesUnits,
    completedStoryIds: storyCompletions.map((entry) => entry.lessonId),
    weakWordCount: args.weakWordCount,
  });

  // What was finished today (the latest of each), which is what "do it again" points at.
  const listenToday = picks.passageProgress
    .filter((entry) => entry.completedAt && dayOf(entry.completedAt) === todayISO)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0];
  const storyToday = storyCompletions
    .filter((entry) => dayOf(entry.completedAt) === todayISO)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
  const listenDoneSummary = picks.summaries.find((entry) => entry.id === listenToday?.passageId);
  const storyDoneUnit = storiesUnits.find((entry) => entry.id === storyToday?.lessonId);
  const sessionDone = sessionDates.includes(todayISO);

  const storyShown = storyToday && storyDoneUnit ? storyDoneUnit : picks.story;
  const stats = storyShown
    ? await quiet(
        "story stats",
        () => fetchLessonSentenceStats([storyShown.id]),
        new Map<string, { sentences: number; words: number }>(),
      )
    : new Map<string, { sentences: number; words: number }>();
  const storyCounts = storyShown ? stats.get(storyShown.id) : undefined;
  const storyMinutes = storyShown
    ? estimateStoryMinutes({
        words: storyCounts?.words ?? 64,
        sentences: storyCounts?.sentences ?? 8,
        wpm: medianWpm(wpmValues),
      })
    : 0;

  const listenShown = listenToday && listenDoneSummary ? listenDoneSummary : picks.passage;
  const plan = planToday(
    {
      listen: {
        available: picks.passage !== null,
        done: listenToday !== undefined,
        minutes: listenShown?.estimatedMinutes ?? 0,
      },
      story: {
        available: picks.story !== null,
        done: storyToday !== undefined,
        minutes: storyMinutes,
      },
      words: { available: picks.wordsAvailable, done: false, minutes: WORDS_MINUTES },
    },
    sessionDone,
  );

  const supportOf = (arabic: string | undefined) => (locale === "ar" && arabic ? arabic : null);
  const detail: Record<StepKind, Omit<TodayStepData, keyof StepPlan>> = {
    listen: {
      title: listenShown?.title ?? "",
      supportTitle: supportOf(listenShown?.titleAr),
      levelCode: listenShown?.level ?? null,
      href: picks.passage ? `/learn/passages/${picks.passage.id}?today=1` : "/learn/passages",
      redoHref: listenDoneSummary ? `/learn/passages/${listenDoneSummary.id}` : null,
    },
    story: {
      title: storyShown?.title ?? "",
      supportTitle: storyShown?.supportTitle ?? null,
      levelCode: storyShown ? cefrForLevel(storyShown.level) : null,
      href: picks.story ? `/learn/stories/${picks.story.id}?today=1` : "/learn/stories",
      redoHref: storyDoneUnit ? `/learn/stories/${storyDoneUnit.id}` : null,
    },
    words: {
      title: "",
      supportTitle: null,
      levelCode: null,
      href: "/learn/today/words",
      redoHref: "/learn/today/words",
    },
  };

  const activeDays = new Set<string>(sessionDates);
  for (const entry of completions) activeDays.add(dayOf(entry.completedAt));
  for (const entry of picks.passageProgress) {
    if (entry.completedAt) activeDays.add(dayOf(entry.completedAt));
  }
  const dots = weekDots(activeDays, todayISO, weekStart, (iso) =>
    weekdayInitial(iso, locale ?? "en"),
  );

  return {
    steps: plan.steps.map((step) => ({ ...step, ...detail[step.kind] })),
    current: plan.current,
    remainingMinutes: plan.remainingMinutes,
    totalMinutes: plan.totalMinutes,
    allDone: plan.allDone,
    week: { dots, done: dots.filter((dot) => dot.on).length, target: WEEK_TARGET_DAYS },
    dateLabel: formatDate(locale, timeZone),
  };
}

/**
 * Where Today goes next, for the "continue" links and the finish screen: the passage and story that
 * would be opened now, whether the words step has anything to do, and the title tomorrow starts
 * with. Reads the learner's own progress fresh; null fields mean nothing is open for that step.
 */
export async function loadTodayNext(args: {
  userId: string;
  locale: SupportLocale | null;
  isPremium: boolean;
  passagesEnabled: boolean;
}): Promise<{
  passageId: string | null;
  storyId: string | null;
  wordsAvailable: boolean;
  nextTitle: string | null;
}> {
  const empty = { passageId: null, storyId: null, wordsAvailable: false, nextTitle: null };
  try {
    const [storiesUnits, progress] = await Promise.all([
      getLessonSummaries("stories", args.locale ?? undefined),
      fetchProgressCached(todayLocalISODate()),
    ]);
    const picks = await readPicks({
      userId: args.userId,
      locale: args.locale,
      isPremium: args.isPremium,
      startingLevel: progress?.startingLevel ?? null,
      passagesEnabled: args.passagesEnabled,
      storiesUnits,
      completedStoryIds: (progress?.completions ?? [])
        .filter((entry) => entry.mode === "stories")
        .map((entry) => entry.lessonId),
    });
    return {
      passageId: picks.passage?.id ?? null,
      storyId: picks.story?.id ?? null,
      wordsAvailable: picks.wordsAvailable,
      nextTitle: picks.passage?.title ?? picks.story?.title ?? null,
    };
  } catch (error) {
    console.error("[today] loadTodayNext failed", error);
    return empty;
  }
}

/**
 * How many days of the learner's calendar week (today included) had a finished lesson, passage or
 * session — the finish screen's "N of 4 this week". Today always counts: the learner is finishing
 * a session right now.
 */
export async function loadTodayWeekDays(args: {
  userId: string;
  locale: SupportLocale | null;
  timeZone: string | undefined;
  completions: readonly { completedAt: string }[];
}): Promise<number> {
  const todayISO = localISODateInTimeZone(args.timeZone) ?? todayLocalISODate();
  const dates = weekDates(todayISO, weekStartFor(args.locale ?? "en"));
  const dayOf = (iso: string) =>
    localISODateInTimeZone(args.timeZone, new Date(iso)) ?? iso.slice(0, 10);
  const [sessionDates, passageProgress] = await Promise.all([
    quiet("session dates", () => fetchSessionDatesSince(args.userId, dates[0]!), [] as string[]),
    quiet("passage progress", () => fetchPassageProgress(args.userId), [] as PassageProgress[]),
  ]);
  const days = new Set<string>([todayISO, ...sessionDates]);
  for (const entry of args.completions) days.add(dayOf(entry.completedAt));
  for (const entry of passageProgress) {
    if (entry.completedAt) days.add(dayOf(entry.completedAt));
  }
  return dates.filter((date) => date <= todayISO && days.has(date)).length;
}
