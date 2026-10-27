import { STRONG_STRENGTH, isDue } from "@/lib/word-mastery/schedule";
import type { BankSource } from "@/lib/word-bank/types";

/**
 * Words bank: which of a learner's words come back today, and how the bank reads as a whole. Pure —
 * the loader reads the learner's `learner_words` rows, this only chooses and counts.
 *
 * A round is small on purpose (five, the same size as Today's words step), never a pile, and the
 * learner is never shown how many are waiting: `more` is a yes or a no, so a gap of weeks is not a
 * debt. A word with no row is not in the bank at all (a row exists from the first answer), so unlike
 * the sentence bank there is nothing "new but never asked" to select here.
 */

/** Words in one round. */
export const BANK_ROUND_SIZE = 5;

/** One word of the bank as the loader hands it over. */
export interface BankWordState {
  word: string;
  /** 0 (new, or sent back by a miss) to 5. */
  strength: number;
  /** The learner-local day the word is next due, "YYYY-MM-DD". */
  dueOn: string;
  lastReviewedOn: string;
  source: BankSource;
  lessonId: string | null;
  lessonTitle: string | null;
  /** The meaning as the learner saw it; "" when none was known. */
  ar: string;
  /** The full sentence the word was first met in. */
  homeSentence: string | null;
  firstSeenOn: string;
}

export interface BankRound {
  words: BankWordState[];
  /** More words would be due after these (for an optional "5 more"): a yes or a no, never a number. */
  more: boolean;
}

/**
 * The words a round asks: those due today (`due_on <= today`), the longest waiting first, then the
 * weakest, then alphabetical so two reads of the same bank give the same round. A word first met
 * today is due tomorrow, so it is never in today's round.
 */
export function selectBankRound(
  states: readonly BankWordState[],
  todayISO: string,
  size: number = BANK_ROUND_SIZE,
): BankRound {
  const take = Math.max(0, Math.trunc(size));
  const due = states
    .filter((state) => isDue(state, todayISO))
    .sort(
      (a, b) =>
        a.dueOn.localeCompare(b.dueOn) || a.strength - b.strength || a.word.localeCompare(b.word),
    );
  return { words: due.slice(0, take), more: due.length > take };
}

/** How a word stands: just met or just missed (0-1), recalled after a gap (2-3), or recalled after gaps of 1, 3 and 7 days (4-5). */
export type BankBand = "fresh" | "consolidating" | "stable";

export function bankBand(strength: number): BankBand {
  if (strength >= STRONG_STRENGTH) return "stable";
  return strength >= 2 ? "consolidating" : "fresh";
}

export interface BankSummary {
  /** Every word in the bank. */
  total: number;
  stable: number;
  consolidating: number;
  fresh: number;
  /** Words due today (a count for the Home button, never shown as a debt). */
  due: number;
}

export function summarizeBank(states: readonly BankWordState[], todayISO: string): BankSummary {
  const summary: BankSummary = { total: 0, stable: 0, consolidating: 0, fresh: 0, due: 0 };
  for (const state of states) {
    summary.total += 1;
    summary[bankBand(state.strength)] += 1;
    if (isDue(state, todayISO)) summary.due += 1;
  }
  return summary;
}
