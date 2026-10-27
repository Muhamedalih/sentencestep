import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { isISODate, isWordOutcome } from "@/lib/word-mastery/schedule";
import type { WordOutcome } from "@/lib/word-mastery/schedule";

/**
 * The words bank («كلماتي»): the words a learner has met in Today's story and passage (and, later,
 * the ones they star or learn from the core list), each with its own spaced-repetition state in
 * `learner_words` (see 20250350000000_learner_words.sql). Pure and client-safe, so the practice
 * screens, the Server Action that records an answer and the tests all share it.
 */

/** Where a word was first met: a Today story or passage, a star while typing, the core list, an ordinary lesson. */
export const BANK_SOURCES = ["story", "passage", "star", "core", "lesson"] as const;
export type BankSource = (typeof BANK_SOURCES)[number];

export function isBankSource(value: unknown): value is BankSource {
  return typeof value === "string" && (BANK_SOURCES as readonly string[]).includes(value);
}

/** The table's own limits (its check constraints): schema.test.ts keeps the two in step. */
export const BANK_LIMITS = {
  word: 60,
  ar: 300,
  lessonId: 120,
  lessonTitle: 200,
  homeSentence: 400,
} as const;

/** What the caller knows about a word besides how it went: where it was met and what the learner saw. */
export interface BankWordContext {
  source: BankSource;
  /** The story or passage the word was met in. */
  lessonId?: string;
  lessonTitle?: string;
  /** The meaning as the learner saw it, in their support language. */
  ar?: string;
  /** The full English sentence the word sat in ("the home sentence"). */
  homeSentence?: string;
}

/** One answer to one word, as the learner's screen reports it (and the Server Action re-validates it). */
export interface BankWordInput extends BankWordContext {
  /** Already normalized (see parseBankWordInput). */
  word: string;
  /** How the word's FIRST answer of the round went. */
  outcome: WordOutcome;
  /** The learner's own calendar day, "YYYY-MM-DD". */
  todayISO: string;
}

/** Trimmed, whitespace collapsed, cut to `max`; undefined when nothing is left. */
function cleanText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.replace(/\s+/g, " ").trim();
  return text.length === 0 ? undefined : text.slice(0, max);
}

/**
 * Turns whatever arrived from the browser into a valid answer, or null. A Server Action is reachable
 * as a direct POST, so nothing here is trusted: the word is normalized the way every other word
 * ledger writes it, the outcome, day and source must be known values, and every text is cut to the
 * table's limit.
 */
export function parseBankWordInput(input: unknown): BankWordInput | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  if (typeof raw.word !== "string") return null;
  const word = normalizeMistakeWord(raw.word);
  if (word.length < 2 || word.length > BANK_LIMITS.word || !isTrackableWord(word)) return null;
  if (!isWordOutcome(raw.outcome)) return null;
  if (!isISODate(raw.todayISO)) return null;
  if (!isBankSource(raw.source)) return null;
  return {
    word,
    outcome: raw.outcome,
    todayISO: raw.todayISO,
    source: raw.source,
    lessonId: cleanText(raw.lessonId, BANK_LIMITS.lessonId),
    lessonTitle: cleanText(raw.lessonTitle, BANK_LIMITS.lessonTitle),
    ar: cleanText(raw.ar, BANK_LIMITS.ar),
    homeSentence: cleanText(raw.homeSentence, BANK_LIMITS.homeSentence),
  };
}
