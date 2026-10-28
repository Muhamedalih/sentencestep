/**
 * What one answer means for the rule it tested, and what a whole card says about the rule.
 *
 * - clean: typed right at once, with no help.
 * - assisted: right after a wrong try, or with the first letter given.
 * - missed: wrong twice (the answer is shown; the rule comes back tomorrow).
 */

import type { RuleOutcome } from "./schedule";

export interface ItemResult {
  /** Whether the learner ended on the right form. */
  correct: boolean;
  /** Wrong tries before the right one (or before giving up). */
  wrongTries: number;
  /** Whether the first letter was shown. */
  hinted: boolean;
}

export function itemOutcome(result: ItemResult): RuleOutcome {
  if (!result.correct) return "missed";
  return result.wrongTries === 0 && !result.hinted ? "clean" : "assisted";
}

/** The rule's outcome for one visit: any miss is a miss, otherwise any help is assisted, otherwise clean. */
export function ruleOutcome(outcomes: readonly RuleOutcome[]): RuleOutcome {
  if (outcomes.includes("missed")) return "missed";
  if (outcomes.includes("assisted")) return "assisted";
  return "clean";
}
