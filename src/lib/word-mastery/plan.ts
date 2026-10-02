import type { WordOutcome } from "@/lib/word-mastery/schedule";
import type { ReportedOutcome } from "@/lib/word-mastery/types";

/**
 * What recording one word's outcome writes, decided in one place and kept pure
 * so the decision table can be tested without a database. recordWordOutcomeAction
 * runs the plan; nothing else decides which ledger moves.
 *
 * Two ledgers move together:
 *  - the word's SPACED SCHEDULE (word_mastery): clean climbs a step, assisted
 *    holds, missed goes back to 0. "recovered" adds nothing — the miss was
 *    recorded the moment it happened.
 *  - the WEAK-WORD LEDGER (mistakes), which Review All Words, Fix Your Mistakes,
 *    Home and the daily session still read.
 *
 * The rule that matters, and the reason this exists: nothing here ever clears a
 * word from the weak list in one step (the old "master" write). A word missed
 * during a visit and typed right a minute later is CORRECTED — due again
 * tomorrow, still weak until it has passed its reviews.
 */

/** One write to the weak-word ledger. Each is a guarded no-op when the word is not in the state it expects, so they are safe to run blindly in order. */
export type LedgerStep =
  /** record_mistake: the word is (back) in the ledger as an active mistake. */
  | "recordMistake"
  /** Active mistake -> corrected, first review due tomorrow. No-op unless the word is active. */
  | "markCorrected"
  /** A clean review passed: advances a corrected word whose review is due. No-op unless one is due. */
  | "reviewClean";

export interface OutcomePlan {
  /** The outcome to record on the schedule, or null when the schedule is left alone. */
  schedule: WordOutcome | null;
  /** Writes to the weak-word ledger, in order. Empty for a word too trivial to track. */
  ledger: readonly LedgerStep[];
}

export function planOutcome(outcome: ReportedOutcome, trackable: boolean): OutcomePlan {
  switch (outcome) {
    case "missed":
      return { schedule: "missed", ledger: trackable ? ["recordMistake"] : [] };
    case "recovered":
      // The miss is already on the schedule; the word is only corrected now.
      return { schedule: null, ledger: trackable ? ["markCorrected"] : [] };
    case "assisted":
      // Needing a hint is not recall: the word enters (or restarts) the weak
      // list like a miss, already corrected so it is re-checked tomorrow.
      return {
        schedule: "assisted",
        ledger: trackable ? ["recordMistake", "markCorrected"] : [],
      };
    case "clean":
      // Corrects an active mistake, or advances a due review; nothing else.
      return { schedule: "clean", ledger: trackable ? ["markCorrected", "reviewClean"] : [] };
  }
}
