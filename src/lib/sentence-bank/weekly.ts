import type { ReviewScreenItem } from "@/lib/sentence-bank/items";
import { MIN_REVIEW_WORDS, reviewWordCount, spreadAcrossLessons } from "@/lib/sentence-bank/select";
import type { SentenceCandidate } from "@/lib/sentence-bank/select";
import { addDaysISO } from "@/lib/word-mastery/schedule";

/**
 * Sentence bank: the weekly check. After seven days of Today's session the learner is asked ten of
 * the sentences they wrote that week, each from its meaning, with nothing in front of them and no
 * help, and is told ONE honest thing: how many they remembered. No level is claimed from it (the
 * ten are a sample of one week of writing, not a measure of English), no number is shown for a
 * check that asked fewer than five, and the line is shown for the week after the check and not
 * longer. Pure — the loader reads the learner's last check, their Today days and their lessons.
 */

/** Sentences a weekly check asks, at most. */
export const WEEKLY_CHECK_SIZE = 10;
/** Fewer than this is not a check, and a check that asked fewer shows no number. */
export const WEEKLY_CHECK_MIN = 5;
/** At most this many from one lesson, so the ten are a spread over the week. */
export const WEEKLY_MAX_PER_LESSON = 3;
/** A check is about the last seven days of writing, and comes at most once in seven days. */
export const WEEKLY_DAYS = 7;
/** Days of Today's session (the finish screen reached) since the last check before the next one is offered. */
export const WEEKLY_SESSION_DAYS = 7;
/** Lessons finished in the week, at least, for there to be a week to ask about. */
export const WEEKLY_MIN_LESSONS = 3;
/** About twenty-five seconds a sentence for ten, rounded up: what the line says it takes. */
export const WEEKLY_CHECK_MINUTES = 4;
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
 * The one line Today's tasks box shows about the weekly check, or nothing:
 *  - the check is due when seven days of Today's session have been completed since the last one (or
 *    ever), at least a week has passed since it, and the learner finished enough lessons that week;
 *  - for the seven days after a check it shows its result, when the check asked at least five;
 *  - otherwise nothing: a quiet box has no line.
 * A due check wins over an old result.
 */
export function weeklyLine(input: {
  last: LastCheck | null;
  todayISO: string;
  /** Days of Today's session completed since the last check (all of them when there was none). */
  sessionDays: number;
  /** Lessons finished in the last week, before today. */
  lessonsThisWeek: number;
}): WeeklyLine | null {
  const { last, todayISO } = input;
  const since = last ? daysBetweenISO(last.checkedOn, todayISO) : null;
  const weekPassed = since === null || since >= WEEKLY_DAYS;
  if (
    weekPassed &&
    input.sessionDays >= WEEKLY_SESSION_DAYS &&
    input.lessonsThisWeek >= WEEKLY_MIN_LESSONS
  ) {
    return { kind: "due", size: WEEKLY_CHECK_SIZE, minutes: WEEKLY_CHECK_MINUTES };
  }
  if (
    last &&
    since !== null &&
    since >= 0 &&
    since < WEEKLY_DAYS &&
    last.asked >= WEEKLY_CHECK_MIN
  ) {
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
  /** The sentences to ask, spread over the week's lessons (newest first), at most WEEKLY_CHECK_SIZE. */
  items: T[];
  /** Every sentence of the lessons finished in the week — what "you wrote N sentences" counts. */
  written: number;
}

/**
 * The sentences of the weekly check: those of lessons finished in the last seven days, before today
 * (what was typed an hour ago is not yet a memory), of MIN_REVIEW_WORDS words or more, at most
 * WEEKLY_MAX_PER_LESSON from one lesson, one from each lesson in turn. Whether they are on the
 * learner's schedule does not matter: the check asks what they wrote, not what is due. Fewer than
 * WEEKLY_CHECK_MIN askable sentences means there is no check (the caller offers none).
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
