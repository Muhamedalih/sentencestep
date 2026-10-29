import { cookies } from "next/headers";

import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getLessonSummaries } from "@/lib/content";
import type { EffectiveFeatures } from "@/lib/features/config";
import { TIMEZONE_COOKIE, localISODateInTimeZone } from "@/lib/features/learner-date";
import type { DailyQuest, TodayPoster, TodayQuestInfo } from "@/lib/features/quests";
import { cefrForLevel } from "@/lib/home-plan/plan";
import { LEARNER_VIEW_COOKIE } from "@/lib/hybrid/learner-view";
import { todayPicks } from "@/lib/hybrid/picks";
import { getLocale } from "@/lib/i18n/get-locale";
import type { SupportLocale } from "@/lib/i18n/locales";
import { fetchPassageProgress, fetchPassageSummaries } from "@/lib/passages/queries";
import type { PassageProgress, PassageSummary } from "@/lib/passages/types";
import { fetchProgressCached } from "@/lib/progress/cached";
import { SENTENCE_REVIEW_HREF, SENTENCE_REVIEW_MINUTES } from "@/lib/sentence-bank/review";
import { dealSentenceQuest } from "@/lib/sentence-bank/quest";
import { loadWeeklyLine } from "@/lib/sentence-bank/weekly-load";
import type { WeeklyLine } from "@/lib/sentence-bank/weekly";
import { todayLocalISODate } from "@/lib/progress/streak";
import type { ProgressState } from "@/lib/progress/types";
import { fetchLessonSentenceStats } from "@/lib/supabase/queries/content";
import type { LessonUnit } from "@/types/content";

import { finishedStoryOrPassageToday, todayEndInfo } from "./end-state";
import type { TodayEndInfo } from "./end-state";
import { WORDS_MINUTES, estimateStoryMinutes, medianWpm, planToday } from "./plan";
import type { StepKind, StepPlan } from "./plan";
import { fetchRecentWpm, fetchSessionDatesSince } from "./queries";
import { TODAY_QUEST_SLOT_BASE, questsByStep } from "./quests";
import { weekDates, weekStartFor } from "./week";

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
  /** The story's typing accuracy (0-1) when it was finished today, else null. */
  accuracy: number | null;
  /** The listening step's passage, as its poster is drawn; null for the other steps and when there is no passage. */
  poster: TodayPoster | null;
}

async function quiet<T>(label: string, read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    console.error(`[today] ${label} failed`, error);
    return fallback;
  }
}

/**
 * The passage and the story open to this learner next (the passage lists are share-cached, the rest
 * are the learner's own rows). Once a free learner's free ones are finished, each step opens its
 * taste of the day instead (see hybrid/picks.ts), when the hybrid offers are open to them.
 */
async function readLessonPicks(args: {
  userId: string;
  todayISO: string;
  isPremium: boolean;
  hybridOffers: boolean;
  startingLevel: number | null;
  passagesEnabled: boolean;
  storiesUnits: LessonUnit[];
  completedStoryIds: string[];
}) {
  const { userId, startingLevel } = args;
  const [summaries, passageProgress] = await Promise.all([
    args.passagesEnabled
      ? quiet("passages", () => fetchPassageSummaries(), [] as PassageSummary[])
      : ([] as PassageSummary[]),
    args.passagesEnabled
      ? quiet("passage progress", () => fetchPassageProgress(userId), [] as PassageProgress[])
      : ([] as PassageProgress[]),
  ]);

  const picks = todayPicks({
    userId,
    todayISO: args.todayISO,
    isPremium: args.isPremium,
    taste: args.hybridOffers,
    startingLevel,
    passages: { summaries, progress: passageProgress },
    storiesUnits: args.storiesUnits,
    completedStoryIds: args.completedStoryIds,
  });
  return {
    summaries,
    passageProgress,
    passage: picks.passage,
    story: picks.story,
    tasteToday: picks.passageIsTaste || picks.storyIsTaste,
  };
}

