import type { DictationResult } from "@/lib/features/dictation";

/**
 * Sentence bank: what the test says about a typed answer. Pure. The verdict is already known (right
 * or not — only a sentence typed right moves the schedule up); this only chooses the words around it,
 * so a sentence one letter away is told so instead of being met with the same line as one that was
 * far off. Calm on purpose: no score, no "wrong", never more than a short line.
 */

/** Up to this many wrong or missing letters counts as "close". */
export const CLOSE_LETTERS_MAX = 3;

export type AnswerFeedback =
  /** Every word typed right. */
  | { kind: "exact" }
  /** A few letters away: wrong, missing or extra letters added up across the sentence. */
  | { kind: "close"; letters: number }
  /** Further off than that. */
  | { kind: "off" }
  /** The learner pressed "I don't remember". */
  | { kind: "gaveUp" };

export function answerFeedback(
  result: Pick<DictationResult, "exact" | "errorChars">,
  gaveUp: boolean,
): AnswerFeedback {
  if (gaveUp) return { kind: "gaveUp" };
  if (result.exact) return { kind: "exact" };
  if (result.errorChars >= 1 && result.errorChars <= CLOSE_LETTERS_MAX) {
    return { kind: "close", letters: result.errorChars };
  }
  return { kind: "off" };
}
