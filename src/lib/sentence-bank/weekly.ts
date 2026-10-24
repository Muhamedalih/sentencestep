import type { ReviewScreenItem } from "@/lib/sentence-bank/items";
import { MIN_REVIEW_WORDS, reviewWordCount, spreadAcrossLessons } from "@/lib/sentence-bank/select";
import type { SentenceCandidate } from "@/lib/sentence-bank/select";
import { addDaysISO } from "@/lib/word-mastery/schedule";

/**
 * Sentence bank: the weekly check. Once the learner has written enough in the Stories section, they
 * are asked twelve of those sentences, each from its meaning, with nothing in front of them and no
 * help, and are told ONE honest thing: how many they remembered. Only stories count (the daily
 * lessons are for writing, and one lesson alone is already twelve sentences, which would make a
 * single lesson a whole test). No level is claimed from it (the twelve are a sample of one week of
 * writing, not a measure of English), no number is shown for a check that asked fewer than five, and
 * the result is shown for the week after the check and not longer. Until the sentences are there the
 * check is shown locked, with how many are still missing. Pure — the loader reads the learner's last
 * check and their finished stories.
 */

/** Sentences a weekly check asks, at most; also how many story sentences open it. */
export const WEEKLY_CHECK_SIZE = 12;
/** Fewer than this is not a check, and a check that asked fewer shows no number. */
export const WEEKLY_CHECK_MIN = 5;
/** At most this many from one story, so the twelve are a spread over at least two stories. */
export const WEEKLY_MAX_PER_LESSON = 6;
/** A check is about the last seven days of writing, and comes at most once in seven days. */
export const WEEKLY_DAYS = 7;
/** About twenty-five seconds a sentence for twelve: what the card says it takes. */
export const WEEKLY_CHECK_MINUTES = 5;
/** Where the check lives. */
export const WEEKLY_CHECK_HREF = "/learn/today/check";

/** What the last weekly check found. */
export interface LastCheck {
  /** The learner-local day it was taken. */
  checkedOn: string;
  asked: number;
  remembered: number;
  /** Sentences the learner wrote in the week it was about. */
  written: number;
}

export type WeeklyLine =
  | { kind: "due"; size: number; minutes: number }
  | {
      /** Not enough written yet: `have` of the `need` story sentences, and whether tomorrow is enough. */
      kind: "locked";
      have: number;
      need: number;
      tomorrow: boolean;
    }
  | {
      kind: "result";
      written: number;
      asked: number;
      remembered: number;
      /** remembered over asked, rounded. */
      percent: number;
    };

/** Whole days from `fromISO` to `toISO` ("YYYY-MM-DD"), negative when `toISO` is earlier. */
export function daysBetweenISO(fromISO: string, toISO: string): number {
  return Math.round(
    (Date.parse(`${toISO}T00:00:00Z`) - Date.parse(`${fromISO}T00:00:00Z`)) / 86_400_000,
  );
}

/**
 * The one card Today's box shows about the weekly check, or nothing:
 *  - a week or more after the last check (or with none yet) it is ready when the learner has twelve
 *    story sentences from earlier days in the last week to be asked, and locked until they have;
 *  - locked, it says whether tomorrow will be enough (sentences written today are not asked today);
 *  - for the seven days after a check it shows its result, when the check asked at least five;
 *  - otherwise nothing.
 * `askable` is how many sentences a check could ask now (see weeklyReadiness) and `askableTomorrow`
 * how many it could ask tomorrow.
 */
export function weeklyLine(input: {
  last: LastCheck | null;
  todayISO: string;
  askable: number;
  askableTomorrow: number;
}): WeeklyLine | null {
  const { last, todayISO } = input;
  const since = last ? daysBetweenISO(last.checkedOn, todayISO) : null;
  if (since === null || since >= WEEKLY_DAYS) {
    if (input.askable >= WEEKLY_CHECK_SIZE) {
      return { kind: "due", size: WEEKLY_CHECK_SIZE, minutes: WEEKLY_CHECK_MINUTES };
    }
    return {
      kind: "locked",
      have: Math.min(Math.max(0, input.askable), WEEKLY_CHECK_SIZE),
      need: WEEKLY_CHECK_SIZE,
      tomorrow: input.askableTomorrow >= WEEKLY_CHECK_SIZE,
    };
  }
  if (last && since >= 0 && last.asked >= WEEKLY_CHECK_MIN) {
    return {
      kind: "result",
      written: last.written,
      asked: last.asked,
      remembered: last.remembered,
      percent: Math.round((last.remembered / last.asked) * 100),
    };
  }
  return null;
}

