/**
 * The daily challenge's score as the browser reports it, and the checks it must pass before it is
 * recorded. A Server Action is reachable as a direct POST, so nothing here is trusted: every number is
 * checked against what a two-minute round can actually produce. It is a game, not money, so the checks
 * are plausibility limits, not a proof. Pure and client-safe.
 */

import { ROUND_SECONDS } from "./engine";
import { utcDay } from "./seed";

export interface DailyScoreInput {
  /** The UTC day the words were dealt for ("YYYY-MM-DD"). */
  day: string;
  level: 1 | 2 | 3;
  score: number;
  accuracy: number;
  wpm: number;
  words: number;
}

/** The most points one word can earn (10, plus 2 for each of a combo of ten). */
export const MAX_POINTS_PER_WORD = 30;
/** The fewest seconds a word can take to read and type, however fast: a round cannot hold more words than this allows. */
const MIN_SECONDS_PER_WORD = 0.35;
export const MAX_WORDS = Math.floor(ROUND_SECONDS / MIN_SECONDS_PER_WORD);
export const MAX_WPM = 300;

function wholeNumber(value: unknown, min: number, max: number): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max
    ? value
    : null;
}

/** The day, one before or after today's UTC date (a round that crossed midnight, a clock a little off) and nothing else. */
export function isPlausibleDay(day: unknown, now: Date = new Date()): day is string {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const stamp = Date.parse(`${day}T12:00:00Z`);
  if (!Number.isFinite(stamp)) return false;
  const today = Date.parse(`${utcDay(now)}T12:00:00Z`);
  return Math.abs(stamp - today) <= 24 * 60 * 60 * 1000;
}

export function parseDailyScore(input: unknown, now: Date = new Date()): DailyScoreInput | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  if (!isPlausibleDay(raw.day, now)) return null;
  const level = wholeNumber(raw.level, 1, 3);
  const words = wholeNumber(raw.words, 0, MAX_WORDS);
  const score = wholeNumber(raw.score, 0, MAX_WORDS * MAX_POINTS_PER_WORD);
  const accuracy = wholeNumber(raw.accuracy, 0, 100);
  const wpm = wholeNumber(raw.wpm, 0, MAX_WPM);
  if (level === null || words === null || score === null || accuracy === null || wpm === null) {
    return null;
  }
  if (score > words * MAX_POINTS_PER_WORD) return null;
  // A round with words has points: a zero-word round is recorded as a zero, never as a score.
  if (words === 0 && score !== 0) return null;
  return { day: raw.day as string, level: level as 1 | 2 | 3, score, accuracy, wpm, words };
}