/** The latest passage and the latest story the learner finished today (their own calendar day), or undefined for either. */
function finishedToday<Story extends { completedAt: string }>(args: {
  passageProgress: readonly PassageProgress[];
  storyCompletions: readonly Story[];
  todayISO: string;
  dayOf: (iso: string) => string;
}): { listen: PassageProgress | undefined; story: Story | undefined } {
  const { todayISO, dayOf } = args;
  const listen = args.passageProgress
    .filter((entry) => entry.completedAt && dayOf(entry.completedAt) === todayISO)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0];
  const story = args.storyCompletions
    .filter((entry) => dayOf(entry.completedAt) === todayISO)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
  return { listen, story };
}

export interface TodayStepsData {
  steps: TodayStepData[];
  current: StepKind | null;
  allDone: boolean;
  /** One of the day's steps is the taste of the day (a Premium item open for today, see hybrid/picks.ts). */
  tasteToday: boolean;
  /** Set when nothing is left to open (and nothing was finished today): Home says so instead of drawing tasks. */
  end: TodayEndInfo | null;
}

/**
 * Today's three steps for one signed-in learner: which passage, story and words are open to them,
 * what was already finished today, how long each takes and where each one goes. Each read is quiet
 * on failure (a missing table or a slow read leaves that part empty instead of breaking Home). The
 * learner's finished lessons come from the progress passed in; what is added is the passage list and
 * progress, the word groups and the learner's finished words, how many review words are due, their
 * typing speed (for an honest time estimate) and whether they reached the finish screen today. The
 * day's quests (already dealt) are merged in: a quest completed in the database counts as done.
 */
export async function loadTodaySteps(args: {
  userId: string;
  locale: SupportLocale | null;
  timeZone: string | undefined;
  todayISO: string;
  progress: ProgressState | undefined;
  isPremium: boolean;
  hybridOffers: boolean;
  passagesEnabled: boolean;
  quests: readonly DailyQuest[];
}): Promise<TodayStepsData> {
  const { userId, locale, timeZone, todayISO, progress } = args;
  const completions = progress?.completions ?? [];
  const storyCompletions = completions.filter((entry) => entry.mode === "stories");
  const dayOf = (iso: string) =>
    localISODateInTimeZone(timeZone, new Date(iso)) ?? iso.slice(0, 10);
  const questOf = questsByStep(args.quests);

  const [storiesUnits, sessionDates, wpmValues] = await Promise.all([
    quiet("stories", () => getLessonSummaries("stories", locale ?? undefined), [] as LessonUnit[]),
    quiet("session dates", () => fetchSessionDatesSince(userId, todayISO), [] as string[]),
    quiet("typing speed", () => fetchRecentWpm(userId), [] as (number | null)[]),
  ]);
  const picks = await readLessonPicks({
    userId,
    todayISO,
    isPremium: args.isPremium,
    hybridOffers: args.hybridOffers,
    startingLevel: progress?.startingLevel ?? null,
    passagesEnabled: args.passagesEnabled,
    storiesUnits,
    completedStoryIds: storyCompletions.map((entry) => entry.lessonId),
  });

  // What was finished today (the latest of each), which is what "do it again" points at.
  const { listen: listenToday, story: storyToday } = finishedToday({
    passageProgress: picks.passageProgress,
    storyCompletions,
    todayISO,
    dayOf,
  });
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
  // The words step asks the target words of the day's story and passage and nothing else (see
  // loadLinkedWords), so it exists exactly when the day has one of them: open next, or finished today.
  const hasLessonsToday = Boolean(listenShown || storyShown);
  const plan = planToday(
    {
      listen: {
        available: picks.passage !== null,
        done: listenToday !== undefined || questOf.listen?.completed === true,
        minutes: listenShown?.estimatedMinutes ?? 0,
      },
      story: {
        available: picks.story !== null,
        done: storyToday !== undefined || questOf.story?.completed === true,
        minutes: storyMinutes,
      },
      words: {
        available: hasLessonsToday,
        done: questOf.words?.completed === true,
        minutes: WORDS_MINUTES,
      },
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
      accuracy: null,
      poster: listenShown
        ? { tone: listenShown.tone, order: listenShown.order, posterUrl: listenShown.posterUrl }
        : null,
    },
    story: {
      title: storyShown?.title ?? "",
      supportTitle: storyShown?.supportTitle ?? null,
      levelCode: storyShown ? cefrForLevel(storyShown.level) : null,
      href: picks.story ? `/learn/stories/${picks.story.id}?today=1` : "/learn/stories",
      redoHref: storyDoneUnit ? `/learn/stories/${storyDoneUnit.id}` : null,
      accuracy: storyToday?.accuracy ?? null,
      poster: null,
    },
    words: {
      title: "",
      supportTitle: null,
      levelCode: null,
      href: "/learn/today/words",
      redoHref: "/learn/today/words",
      accuracy: null,
      poster: null,
    },
  };

  return {
    steps: plan.steps.map((step) => ({ ...step, ...detail[step.kind] })),
    current: plan.current,
    allDone: plan.allDone,
    tasteToday: picks.tasteToday,
    end: todayEndInfo({
      isPremium: args.isPremium,
      passagesEnabled: args.passagesEnabled,
      passages: picks.summaries,
      stories: storiesUnits,
      nextPassage: picks.passage,
      nextStory: picks.story,
      hasLessonsToday,
    }),
  };
}

