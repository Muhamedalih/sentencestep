/**
 * What the Word Lists practice screens need to know when "Smart word practice"
 * is open to the learner. Client-safe (no server imports): the pages work it out
 * on the server (see getSmartWordsAccess) and pass it down as one small prop —
 * `null`/absent means the screen behaves exactly as it always has.
 */

/** recall: the word stays silent until the attempt (the answer is not given away). listen: the word is spoken first and the learner types what they hear. */
export const PRACTICE_MODES = ["recall", "listen"] as const;
export type PracticeMode = (typeof PRACTICE_MODES)[number];

export function parsePracticeMode(value: unknown): PracticeMode {
  return value === "listen" ? "listen" : "recall";
}

export interface SmartPracticeConfig {
  /** The learner has an account, so the schedule (strength, due words) is stored and reported. False for a guest, who still gets every practice upgrade. */
  spaced: boolean;
  mode: PracticeMode;
}

/**
 * The pauses of the upgraded answer screens, in milliseconds. Shorter than the
 * original ones on purpose: nothing is lost by moving on sooner any more —
 * letters typed while a word settles are kept for the next one, and the
 * missed-word screen can be skipped with Enter once the right spelling has been
 * shown — so a pause is only there to be read, not to be waited out.
 */
export const SMART_TIMING = {
  /** The green flash of a right answer before the next word. */
  correctDelayMs: 350,
  /** A right answer typed with an accepted alternate stays long enough to read "also correct". */
  alternateDelayMs: 1600,
  /** The wrong attempt's green/red diff, before the right spelling rises in. */
  diffVisibleMs: 600,
  /** The right spelling, fully shown, before it dissolves. */
  revealHoldMs: 1200,
  /** After it has dissolved, before the next word. */
  revealTailMs: 150,
} as const;

export type SmartTiming = typeof SMART_TIMING;
