import type { Transition } from "framer-motion";

import { easeOut } from "@/lib/motion";

/**
 * The "premium" way a word is shown to the learner on request or after a miss:
 * each letter rises onto its line and comes into focus, one after another (a
 * springy overshoot as it lands), and when the word has been up long enough the
 * letters float up and dissolve in the same order.
 *
 * Shared so Dictation's Show the word and Word Lists' correct-answer reveal
 * (VocabularySentence) look and feel identical — change it here and both move.
 */

/** A letter at rest on its line. */
export const GLYPH_SHOWN = { opacity: 1, scale: 1, y: "0em", filter: "blur(0px)" };
/** A letter not yet there: small, low and out of focus. */
export const GLYPH_HIDDEN = { opacity: 0, scale: 0.6, y: "0.18em", filter: "blur(3px)" };
/** A letter that has been up and is leaving: it floats up and dissolves. */
export const GLYPH_PEEK_OUT = { opacity: 0, scale: 0.9, y: "-0.14em", filter: "blur(6px)" };

/** The lit look of a letter that is being shown: the primary colour with a soft halo that comes and goes with the letter. */
export const PEEK_LIT_CLASS =
  "text-[var(--lesson-primary)] [text-shadow:0_0_0.45em_color-mix(in_oklch,var(--lesson-primary)_50%,transparent)]";

/** The stagger is measured from the word's first letter and capped, so a long word still takes well under half a second. */
const PEEK_STAGGER_IN = 0.035;
const PEEK_STAGGER_OUT = 0.03;
const PEEK_MAX_STAGGER_IN = 0.24;
const PEEK_MAX_STAGGER_OUT = 0.18;

/** How long a single letter takes to settle once it starts rising in (spring + focus), and to dissolve once it starts leaving. */
const PEEK_IN_SETTLE_MS = 420;
const PEEK_OUT_DURATION_MS = 340;

/** Seconds the letter at `index` waits before it rises in. */
export function peekInDelay(index: number): number {
  return Math.min(index * PEEK_STAGGER_IN, PEEK_MAX_STAGGER_IN);
}

/** Seconds the letter at `index` waits before it leaves. */
export function peekOutDelay(index: number): number {
  return Math.min(index * PEEK_STAGGER_OUT, PEEK_MAX_STAGGER_OUT);
}

/** The transition of a letter rising in. Opacity and focus settle on their own (a spring would overshoot them into nonsense). */
export function peekInTransition(index: number): Transition {
  const delay = peekInDelay(index);
  return {
    default: { type: "spring", stiffness: 420, damping: 21, mass: 0.7, delay },
    opacity: { duration: 0.2, delay },
    filter: { duration: 0.32, ease: easeOut, delay },
  };
}

/** The transition of a letter leaving. */
export function peekOutTransition(index: number): Transition {
  return {
    duration: PEEK_OUT_DURATION_MS / 1000,
    ease: [0.4, 0, 0.7, 1],
    delay: peekOutDelay(index),
  };
}

/** Milliseconds from the first letter starting to rise until the last of `letterCount` letters has settled. */
export function peekInTotalMs(letterCount: number): number {
  if (letterCount <= 0) return 0;
  return Math.round(peekInDelay(letterCount - 1) * 1000) + PEEK_IN_SETTLE_MS;
}

/** Milliseconds from the first letter starting to leave until the last of `letterCount` letters is gone. */
export function peekOutTotalMs(letterCount: number): number {
  if (letterCount <= 0) return 0;
  return Math.round(peekOutDelay(letterCount - 1) * 1000) + PEEK_OUT_DURATION_MS;
}