/**
 * Ties the day's Today quests (the rows in slots 10-12, see quests.ts) to the specific passage,
 * story and words they send the learner to, for Home's quests box. A quest whose lesson the learner
 * already finished today counts as done (even when it was dealt after the lesson, so its XP was not
 * paid — `paid` says which), and a quest with nothing open to this learner (no passage left, say) is
 * left out so the ring only counts what can be done. Null when the day has no Today quests; the
 * quests unchanged (without the tie) when anything fails. When nothing is left to open at all (every
 * passage and story open to the learner is finished, none today), no quest is left and `end` says so.
 */
export async function enrichTodayQuests(args: {
  userId: string;
  todayISO: string;
  features: EffectiveFeatures;
  quests: readonly DailyQuest[];
}): Promise<{
  quests: DailyQuest[];
  weekly: WeeklyLine | null;
  end?: TodayEndInfo;
  /** One of the day's steps is the taste of the day (see TodayStepsData). */
  tasteToday?: boolean;
} | null> {
  const todayRows = args.quests.filter((quest) => quest.slot >= TODAY_QUEST_SLOT_BASE);
  if (todayRows.length === 0) return null;
  try {
    const [locale, premium, admin, progress, cookieStore] = await Promise.all([
      getLocale(),
      hasPremiumAccess(),
      isAdmin(),
      fetchProgressCached(args.todayISO),
      cookies(),
    ]);
    const timeZone = cookieStore.get(TIMEZONE_COOKIE)?.value;
    const learnerView = cookieStore.get(LEARNER_VIEW_COOKIE)?.value === "1";
    // Today's optional extra row, the day's exam, is dealt beside the steps' own reads (it
    // reads nothing once the row exists, and never throws).
    const bankContext = {
      userId: args.userId,
      todayISO: args.todayISO,
      timeZone,
      completions: progress?.completions ?? [],
    };
    const [data, sentenceRow, weekly] = await Promise.all([
      loadTodaySteps({
        userId: args.userId,
        locale,
        timeZone,
        todayISO: args.todayISO,
        progress,
        // An admin who asked to see the learner's view (learner-view.ts) gets the learner's Today.
        isPremium: premium || (admin && !learnerView),
        hybridOffers: args.features.rollouts.hybridOffers,
        passagesEnabled: args.features.passages.enabled,
        quests: todayRows,
      }),
      args.features.rollouts.sentenceBank
        ? dealSentenceQuest({
            context: bankContext,
            features: args.features,
            existing: todayRows,
          })
        : Promise.resolve(null),
      // And the one quiet line about the weekly check (one tiny read; never throws).
      args.features.rollouts.sentenceBank ? loadWeeklyLine(bankContext) : Promise.resolve(null),
    ]);
    const byStep = questsByStep(todayRows);
    const enriched: DailyQuest[] = [];
    for (const step of data.steps) {
      const quest = byStep[step.kind];
      if (!quest) continue;
      const info: TodayQuestInfo = {
        kind: step.kind,
        title: step.title,
        supportTitle: step.supportTitle,
        levelCode: step.levelCode,
        minutes: step.minutes,
        href: step.href,
        redoHref: step.redoHref,
        accuracy: step.accuracy,
        paid: quest.completed,
        poster: step.poster,
      };
      enriched.push({
        ...quest,
        completed: quest.completed || step.done,
        progress: step.done ? quest.target : quest.progress,
        today: info,
      });
    }
    // The sentence review closes the list (the box's last row), and is done only when its own quest is.
    if (sentenceRow) {
      enriched.push({
        ...sentenceRow,
        today: {
          kind: "sentences",
          title: "",
          supportTitle: null,
          levelCode: null,
          minutes: SENTENCE_REVIEW_MINUTES,
          href: SENTENCE_REVIEW_HREF,
          redoHref: null,
          accuracy: null,
          paid: sentenceRow.completed,
        },
      });
    }
    if (enriched.length > 0) return { quests: enriched, weekly, tasteToday: data.tasteToday };
    return data.end ? { quests: [], weekly, end: data.end, tasteToday: data.tasteToday } : null;
  } catch (error) {
    console.error("[today] enrichTodayQuests failed", error);
    return { quests: [...todayRows], weekly: null };
  }
}

