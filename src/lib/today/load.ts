import { cookies } from "next/headers";

import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { getLessonSummaries } from "@/lib/content";
import type { EffectiveFeatures } from "@/lib/features/config";
import { TIMEZONE_COOKIE, localISODateInTimeZone } from "@/lib/features/learner-date";
import type { DailyQuest, TodayQuestInfo } from "@/lib/features/quests";
import { cefrForLevel, pickNextWordBlock } from "@/lib/home-plan/plan";
import { getLocale } from "@/lib/i18n/get-locale";
import type { SupportLocale } from "@/lib/i18n/locales";
import { fetchPassageProgress, fetchPassageSummaries } from "@/lib/passages/queries";
import type { PassageProgress, PassageSummary } from "@/lib/passages/types";
import { fetchProgressCached } from "@/lib/progress/cached";
import { SENTENCE_REVIEW_HREF, SENTENCE_REVIEW_MINUTES } from "@/lib/sentence-bank/review";
import { dealSentenceQuest } from "@/lib/sentence-bank/quest";
import { todayLocalISODate } from "@/lib/progress/streak";
import type { ProgressState } from "@/lib/progress/types";
import { fetchLessonSentenceStats } from "@/lib/supabase/queries/content";
import { fetchWordProgress } from "@/lib/supabase/queries/word-progress";
import { fetchDueVocabularyRecallCount } from "@/lib/supabase/queries/vocabulary-recall";
import { getWordGroupSummaries } from "@/lib/word-lists";
import type { LessonUnit } from "@/types/content";

import { pickPassage, pickStory } from "./next";
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
}

async function quiet<T>(label: string, read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    console.error(`[today] ${label} failed`, error);
    return fallback;
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

export interface TodayStepsData {
  steps: TodayStepData[];
  current: StepKind | null;
  allDone: boolean;
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
  const picks = await readPicks({
    userId,
    locale,
    isPremium: args.isPremium,
    startingLevel: progress?.startingLevel ?? null,
    passagesEnabled: args.passagesEnabled,
    storiesUnits,
    completedStoryIds: storyCompletions.map((entry) => entry.lessonId),
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
        done: listenToday !== undefined || questOf.listen?.completed === true,
        minutes: listenShown?.estimatedMinutes ?? 0,
      },
      story: {
        available: picks.story !== null,
        done: storyToday !== undefined || questOf.story?.completed === true,
        minutes: storyMinutes,
      },
      words: {
        available: picks.wordsAvailable,
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
    },
    story: {
      title: storyShown?.title ?? "",
      supportTitle: storyShown?.supportTitle ?? null,
      levelCode: storyShown ? cefrForLevel(storyShown.level) : null,
      href: picks.story ? `/learn/stories/${picks.story.id}?today=1` : "/learn/stories",
      redoHref: storyDoneUnit ? `/learn/stories/${storyDoneUnit.id}` : null,
      accuracy: storyToday?.accuracy ?? null,
    },
    words: {
      title: "",
      supportTitle: null,
      levelCode: null,
      href: "/learn/today/words",
      redoHref: "/learn/today/words",
      accuracy: null,
    },
  };

  return {
    steps: plan.steps.map((step) => ({ ...step, ...detail[step.kind] })),
    current: plan.current,
    allDone: plan.allDone,
  };
}

/**
 * Ties the day's Today quests (the rows in slots 10-12, see quests.ts) to the specific passage,
 * story and words they send the learner to, for Home's quests box. A quest whose lesson the learner
 * already finished today counts as done (even when it was dealt after the lesson, so its XP was not
 * paid — `paid` says which), and a quest with nothing open to this learner (no passage left, say) is
 * left out so the ring only counts what can be done. Null when the day has no Today quests; the
 * quests unchanged (without the tie) when anything fails.
 */
export async function enrichTodayQuests(args: {
  userId: string;
  todayISO: string;
  features: EffectiveFeatures;
  quests: readonly DailyQuest[];
}): Promise<DailyQuest[] | null> {
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
    // Today's optional fourth row, "remember N sentences", is dealt beside the steps' own reads (it
    // reads nothing once the row exists, and never throws).
    const [data, sentenceRow] = await Promise.all([
      loadTodaySteps({
        userId: args.userId,
        locale,
        timeZone,
        todayISO: args.todayISO,
        progress,
        isPremium: premium || admin,
        passagesEnabled: args.features.passages.enabled,
        quests: todayRows,
      }),
      args.features.rollouts.sentenceBank
        ? dealSentenceQuest({
            context: {
              userId: args.userId,
              todayISO: args.todayISO,
              timeZone,
              completions: progress?.completions ?? [],
            },
            features: args.features,
            existing: todayRows,
          })
        : Promise.resolve(null),
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
    return enriched.length > 0 ? enriched : null;
  } catch (error) {
    console.error("[today] enrichTodayQuests failed", error);
    return [...todayRows];
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
