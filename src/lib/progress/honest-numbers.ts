import { STRONG_STRENGTH } from "@/lib/word-mastery/schedule";

/**
 * "Honest numbers": what a learner has actually done, counted the way Home's top bar counts it
 * (src/components/home-today/top-bar.tsx), plus the three facts Home does not show (typing speed,
 * words that have stayed in memory, days practised). Pure: the caller reads the rows, this decides
 * what may be said about them. Nothing here is a level, a percentage of a course, or a guess.
 *
 * Sources, checked against the code and the live data on 2026-10-24:
 *  - sentences / words: the learner's completed lessons (user_progress, one row per lesson, so a
 *    replay never counts twice) times each lesson's own totals (getHomeLessons -> lessonStats, the
 *    normal, stories and conversation modes). This is what Home calls "lines" and "words". The
 *    "sessions" figure on Home counts every finished run (lesson_attempts, replays included) and is
 *    a different basis, so it is deliberately not mixed in here.
 *  - typing speed: lesson_attempts.wpm, timed by the browser (correct characters / 5 per minute) and
 *    rounded. A few runs on record are impossible (up to 911), so values above MAX_PLAUSIBLE_WPM are
 *    not samples; the median, never the mean, is reported.
 *  - words in memory: word_mastery.strength at STRONG_STRENGTH or more, the same "mastered" the Word
 *    Lists rings use. On 2026-10-24 no learner had one yet (139 schedule rows, none that strong), so
 *    this is 0 for everyone and the line never mentions it until it is a real number.
 *  - days practised: distinct activity_days with kind "active" (a day the learner finished a lesson
 *    or a passage). Forgiven (grace) and frozen days keep a streak alive but are not practice.
 */

/** A run timed faster than this is not a typing speed (the 99th percentile on record is 56). */
export const MAX_PLAUSIBLE_WPM = 150;

/** Valid timed runs needed before a median speed is worth saying (43% of the learners with a timed run have three). */
export const MIN_WPM_SAMPLES = 3;

/** Fewer sentences than this is a start, not a record: no progress line yet. */
export const MIN_SENTENCES_FOR_LINE = 5;

/** "over N days" is only said for two days or more; one day is just "today". */
export const MIN_DAYS_FOR_LINE = 2;

/** Words in memory are only added to the line once there are enough to be worth saying. */
export const MIN_MASTERED_FOR_LINE = 10;

export interface LessonTotals {
  sentences: number;
  words: number;
}

/** The learner's completed lessons: `${mode}:${lessonId}`, the same keys Home's lessonStats uses. */
export interface CompletedLesson {
  mode: string;
  lessonId: string;
}

export interface HonestInput {
  completions: ReadonlyArray<CompletedLesson>;
  /** Home's lessonStats: every lesson's own sentence and word totals. */
  lessonStats: Readonly<Record<string, LessonTotals | undefined>>;
  /** lesson_attempts.wpm of the learner's runs, in any order. */
  wpm: ReadonlyArray<number | null | undefined>;
  /** word_mastery.strength of every word the learner has practised. */
  wordStrengths: ReadonlyArray<number>;
  /** activity_days rows of the learner. */
  activity: ReadonlyArray<{ day: string; kind: string }>;
}

export interface HonestNumbers {
  lessons: number;
  /** What Home calls "lines": the sentences of the lessons completed, each lesson once. */
  sentences: number;
  words: number;
  /** Whole words per minute, or null while fewer than MIN_WPM_SAMPLES valid runs exist. */
  medianWpm: number | null;
  wpmSamples: number;
  /** Words that have passed the 16-day review (strength 4 or more). */
  masteredWords: number;
  /** Distinct days with practice. */
  activeDays: number;
}

/** Home's totals: the sentences and words of the lessons the learner completed, each counted once. */
export function lessonTotals(
  completions: ReadonlyArray<CompletedLesson>,
  lessonStats: Readonly<Record<string, LessonTotals | undefined>>,
): { lessons: number; sentences: number; words: number } {
  const seen = new Set<string>();
  const totals = { lessons: 0, sentences: 0, words: 0 };
  for (const completion of completions) {
    const key = `${completion.mode}:${completion.lessonId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const stat = lessonStats[key];
    if (!stat) continue;
    totals.lessons += 1;
    totals.sentences += stat.sentences;
    totals.words += stat.words;
  }
  return totals;
}

function isValidWpm(value: number | null | undefined): value is number {
  return (
    typeof value === "number" && Number.isFinite(value) && value > 0 && value <= MAX_PLAUSIBLE_WPM
  );
}

/** The median of the valid timed runs, rounded to a whole number, or null when there are too few. */
export function medianWpm(wpm: ReadonlyArray<number | null | undefined>): {
  median: number | null;
  samples: number;
} {
  const valid = wpm.filter(isValidWpm).sort((a, b) => a - b);
  if (valid.length < MIN_WPM_SAMPLES) return { median: null, samples: valid.length };
  const middle = Math.floor(valid.length / 2);
  const median =
    valid.length % 2 === 1 ? valid[middle]! : (valid[middle - 1]! + valid[middle]!) / 2;
  return { median: Math.round(median), samples: valid.length };
}

export function honestNumbers(input: HonestInput): HonestNumbers {
  const totals = lessonTotals(input.completions, input.lessonStats);
  const speed = medianWpm(input.wpm);
  const days = new Set(input.activity.filter((row) => row.kind === "active").map((row) => row.day));
  return {
    ...totals,
    medianWpm: speed.median,
    wpmSamples: speed.samples,
    masteredWords: input.wordStrengths.filter((strength) => strength >= STRONG_STRENGTH).length,
    activeDays: days.size,
  };
}

/**
 * The one line that may be said about the learner's progress, as plain facts for the screen to word
 * in the learner's language. null while there is nothing worth saying (a brand-new learner): no line
 * at all is better than a small or invented one.
 */
export type HonestLine =
  | { kind: "sentences"; sentences: number }
  | { kind: "sentences_days"; sentences: number; days: number }
  | { kind: "sentences_days_mastered"; sentences: number; days: number; mastered: number };

export function honestLine(numbers: HonestNumbers): HonestLine | null {
  if (numbers.sentences < MIN_SENTENCES_FOR_LINE) return null;
  const { sentences } = numbers;
  if (numbers.activeDays < MIN_DAYS_FOR_LINE) return { kind: "sentences", sentences };
  const days = numbers.activeDays;
  if (numbers.masteredWords >= MIN_MASTERED_FOR_LINE) {
    return { kind: "sentences_days_mastered", sentences, days, mastered: numbers.masteredWords };
  }
  return { kind: "sentences_days", sentences, days };
}

/**
 * What the lock card says about the learner: the sentences they have written, the days they have
 * practised (null when it is only one, which is not worth a line), and whether "your review stays
 * free" may be said. That sentence is only true for a learner who never paid: a lapsed subscriber
 * can lose sight of the words of Premium lists (they are hidden from an account without access), so
 * for them the card keeps the number and leaves the promise out. null when there is no honest line.
 */
export interface GateProgress {
  sentences: number;
  days: number | null;
  reviewFree: boolean;
}

export function gateProgress(numbers: HonestNumbers, neverPaid: boolean): GateProgress | null {
  const line = honestLine(numbers);
  if (!line) return null;
  return {
    sentences: line.sentences,
    days: line.kind === "sentences" ? null : line.days,
    reviewFree: neverPaid,
  };
}
