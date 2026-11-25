import { getDraftLessonSummaries } from "@/lib/content";
import { localISODateInTimeZone } from "@/lib/features/learner-date";
import type { DailyQuest, DailyQuestsPayload } from "@/lib/features/quests";
import { cefrForLevel } from "@/lib/home-plan/plan";
import { GERMAN_ID_PREFIX } from "@/lib/learn-language";
import type { SupportLocale } from "@/lib/i18n/locales";
import { openablePassages } from "@/lib/passages/access";
import { homeCardPick } from "@/lib/passages/progress";
import { fetchGermanPassageSummaries, fetchPassageProgress } from "@/lib/passages/queries";
import type { PassageProgress, PassageSummary } from "@/lib/passages/types";
import type { ProgressState } from "@/lib/progress/types";
import { fetchLessonSentenceStats } from "@/lib/supabase/queries/content";
import { fetchWordProgressDated } from "@/lib/supabase/queries/word-progress";
import { getDraftWordGroupSummaries } from "@/lib/word-lists";
import type { LessonUnit } from "@/types/content";
import type { WordGroupSummary } from "@/types/word-lists";

import { WORDS_MINUTES, WORDS_PER_ROUND, estimateStoryMinutes, medianWpm } from "./plan";
import { TODAY_QUEST_SLOT_BASE, TODAY_QUEST_TYPE } from "./quests";

/**
 * Today's three tasks for a learner of German (permission germanTrack, Admins only for now), drawn
 * exactly like the English ones: listen to a passage, type a story, type five words. English keeps
 * them as rows in the learner's daily quests; the German track has no such rows, so the same three
 * tasks are worked out here from the German progress alone (nothing is written, no XP is paid, and
 * the links are the plain ones, without the "today" flag that belongs to the English session). A task
 * is done when its lesson was finished today; the words task, when five German words were typed for
 * the first time today.
 */

export interface GermanTodayInput {
  todayISO: string;
  dayOf: (iso: string) => string;
  /** The German stories, any order. */
  stories: readonly LessonUnit[];
  /** The German passages, and the learner's progress in all passages. */
  passages: readonly PassageSummary[];
  passageProgress: readonly PassageProgress[];
  groups: readonly WordGroupSummary[];
  /** Finished lessons (every language; only German ids are looked at). */
  completions: readonly { lessonId: string; mode: string; completedAt: string; accuracy: number }[];
  /** Words the learner first typed, with the moment (every language; only German ids are looked at). */
  words: readonly { wordId: string; firstAt: string }[];
  /** Words and sentences of the story shown, for its time. */
  storyCounts: ReadonlyMap<string, { sentences: number; words: number }>;
  wpm: number;
  locale: SupportLocale | null;
}

const byLevelThenOrder = (a: LessonUnit, b: LessonUnit) => a.level - b.level || a.order - b.order;

