import { splitAroundWord } from "@/lib/passages/text";
import { bankFormFor } from "@/lib/word-bank/forms";
import type { BankForm } from "@/lib/word-bank/forms";
import type { BankWordState } from "@/lib/word-bank/select";
import type { BankSource } from "@/lib/word-bank/types";
import { STRONG_STRENGTH } from "@/lib/word-mastery/schedule";
import type { WordOutcome } from "@/lib/word-mastery/schedule";
import { BLANK_TOKEN } from "@/types/word-lists";

/**
 * Words bank («كلماتي»): one review round as the screen draws it. Pure and client-safe — the loader
 * (round-load.ts) reads the bank, the catalog's sentences and the recorded clips; this turns one
 * word of the bank into what the screen needs (its form, the sentence with the word left out), says
 * how an answer is reported, and adds a finished round up.
 */

/** One word of a round as the screen needs it: plain data, so it crosses from the server page to the client screen as it is. */
export interface BankRoundWord {
  word: string;
  /** How the word is asked (see bankFormFor): its meaning, another sentence, or only its sound. */
  form: BankForm;
  strength: number;
  /** What the learner types into: a sentence with BLANK_TOKEN where the word goes, or the lone blank when the form shows no sentence. */
  prompt: string;
  /** The meaning as the learner saw it ("term — definition", see splitWordHint); "" when none was known. */
  ar: string;
  /** The word's recorded clip, or null. Always set for the audio form. */
  audioUrl: string | null;
  /** Where the word was first met: what the "home sentence" card shows after a miss. */
  source: BankSource;
  lessonId: string | null;
  lessonTitle: string | null;
  homeSentence: string | null;
  firstSeenOn: string;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** How many times the word stands in the sentence as a whole word (so "aunt" is not in "daunting" and "aunt" is not in "aunts"). */
function wholeWordCount(sentence: string, word: string): number {
  const pattern = new RegExp(`(^|[^\\p{L}'])${escapeRegExp(word)}(?=$|[^\\p{L}'])`, "giu");
  return [...sentence.matchAll(pattern)].length;
}

/**
 * The sentence with the word left out (BLANK_TOKEN in its place), or null when it cannot stand as a
 * question: the word is not in it as a whole word, or it is there twice (the second would give the
 * answer away).
 */
export function blankWord(sentence: string, word: string): string | null {
  if (wholeWordCount(sentence, word) !== 1) return null;
  const parts = splitAroundWord(sentence, word);
  return parts ? `${parts[0]}${BLANK_TOKEN}${parts[2]}` : null;
}

/** The length (in words) of a sentence worth asking in: long enough to say something, short enough to read at a glance. */
export const OTHER_SENTENCE_WORDS = { min: 4, max: 16 } as const;

function normalizeSentence(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Whether two sentences are the same line (capitals and spacing aside). */
export function sameSentence(a: string, b: string): boolean {
  return normalizeSentence(a) === normalizeSentence(b);
}

/**
 * The translation of a sentence the learner reads under it: Spanish and Turkish learners read their
 * own language when one was written (`supportText` falls back to the English line itself, which is
 * no translation), everyone else reads the Arabic. Null when there is none.
 */
export function pickTranslation(
  line: { en: string; ar: string; supportText?: string },
  locale: "ar" | "es" | "tr" | null,
): string | null {
  if (locale === "es" || locale === "tr") {
    const text = line.supportText?.trim();
    return text && !sameSentence(text, line.en) ? text : null;
  }
  return line.ar.trim() || null;
}

/** FNV-1a: a small stable hash, so the same word on the same day is asked in the same sentence. */
function fnv1a(text: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Another sentence of the catalog that holds the word (a whole word, once), for the form that asks it
 * in a new context: never one of `exclude` (its home sentence), of a readable length, and the same
 * choice every time for the same `seed` (the word and the day), so a reload does not change the
 * question. Null when the catalog has no such sentence.
 */
export function pickOtherSentence(
  word: string,
  sentences: readonly string[],
  options: { exclude?: readonly string[]; seed: string },
): string | null {
  const needle = word.toLowerCase();
  const excluded = new Set((options.exclude ?? []).map(normalizeSentence));
  const found = new Set<string>();
  for (const sentence of sentences) {
    if (!sentence.toLowerCase().includes(needle)) continue;
    const key = normalizeSentence(sentence);
    if (excluded.has(key)) continue;
    const length = key.split(" ").length;
    if (length < OTHER_SENTENCE_WORDS.min || length > OTHER_SENTENCE_WORDS.max) continue;
    if (blankWord(sentence, word) === null) continue;
    found.add(sentence);
  }
  const candidates = [...found].sort();
  if (candidates.length === 0) return null;
  return candidates[fnv1a(options.seed) % candidates.length]!;
}

/** What was found for a word besides the bank's own row: another sentence that holds it and its recorded clip. */
export interface BankWordFinds {
  otherSentence: string | null;
  clip: string | null;
}

/** One word of the bank as a question: its form by how strong it is (stepping down when the form cannot be built) and the prompt that form types into. */
export function buildBankRoundWord(state: BankWordState, found: BankWordFinds): BankRoundWord {
  const form = bankFormFor(state.strength, {
    otherSentence: found.otherSentence !== null,
    clip: found.clip !== null,
  });
  let prompt: string | null = null;
  if (form === "context" && found.otherSentence)
    prompt = blankWord(found.otherSentence, state.word);
  if (form === "meaning" && state.homeSentence) prompt = blankWord(state.homeSentence, state.word);
  return {
    word: state.word,
    form,
    strength: state.strength,
    prompt: prompt ?? BLANK_TOKEN,
    ar: state.ar,
    audioUrl: found.clip,
    source: state.source,
    lessonId: state.lessonId,
    lessonTitle: state.lessonTitle,
    homeSentence: state.homeSentence,
    firstSeenOn: state.firstSeenOn,
  };
}

/**
 * Whether a word can be asked at all: a word with no meaning, no usable sentence and no clip would
 * show the learner an empty blank. Such a word is left out of the round (and the loader looks past
 * it, so it never takes a place that a word that can be asked should have).
 */
export function isAskable(word: BankRoundWord): boolean {
  if (word.form !== "meaning") return true;
  return word.ar.trim() !== "" || word.prompt !== BLANK_TOKEN;
}

/** How the first answer to a word is reported to the bank: wrong is a miss, right after the one help is assisted, right with none is clean. */
export function bankOutcome(answer: { correct: boolean; helped: boolean }): WordOutcome {
  if (!answer.correct) return "missed";
  return answer.helped ? "assisted" : "clean";
}

/** The first answer to one word of a round, and where it left the word (null while the bank has not answered). */
export interface BankRoundResult {
  word: string;
  outcome: WordOutcome;
  strength: number | null;
  advanced: boolean;
}

export interface BankRoundSummary {
  asked: number;
  /** Right with no help: the "from the first time" number. */
  clean: number;
  assisted: number;
  missed: number;
  /** Words this round carried up to "stable" (strength 4 or more). */
  stabilized: number;
}

export function summarizeBankRound(results: readonly BankRoundResult[]): BankRoundSummary {
  const summary: BankRoundSummary = { asked: 0, clean: 0, assisted: 0, missed: 0, stabilized: 0 };
  for (const result of results) {
    summary.asked += 1;
    summary[result.outcome] += 1;
    if (result.advanced && result.strength !== null && result.strength >= STRONG_STRENGTH) {
      summary.stabilized += 1;
    }
  }
  return summary;
}

/** The grammatical number a count of words takes in the screen's texts: one, two (Arabic's dual) or many. */
export type CountKey = "one" | "two" | "many";

export function countKey(count: number): CountKey {
  if (count === 1) return "one";
  if (count === 2) return "two";
  return "many";
}

/** Which "from the first time" line the finish screen shows: all of them, some of them, or none (then it says nothing rather than something discouraging). */
export function firstTimeKey(summary: BankRoundSummary): "all" | "some" | "none" {
  if (summary.asked > 0 && summary.clean === summary.asked) return "all";
  return summary.clean > 0 ? "some" : "none";
}

/** When a word was first met, as the "home sentence" card says it. */
export type FirstMet =
  | { kind: "today" }
  | { kind: "yesterday" }
  | { kind: "weekday"; weekday: number }
  | { kind: "date" };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Today, yesterday, the weekday of a day within the last week (0 = Sunday), or (a week or more ago) its date — all on the learner's own calendar days. */
export function firstMet(firstSeenOn: string, todayISO: string): FirstMet {
  const days = Math.round(
    (Date.parse(`${todayISO}T00:00:00Z`) - Date.parse(`${firstSeenOn}T00:00:00Z`)) / DAY_MS,
  );
  if (!Number.isFinite(days) || days <= 0) return { kind: "today" };
  if (days === 1) return { kind: "yesterday" };
  if (days < 7) {
    return { kind: "weekday", weekday: new Date(`${firstSeenOn}T00:00:00Z`).getUTCDay() };
  }
  return { kind: "date" };
}

/** The most words of the bank looked at to fill one round: far more than a round, so words that cannot be asked do not shorten it. */
export const BANK_CANDIDATE_POOL = 20;
