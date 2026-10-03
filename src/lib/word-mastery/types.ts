import type { GroupMastery } from "@/lib/word-mastery/schedule";

/**
 * What the practice screens report to the server about one word. Client-safe
 * (no server imports) so the screens and the Server Action share one type.
 *
 *  - clean: right on the first try, no help.
 *  - assisted: right on the first try after using the first-letter hint.
 *  - missed: a wrong answer, or "I don't know" — reported the FIRST time it
 *    happens to a word in a visit, while the word is still unanswered.
 *  - recovered: the word was finally typed right after having been missed
 *    earlier in the visit. The schedule already took the miss; this only moves
 *    the weak-word ledger on (the word is corrected and will be re-checked
 *    tomorrow, instead of being wiped as if it had been learned).
 */
export const REPORTED_OUTCOMES = ["clean", "assisted", "missed", "recovered"] as const;
export type ReportedOutcome = (typeof REPORTED_OUTCOMES)[number];

export function isReportedOutcome(value: unknown): value is ReportedOutcome {
  return typeof value === "string" && (REPORTED_OUTCOMES as readonly string[]).includes(value);
}

/** What a learner says about a word on the redesigned Learn screen: they already know it, or they are still learning it. */
export const LEARN_CHOICES = ["known", "learning"] as const;
export type LearnChoice = (typeof LEARN_CHOICES)[number];

export function isLearnChoice(value: unknown): value is LearnChoice {
  return typeof value === "string" && (LEARN_CHOICES as readonly string[]).includes(value);
}

export interface LearnChoiceInput {
  /** The vocabulary word's id (vocabulary_words.id). */
  wordId: string;
  choice: LearnChoice;
}

export function isLearnChoiceInput(value: unknown): value is LearnChoiceInput {
  if (typeof value !== "object" || value === null) return false;
  const input = value as Record<string, unknown>;
  return (
    typeof input.wordId === "string" &&
    input.wordId.length > 0 &&
    input.wordId.length <= MAX_OUTCOME_FIELD_LENGTH &&
    isLearnChoice(input.choice)
  );
}

export interface WordOutcomeInput {
  /** The vocabulary word's id (vocabulary_words.id). */
  wordId: string;
  /** Its target word, which is what the weak-word ledger is keyed on. */
  word: string;
  outcome: ReportedOutcome;
}

/** Where the word stands after the visit, or null when nothing was recorded (a guest, the feature off, the migration not applied yet). */
export interface WordOutcomeResult {
  strength: number;
  dueOn: string;
}

/** Longest id / word the action accepts — anything longer is not one of ours. */
export const MAX_OUTCOME_FIELD_LENGTH = 200;

export function isWordOutcomeInput(value: unknown): value is WordOutcomeInput {
  if (typeof value !== "object" || value === null) return false;
  const input = value as Record<string, unknown>;
  return (
    typeof input.wordId === "string" &&
    input.wordId.length > 0 &&
    input.wordId.length <= MAX_OUTCOME_FIELD_LENGTH &&
    typeof input.word === "string" &&
    input.word.length > 0 &&
    input.word.length <= MAX_OUTCOME_FIELD_LENGTH &&
    isReportedOutcome(input.outcome)
  );
}

/** What the Word Lists library shows when Smart word practice is on for a signed-in learner. */
export interface LibraryMastery {
  /** Per group id: new / due / strong counts and the 0-100 mastery percent. */
  byGroup: Record<string, GroupMastery>;
  /** Words waiting for a review today: due on the learner's schedule, or weak (an unfixed mistake), each counted once. Behind the hero's number. */
  reviewCount: number;
}