/**
 * Where Today goes next, for the "continue" links and the finish screen: the passage and story that
 * would be opened now, whether the words step has anything to do, and the title tomorrow starts
 * with. Reads the learner's own progress fresh; null fields mean nothing is open for that step.
 */
export async function loadTodayNext(args: {
  userId: string;
  locale: SupportLocale | null;
  timeZone: string | undefined;
  isPremium: boolean;
  admin: boolean;
  hybridOffers: boolean;
  passagesEnabled: boolean;
}): Promise<{
  passageId: string | null;
  storyId: string | null;
  wordsAvailable: boolean;
  nextTitle: string | null;
}> {
  const empty = { passageId: null, storyId: null, wordsAvailable: false, nextTitle: null };
  try {
    const [storiesUnits, progress, cookieStore] = await Promise.all([
      getLessonSummaries("stories", args.locale ?? undefined),
      fetchProgressCached(todayLocalISODate()),
      cookies(),
    ]);
    const learnerView = cookieStore.get(LEARNER_VIEW_COOKIE)?.value === "1";
    const storyCompletions = (progress?.completions ?? []).filter(
      (entry) => entry.mode === "stories",
    );
    const todayISO = localISODateInTimeZone(args.timeZone) ?? todayLocalISODate();
    const picks = await readLessonPicks({
      userId: args.userId,
      todayISO,
      isPremium: args.isPremium || (args.admin && !learnerView),
      hybridOffers: args.hybridOffers,
      startingLevel: progress?.startingLevel ?? null,
      passagesEnabled: args.passagesEnabled,
      storiesUnits,
      completedStoryIds: storyCompletions.map((entry) => entry.lessonId),
    });
    // The words step asks the day's passage and story words: it is there while the day has one of
    // them — open next, or finished today (the last free story finished today still gets its words).
    const done = finishedToday({
      passageProgress: picks.passageProgress,
      storyCompletions,
      todayISO,
      dayOf: (iso) => localISODateInTimeZone(args.timeZone, new Date(iso)) ?? iso.slice(0, 10),
    });
    const hasLessonsToday = Boolean(
      picks.passage ||
      picks.story ||
      picks.summaries.some((entry) => entry.id === done.listen?.passageId) ||
      storiesUnits.some((entry) => entry.id === done.story?.lessonId),
    );
    return {
      passageId: picks.passage?.id ?? null,
      storyId: picks.story?.id ?? null,
      wordsAvailable: hasLessonsToday,
      nextTitle: picks.passage?.title ?? picks.story?.title ?? null,
    };
  } catch (error) {
    console.error("[today] loadTodayNext failed", error);
    return empty;
  }
}

