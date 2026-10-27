/**
 * Words bank: the form a word is asked in, by how strong it is. The stronger the word, the less the
 * screen gives away:
 *
 *  - `meaning`  strength 0-1: the meaning in the learner's language and a sentence with the word left
 *    out (the Word Lists exercise as it is today).
 *  - `context`  strength 2-3: the word in ANOTHER sentence of the catalog, without the Arabic.
 *  - `audio`    strength 4-5: only the word's recorded clip, and the learner types it.
 *
 * A form that cannot be built for a word (no other sentence holds it, no recorded clip) steps down
 * one form instead of falling back to the browser's voice or to a generated clip. Pure.
 */
export type BankForm = "meaning" | "context" | "audio";

export interface BankFormAvailability {
  /** Another sentence of the catalog holds the word (not its home sentence). */
  otherSentence: boolean;
  /** A recorded clip of the word exists. */
  clip: boolean;
}

export function bankFormFor(strength: number, available: BankFormAvailability): BankForm {
  if (strength >= 4) {
    if (available.clip) return "audio";
    return available.otherSentence ? "context" : "meaning";
  }
  if (strength >= 2) return available.otherSentence ? "context" : "meaning";
  return "meaning";
}
