/**
 * What the Word Lists practice screens need to know when "Smart word practice"
 * is open to the learner. Client-safe (no server imports): the pages work it out
 * on the server (see getSmartWordsAccess) and pass it down as one small prop —
 * `null`/absent means the screen behaves exactly as it always has.
 */

export interface SmartPracticeConfig {
  /** The learner has an account, so the schedule (strength, due words) is stored and reported. False for a guest, who still gets every practice upgrade. */
  spaced: boolean;
}

/**
 * The pauses of the upgraded answer screens, in milliseconds. Shorter than the
 * original ones where they were only something to wait out (the missed-word
 * screen): letters typed while a word settles are kept for the next one, and
 * that screen can be skipped with Enter once the right spelling has been shown.
 * A right answer is the opposite: its pause is the celebration, so it is longer
 * than it was, and a learner who is already typing the next word still ends it
 * at once.
 */
export const SMART_TIMING = {
  /** A right answer's celebration (the word turning green and settling into the sentence) before the next word. */
  correctDelayMs: 700,
  /** How long the pop of that celebration takes. */
  correctPopMs: 400,
  /** A right answer typed with an accepted alternate stays long enough to read "also correct". */
  alternateDelayMs: 1600,
  /** The wrong attempt's green/red diff, before the right spelling rises in. */
  diffVisibleMs: 600,
  /** The right spelling, fully shown, before it dissolves. */
  revealHoldMs: 1200,
  /** After it has dissolved, before the next word. */
  revealTailMs: 150,
  /** A hint's repair, part one: the letters that are wrong crumble away (with nothing wrong to remove it is the same wait, as the star flies to the bulb). */
  hintCrumbleMs: 500,
  /** A hint's repair, part two: the right letter is restored in their place. The two parts take one second. */
  hintRestoreMs: 500,
} as const;

export type SmartTiming = typeof SMART_TIMING;