export function buildGermanToday(input: GermanTodayInput): DailyQuestsPayload | null {
  const { todayISO, dayOf } = input;
  const germanDone = input.completions.filter(
    (entry) => entry.mode === "stories" && entry.lessonId.startsWith(GERMAN_ID_PREFIX),
  );
  const doneIds = new Set(germanDone.map((entry) => entry.lessonId));
  const storiesSorted = [...input.stories].sort(byLevelThenOrder);
  const storyToday = germanDone
    .filter((entry) => dayOf(entry.completedAt) === todayISO)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
  const storyDoneUnit = storiesSorted.find((unit) => unit.id === storyToday?.lessonId);
  const storyNext = storiesSorted.find((unit) => !doneIds.has(unit.id));
  const story = storyDoneUnit ?? storyNext;

  const passagesOpen = openablePassages([...input.passages], true);
  const listenToday = input.passageProgress
    .filter((entry) => entry.completedAt && dayOf(entry.completedAt) === todayISO)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0];
  const passageDoneSummary = passagesOpen.find((entry) => entry.id === listenToday?.passageId);
  const passageNext =
    homeCardPick(passagesOpen, new Map(input.passageProgress.map((p) => [p.passageId, p])))
      ?.passage ?? null;
  const passage = passageDoneSummary ?? passageNext;

  const germanWords = input.words.filter((entry) => entry.wordId.startsWith(GERMAN_ID_PREFIX));
  const typedIds = new Set(germanWords.map((entry) => entry.wordId));
  const newToday = germanWords.filter((entry) => dayOf(entry.firstAt) === todayISO).length;
  const groupsSorted = [...input.groups].sort((a, b) => a.level - b.level || a.order - b.order);
  const group =
    groupsSorted.find((g) => g.wordIds.some((id) => !typedIds.has(id))) ?? groupsSorted[0];

  const arabic = input.locale === "ar";
  const quests: DailyQuest[] = [];
  const row = (
    kind: "listen" | "story" | "words",
    done: boolean,
    today: DailyQuest["today"],
  ): DailyQuest => ({
    slot: TODAY_QUEST_SLOT_BASE + ["listen", "story", "words"].indexOf(kind),
    type: TODAY_QUEST_TYPE[kind],
    target: 1,
    progress: done ? 1 : 0,
    xp: 0,
    completed: done,
    today,
  });

  if (passage) {
    quests.push(
      row("listen", listenToday !== undefined, {
        kind: "listen",
        title: passage.title,
        supportTitle: arabic ? passage.titleAr || null : null,
        levelCode: passage.level,
        minutes: passage.estimatedMinutes,
        href: `/learn/passages/${(passageNext ?? passage).id}`,
        redoHref: passageDoneSummary ? `/learn/passages/${passageDoneSummary.id}` : null,
        accuracy: null,
        paid: false,
        poster: { tone: passage.tone, order: passage.order, posterUrl: passage.posterUrl },
      }),
    );
  }
  if (story) {
    const counts = input.storyCounts.get(story.id);
    quests.push(
      row("story", storyToday !== undefined, {
        kind: "story",
        title: story.title,
        supportTitle: story.supportTitle ?? null,
        levelCode: cefrForLevel(story.level),
        minutes: estimateStoryMinutes({
          words: counts?.words ?? 64,
          sentences: counts?.sentences ?? 8,
          wpm: input.wpm,
        }),
        href: `/learn/stories/${(storyNext ?? story).id}`,
        redoHref: storyDoneUnit ? `/learn/stories/${storyDoneUnit.id}` : null,
        accuracy: storyToday?.accuracy ?? null,
        paid: false,
      }),
    );
  }
  if (group && (passage || story)) {
    quests.push(
      row("words", newToday >= WORDS_PER_ROUND, {
        kind: "words",
        title: group.title,
        supportTitle: null,
        levelCode: null,
        minutes: WORDS_MINUTES,
        href: `/learn/word-lists/${group.id}`,
        redoHref: `/learn/word-lists/${group.id}`,
        accuracy: null,
        paid: false,
      }),
    );
  }
  if (quests.length === 0) return null;
  return { quests, allDone: quests.every((quest) => quest.completed) };
}

async function quiet<T>(label: string, read: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await read();
  } catch (error) {
    console.error(`[german-today] ${label} failed`, error);
    return fallback;
  }
}

/** Reads the German track's content and the learner's progress and builds today's three tasks (null when the track has nothing to do). */
export async function loadGermanToday(args: {
  userId: string;
  locale: SupportLocale | null;
  timeZone: string | undefined;
  todayISO: string;
  progress: ProgressState | undefined;
}): Promise<DailyQuestsPayload | null> {
  const { userId, locale, timeZone } = args;
  const [stories, passages, passageProgress, groups, words] = await Promise.all([
    quiet(
      "stories",
      () => getDraftLessonSummaries("stories", locale ?? undefined, "de"),
      [] as LessonUnit[],
    ),
    quiet("passages", () => fetchGermanPassageSummaries(), [] as PassageSummary[]),
    quiet("passage progress", () => fetchPassageProgress(userId), [] as PassageProgress[]),
    quiet(
      "word lists",
      () => getDraftWordGroupSummaries(locale ?? undefined, "de"),
      [] as WordGroupSummary[],
    ),
    quiet(
      "words",
      () => fetchWordProgressDated(userId),
      [] as { wordId: string; firstAt: string }[],
    ),
  ]);
  const completions = args.progress?.completions ?? [];
  const doneIds = new Set(completions.map((entry) => entry.lessonId));
  const shown = [...stories].sort(byLevelThenOrder).find((unit) => !doneIds.has(unit.id));
  const storyCounts = shown
    ? await quiet(
        "story stats",
        () => fetchLessonSentenceStats([shown.id]),
        new Map<string, { sentences: number; words: number }>(),
      )
    : new Map<string, { sentences: number; words: number }>();
  return buildGermanToday({
    todayISO: args.todayISO,
    dayOf: (iso) => localISODateInTimeZone(timeZone, new Date(iso)) ?? iso.slice(0, 10),
    stories,
    passages,
    passageProgress,
    groups,
    completions,
    words,
    storyCounts,
    wpm: medianWpm([]),
    locale,
  });
}
