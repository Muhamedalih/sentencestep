import type { WordOutcome } from "@/lib/word-mastery/schedule";

/**
 * Rounds of words as the analytics see them (the WORDS_ROUND_STARTED / WORDS_ROUND_FINISHED events
 * of src/lib/analytics/events.ts): where a round was asked, how many words it asked and how each
 * word's FIRST answer went. Pure and client-safe, so the practice screens, the Server Action that
 * records the report and the tests all share it. A report carries counts only, never a word, a word
 * id or a lesson id.
 */

/** Where a round was asked: a Word Lists practice (`list`), Today's five words (`today`), the Review All Words queue (`review`) or a review round of the words bank «كلماتي» (`bank`). */
export const WORDS_ROUND_SOURCES = ["list", "today", "review", "bank"] as const;
export type WordsRoundSource = (typeof WORDS_ROUND_SOURCES)[number];

export function isWordsRoundSource(value: unknown): value is WordsRoundSource {
  return typeof value === "string" && (WORDS_ROUND_SOURCES as readonly string[]).includes(value);
}

/** The most words one round can ask: a Word Lists group is 25-30 words and a review queue is the learner's weak words, so a bigger number is not one of ours. */
export const MAX_ROUND_WORDS = 500;

/** How the words of a round went on their first answer: right with no help, right with one hint, wrong (or given up on). */
export interface WordsRoundTally {
  /** Words that got a first answer; always clean + assisted + missed. */
  count: number;
  clean: number;
  assisted: number;
  missed: number;
}

export function summarizeWordsRound(outcomes: Iterable<WordOutcome>): WordsRoundTally {
  const tally: WordsRoundTally = { count: 0, clean: 0, assisted: 0, missed: 0 };
  for (const outcome of outcomes) {
    tally.count += 1;
    tally[outcome] += 1;
  }
  return tally;
}

/**
 * The first answer to each word of one round. A word comes back after a miss and is asked again
 * until it lands, but the second go is practice: only the first outcome of a word is kept, exactly
 * as the sentence review reports its sentences.
 */
export interface WordsRoundLedger {
  note(wordId: string, outcome: WordOutcome): void;
  tally(): WordsRoundTally;
  /** A new round of the same words ("Practice again"). */
  reset(): void;
}

export function createWordsRoundLedger(): WordsRoundLedger {
  let outcomes = new Map<string, WordOutcome>();
  return {
    note(wordId, outcome) {
      if (!outcomes.has(wordId)) outcomes.set(wordId, outcome);
    },
    tally: () => summarizeWordsRound(outcomes.values()),
    reset() {
      outcomes = new Map();
    },
  };
}

/**
 * How many words a practice visit asks. A Continue visit opens at the block holding the first
 * unfinished word (see resumePoint), so the blocks before it and the finished words of its own
 * block are not asked again; a fresh visit asks the whole group.
 */
export function wordsAskedInVisit(
  total: number,
  resume: { blockIndex: number; done: readonly number[] } | null,
  blockSize: number,
): number {
  if (!resume) return total;
  return Math.max(0, total - resume.blockIndex * blockSize - resume.done.length);
}

/** How a round is reported: its start, and its end with how each word went. */
export type WordsRoundReport =
  | { event: "started"; source: WordsRoundSource; count: number }
  | ({ event: "finished"; source: WordsRoundSource } & WordsRoundTally);

function isRoundCount(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_ROUND_WORDS
  );
}

/**
 * Checks a report that arrived from the browser: a known source and event, whole numbers in range,
 * at least one word, and a finish whose three outcomes add up to its count. Anything else is null
 * and is simply not recorded.
 */
export function parseWordsRoundReport(input: unknown): WordsRoundReport | null {
  if (typeof input !== "object" || input === null) return null;
  const report = input as Record<string, unknown>;
  const { event, source, count } = report;
  if (!isWordsRoundSource(source) || !isRoundCount(count) || count < 1) return null;
  if (event === "started") return { event, source, count };
  if (event !== "finished") return null;
  const { clean, assisted, missed } = report;
  if (!isRoundCount(clean) || !isRoundCount(assisted) || !isRoundCount(missed)) return null;
  if (clean + assisted + missed !== count) return null;
  return { event, source, count, clean, assisted, missed };
}
