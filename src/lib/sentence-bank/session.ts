import { REVIEW_FORMS } from "@/lib/sentence-bank/review";
import type { ReviewForm, SentenceOutcome } from "@/lib/sentence-bank/review";

/**
 * Sentence bank: the bookkeeping of one review visit. Pure — the screen keeps the queue and the
 * results, this decides what a wrong answer does to the queue and what the visit adds up to.
 */

/** A sentence in the visit's queue: its first go, or the second chance after a miss. */
export interface QueueEntry<T> {
  item: T;
  attempt: 0 | 1;
}

export function startQueue<T>(items: readonly T[]): QueueEntry<T>[] {
  return items.map((item) => ({ item, attempt: 0 }));
}

/**
 * How many sentences missed in a visit are asked once more at its end. None: a visit is exactly as
 * long as it was said to be, and a miss simply comes back tomorrow — nothing piles up on a learner
 * who is having a hard day. Raise it (it is the one place) to give a miss a second look at once.
 */
export const MAX_SECOND_CHANCES = 0;

/**
 * The queue after the learner answers the entry at `index`: while the visit has second chances to
 * give (`maxSecondChances`), a sentence missed on its first go is asked once more at the end (once
 * it has been seen written out, asked again with nothing in front of it), and never a third time.
 * Anything else leaves the queue alone. The schedule is told about the FIRST answer only — the
 * second chance is practice.
 */
export function queueAfterAnswer<T>(
  queue: readonly QueueEntry<T>[],
  index: number,
  outcome: SentenceOutcome,
  maxSecondChances: number = MAX_SECOND_CHANCES,
): QueueEntry<T>[] {
  const answered = queue[index];
  if (!answered || answered.attempt === 1 || outcome !== "missed") return [...queue];
  if (queue.filter((entry) => entry.attempt === 1).length >= maxSecondChances) return [...queue];
  return [...queue, { item: answered.item, attempt: 1 }];
}

/** How one sentence went on its first go. */
export interface ReviewResult {
  sentenceId: string;
  form: ReviewForm;
  outcome: SentenceOutcome;
}

export interface ReviewSummary {
  total: number;
  /** Right with no help at all: the number "you remembered" is made of. */
  clean: number;
  assisted: number;
  missed: number;
  /** How many were asked in each form. */
  forms: Record<ReviewForm, number>;
}

export function summarizeReview(results: readonly ReviewResult[]): ReviewSummary {
  const forms = Object.fromEntries(REVIEW_FORMS.map((form) => [form, 0])) as Record<
    ReviewForm,
    number
  >;
  let clean = 0;
  let assisted = 0;
  let missed = 0;
  for (const result of results) {
    forms[result.form] += 1;
    if (result.outcome === "clean") clean += 1;
    else if (result.outcome === "assisted") assisted += 1;
    else missed += 1;
  }
  return { total: results.length, clean, assisted, missed, forms };
}
