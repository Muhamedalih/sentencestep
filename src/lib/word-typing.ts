/**
 * Small pure helpers behind the Word Lists typing engine (useWordTypingEngine)
 * so the rules that are easy to get subtly wrong can be unit-tested without a
 * browser.
 */

/**
 * The letters typed ON TOP of `previous`: `next` is `previous` with something
 * added at the end. Anything else (a deletion, an edit in the middle, the same
 * text) is not typing ahead and gives "".
 */
export function appendedChars(previous: string, next: string): string {
  return next.length > previous.length && next.startsWith(previous)
    ? next.slice(previous.length)
    : "";
}

/**
 * Keeps a hinted first letter where it was put: whatever the learner does, the
 * answer still starts with `prefix`. (Comparison ignores case; the learner's own
 * casing is kept when it already starts with it.)
 */
export function keepPrefix(value: string, prefix: string): string {
  if (!prefix) return value;
  return value.toLowerCase().startsWith(prefix.toLowerCase()) ? value : prefix;
}

/** The most letters one carry-over keeps — a hand resting on the keyboard must not fill the next word. */
export const MAX_TYPE_AHEAD = 24;

/**
 * Letters typed while one word settles are not lost: they wait here and the
 * next word picks them up. The practice screen owns one of these (the word
 * itself remounts for every question, so it cannot hold them) and hands it to
 * each word's typing engine.
 */
export interface TypeAheadBuffer {
  /** Adds letters typed ahead. */
  hold: (chars: string) => void;
  /** Hands over everything waiting and empties the buffer. */
  take: () => string;
  /** Throws it away (a block summary or the finish screen is not a word). */
  clear: () => void;
}

export function createTypeAheadBuffer(max: number = MAX_TYPE_AHEAD): TypeAheadBuffer {
  let held = "";
  return {
    hold(chars) {
      held = (held + chars).slice(0, max);
    },
    take() {
      const taken = held;
      held = "";
      return taken;
    },
    clear() {
      held = "";
    },
  };
}