/**
 * How many days of the learner's calendar week (today included) had a finished lesson, passage or
 * session — the finish screen's "N of 4 this week" — and whether a story or a passage was finished
 * today, which is what makes a visit to the finish screen a real one. Today always counts: the
 * learner is finishing a session right now.
 */
export async function loadTodayWeek(args: {
  userId: string;
  locale: SupportLocale | null;
  timeZone: string | undefined;
  completions: readonly { mode: string; completedAt: string }[];
}): Promise<{ days: number; workToday: boolean }> {
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
  return {
    days: dates.filter((date) => date <= todayISO && days.has(date)).length,
    workToday: finishedStoryOrPassageToday({
      completions: args.completions,
      passageProgress,
      todayISO,
      dayOf,
    }),
  };
}

/**
 * The story the learner finished today (the latest one), for "Redo today's lessons" — null when
 * they finished none today, or anything fails.
 */
export async function loadTodayStoryDone(args: {
  timeZone: string | undefined;
}): Promise<string | null> {
  try {
    const todayISO = localISODateInTimeZone(args.timeZone) ?? todayLocalISODate();
    const progress = await fetchProgressCached(todayLocalISODate());
    const latest = (progress?.completions ?? [])
      .filter(
        (entry) =>
          entry.mode === "stories" &&
          (localISODateInTimeZone(args.timeZone, new Date(entry.completedAt)) ??
            entry.completedAt.slice(0, 10)) === todayISO,
      )
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
    return latest?.lessonId ?? null;
  } catch (error) {
    console.error("[today] loadTodayStoryDone failed", error);
    return null;
  }
}

/**
 * The passage and the story that are "today's" for this learner — the same two Home's tasks box
 * shows: the latest of each finished today, else the one open next. Today's words step is made of
 * their target words, so it holds the day's own words whether or not the two are read yet. A part
 * with nothing open and nothing finished is null. Throws when a read fails (the caller decides).
 */
export async function loadTodayLessonIds(args: {
  userId: string;
  locale: SupportLocale | null;
  timeZone: string | undefined;
  isPremium: boolean;
  admin: boolean;
  hybridOffers: boolean;
  passagesEnabled: boolean;
}): Promise<{ passageId: string | null; storyId: string | null }> {
  const todayISO = localISODateInTimeZone(args.timeZone) ?? todayLocalISODate();
  const dayOf = (iso: string) =>
    localISODateInTimeZone(args.timeZone, new Date(iso)) ?? iso.slice(0, 10);
  const [storiesUnits, progress, cookieStore] = await Promise.all([
    getLessonSummaries("stories", args.locale ?? undefined),
    fetchProgressCached(todayLocalISODate()),
    cookies(),
  ]);
  const learnerView = cookieStore.get(LEARNER_VIEW_COOKIE)?.value === "1";
  const storyCompletions = (progress?.completions ?? []).filter(
    (entry) => entry.mode === "stories",
  );
  const picks = await readLessonPicks({
    userId: args.userId,
    todayISO,
    isPremium: args.isPremium || (args.admin && !learnerView),
    hybridOffers: args.hybridOffers,
    startingLevel: progress?.startingLevel ?? null,
    passagesEnabled: args.passagesEnabled,
    storiesUnits,
    completedStoryIds: storyCompletions.map((entry) => entry.lessonId),
  });
  const done = finishedToday({
    passageProgress: picks.passageProgress,
    storyCompletions,
    todayISO,
    dayOf,
  });
  // As in the tasks box, a lesson finished today counts while it is still in the lists.
  const passageDone = picks.summaries.find((entry) => entry.id === done.listen?.passageId);
  const storyDone = storiesUnits.find((entry) => entry.id === done.story?.lessonId);
  return {
    passageId: (passageDone ?? picks.passage)?.id ?? null,
    storyId: (storyDone ?? picks.story)?.id ?? null,
  };
}
