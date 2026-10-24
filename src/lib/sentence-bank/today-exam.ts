import { REVIEW_SPARES } from "@/lib/sentence-bank/review";
import {
  MAX_TODAY_PER_LESSON,
  MIN_REVIEW_WORDS,
  reviewWordCount,
} from "@/lib/sentence-bank/select";

/**
 * Sentence bank: what the day's test asks. Only the lessons of Today's session the learner finished
 * today — the passage they listened to and the story they typed — never a sentence from an earlier
 * day. Pure: the loader reads the lines of those lessons, this decides which of them are worth
 * asking and in what order. The order is a function of the day and the line alone (no weak words, no
 * clock, nothing the learner does while taking the test can change it), because a test left half way
 * carries on from the number of questions already answered: the same list must come back.
 */

/** Where a line of the test comes from: a story's typed sentence, or one line of a passage. */
export type ExamSource = "story" | "passage";

export interface TodayLine {
  /** The sentence's id (a story) or the passage line's id. */
  id: string;
  /** The story or the passage the line belongs to. */
  lessonId: string;
  source: ExamSource;
  /** Position in its lesson (a passage counts through all its parts). */
  orderIndex: number;
  en: string;
}

/** Lines of one lesson read for the test: the ones it may ask, and a few spare for those that cannot be asked (no stored clip). */
export const LINES_READ_PER_LESSON = MAX_TODAY_PER_LESSON + REVIEW_SPARES;

/** FNV-1a: a tiny stable hash, so the pick of lines varies from day to day but never at random. */
export function stableHash(text: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** A line's words as said, lower-cased and single-spaced: two lines of a passage that say the same thing are one question. */
function sameWords(en: string): string {
  return en.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * The lines worth asking, lesson by lesson: four words or more (a "Hi, Tom!" tests nothing), each
 * line once, and from each lesson the first few in the day's own order — `LINES_READ_PER_LESSON`, so
 * the test is a spread over the lesson and not always its opening lines. The lessons stay grouped;
 * `interleaveToday` mixes them once the loader has dropped the lines that cannot be asked.
 */
export function poolForToday<T extends TodayLine>(lines: readonly T[], todayISO: string): T[] {
  const seenIds = new Set<string>();
  const seenWords = new Set<string>();
  const lessons = new Map<string, T[]>();
  for (const line of lines) {
    if (seenIds.has(line.id)) continue;
    seenIds.add(line.id);
    if (reviewWordCount(line.en) < MIN_REVIEW_WORDS) continue;
    const words = `${line.lessonId}:${sameWords(line.en)}`;
    if (seenWords.has(words)) continue;
    seenWords.add(words);
    const list = lessons.get(line.lessonId);
    if (list) list.push(line);
    else lessons.set(line.lessonId, [line]);
  }
  const pool: T[] = [];
  // Lessons in id order, so the pool never depends on the order the lines were read in.
  for (const [, list] of [...lessons.entries()].sort(([idA], [idB]) => compareText(idA, idB))) {
    list.sort(
      (a, b) =>
        stableHash(`${todayISO}|${a.id}`) - stableHash(`${todayISO}|${b.id}`) ||
        a.orderIndex - b.orderIndex ||
        compareText(a.id, b.id),
    );
    pool.push(...list.slice(0, LINES_READ_PER_LESSON));
  }
  return pool;
}

/** Passages come first, then stories — the order Today's session goes in. */
function sourceRank(source: string): number {
  return source === "passage" ? 0 : 1;
}

/**
 * One line from each lesson in turn (the passage first, then the story), then the next from each,
 * and so on, at most `perLesson` from any one lesson — a test over BOTH of today's lessons, not
 * three questions about whichever came first. The lines of a lesson keep the order they came in.
 */
export function interleaveToday<T extends { lessonId: string; source: string }>(
  items: readonly T[],
  perLesson: number = MAX_TODAY_PER_LESSON,
): T[] {
  const cap = Math.max(1, Math.trunc(perLesson));
  const lessons = new Map<string, T[]>();
  for (const item of items) {
    const list = lessons.get(item.lessonId);
    if (list) list.push(item);
    else lessons.set(item.lessonId, [item]);
  }
  const ordered = [...lessons.entries()]
    .sort(
      ([idA, a], [idB, b]) =>
        sourceRank(a[0]!.source) - sourceRank(b[0]!.source) || compareText(idA, idB),
    )
    .map(([, list]) => list.slice(0, cap));
  const mixed: T[] = [];
  for (let round = 0; round < cap; round++) {
    for (const list of ordered) {
      const item = list[round];
      if (item) mixed.push(item);
    }
  }
  return mixed;
}

/** How many questions today's lessons can give (what the day's row is dealt for): the pool, mixed and capped per lesson. */
export function questionsReadyToday(lines: readonly TodayLine[], todayISO: string): number {
  return interleaveToday(poolForToday(lines, todayISO)).length;
}