export interface WeeklySelection<T extends SentenceCandidate> {
  /** The sentences to ask, spread over the week's stories (newest first), at most WEEKLY_CHECK_SIZE. */
  items: T[];
  /** Every sentence of the stories finished in the week — what "you wrote N sentences" counts. */
  written: number;
}

/**
 * The sentences of the weekly check: those of stories finished in the last seven days, before today
 * (what was typed an hour ago is not yet a memory), of MIN_REVIEW_WORDS words or more, at most
 * WEEKLY_MAX_PER_LESSON from one story, one from each story in turn. Whether they are on the
 * learner's schedule does not matter: the check asks what they wrote, not what is due. The caller
 * hands in stories only. Fewer than WEEKLY_CHECK_MIN askable sentences means there is no check.
 */
export function selectWeeklyCheck<T extends SentenceCandidate>(
  candidates: readonly T[],
  todayISO: string,
): WeeklySelection<T> {
  const from = addDaysISO(todayISO, -WEEKLY_DAYS);
  const week: T[] = [];
  const seen = new Set<string>();
  for (const sentence of candidates) {
    if (seen.has(sentence.id)) continue;
    seen.add(sentence.id);
    if (sentence.completedOn >= from && sentence.completedOn < todayISO) week.push(sentence);
  }
  const askable = week.filter((sentence) => reviewWordCount(sentence.en) >= MIN_REVIEW_WORDS);
  const perLesson = new Map<string, number>();
  const items: T[] = [];
  for (const sentence of spreadAcrossLessons(askable)) {
    if (items.length >= WEEKLY_CHECK_SIZE) break;
    const taken = perLesson.get(sentence.lessonId) ?? 0;
    if (taken >= WEEKLY_MAX_PER_LESSON) continue;
    perLesson.set(sentence.lessonId, taken + 1);
    items.push(sentence);
  }
  return { items, written: week.length };
}

/**
 * How many sentences a check could ask now, and how many it could ask tomorrow (when today's
 * stories have become memories and the oldest day has left the week): what the locked card counts.
 */
export function weeklyReadiness<T extends SentenceCandidate>(
  candidates: readonly T[],
  todayISO: string,
): { askable: number; askableTomorrow: number } {
  return {
    askable: selectWeeklyCheck(candidates, todayISO).items.length,
    askableTomorrow: selectWeeklyCheck(candidates, addDaysISO(todayISO, 1)).items.length,
  };
}

/**
 * The check's sentences as the review screen draws them: every one from its meaning (the check is
 * Arabic to English with no help and no sound before the answer), in the order they were selected.
 * Its clip, in the voice of the lesson it is from, plays after the answer — so a sentence with no
 * stored clip is left out, like one with no meaning in the learner's language.
 */
export function buildCheckItems(
  selected: readonly SentenceCandidate[],
  prompts: ReadonlyMap<string, string>,
  clips: ReadonlyMap<string, string>,
): ReviewScreenItem[] {
  const items: ReviewScreenItem[] = [];
  for (const sentence of selected) {
    const prompt = prompts.get(sentence.id)?.trim();
    if (!prompt || prompt === sentence.en) continue;
    const audioUrl = clips.get(sentence.id);
    if (!audioUrl) continue;
    items.push({
      id: sentence.id,
      lessonId: sentence.lessonId,
      source: "sentence",
      en: sentence.en,
      prompt,
      strength: 0,
      reason: "spread",
      form: "translate",
      audioUrl,
      masked: [],
    });
  }
  return items;
}

/** The honest figures a finished check adds up to: right with no help, out of what was asked. */
export function checkFigures(results: readonly { outcome: "clean" | "assisted" | "missed" }[]): {
  asked: number;
  remembered: number;
} {
  return {
    asked: results.length,
    remembered: results.filter((result) => result.outcome === "clean").length,
  };
}
