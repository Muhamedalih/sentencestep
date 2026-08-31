export type LetterState = "correct" | "current" | "error" | "pending";

/**
 * The entire definition of "did the learner type the right character" —
 * pulled out to its own pure function so it has one unambiguous
 * implementation, and so it's directly unit-testable (see typing.test.ts)
 * without needing a rendered <input> or a real KeyboardEvent.
 *
 * Deliberately compares two already-resolved characters, never a
 * KeyboardEvent. `typedChar` must be sourced from a native <input>'s own
 * `value` (see useTypingEngine's onChange handler) — the browser has
 * already turned whatever the learner physically pressed into the actual
 * character their OS/browser keyboard layout produces (this is exactly what
 * `KeyboardEvent.key` also represents — the generated character — as
 * opposed to `KeyboardEvent.code`, which names a physical key position and
 * varies by layout for the same character, or vice versa). Comparing
 * against an <input>'s resolved value rather than a raw key event is what
 * makes this correct for every keyboard layout automatically: a learner on
 * an AZERTY, Arabic, or any other layout whose physical keys don't line up
 * with a US QWERTY still has their real, generated character compared
 * here — not the physical key position that happened to produce it.
 *
 * Case-insensitive by design: the learner is being graded on which letters
 * they typed, not on capitalization — pressing "n" for a target "N" is
 * correct. This only affects the comparison; the target sentence displayed
 * to the learner (and the `typed` buffer itself, which always stores
 * whatever was actually typed — see useTypingEngine) is never mutated or
 * forced to match the target's casing. A genuinely different letter (`b`
 * for an expected `a`) is still rejected — this only forgives case, not
 * identity. Every other character class (spaces, punctuation) goes through
 * the exact same comparison; lower-casing a space or a period is a no-op,
 * so nothing about their exact-match behavior changes.
 */
export function isCorrectChar(target: string, index: number, typedChar: string): boolean {
  return typedChar.toLowerCase() === target.charAt(index).toLowerCase();
}

/**
 * Whether shrinking (or otherwise editing) the typed buffer down to
 * `nextValue` still leaves a genuine prefix of `target` — the guard behind
 * backspace/deletion. A trailing backspace always satisfies this trivially;
 * it also correctly rejects a mid-string edit (clicking into the middle of
 * the input and deleting there) that would otherwise desync the "correct so
 * far" state from what the target sentence actually says at each position.
 *
 * Case-insensitive for the same reason isCorrectChar is: `typed` can
 * legitimately contain a different case than `target` at any position
 * (e.g. the learner typed "n" for a target "N"), so comparing case-sensitively
 * here would wrongly reject a backspace/edit down to text that was itself
 * already accepted as correct.
 */
export function isValidPrefixEdit(target: string, nextValue: string): boolean {
  return target.toLowerCase().startsWith(nextValue.toLowerCase());
}

/**
 * Splits a sentence into word and single-space tokens so word-wrapping only
 * happens between words — each word's letters render inside their own
 * whitespace-nowrap span so long sentences never break mid-word.
 */
export function tokenize(target: string): string[] {
  return target.match(/\S+|\s/g) ?? [];
}

/** Per-character visual state, derived from how much of the target has been typed correctly. */
export function getLetterStates(
  target: string,
  typed: string,
  errorIndex: number | null,
): LetterState[] {
  return target.split("").map((_char, index) => {
    if (errorIndex === index) return "error";
    if (index < typed.length) return "correct";
    if (index === typed.length) return "current";
    return "pending";
  });
}

/**
 * Standard typing-platform convention (Monkeytype, Typing.com): words are
 * defined as 5 characters, so WPM is correct characters typed divided by 5,
 * normalized to a per-minute rate. 0 while no time has elapsed yet (avoids
 * a divide-by-zero spike to Infinity on the very first keystroke).
 */
export function calculateWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return correctChars / 5 / minutes;
}

/** Percentage of keystroke attempts that were correct. 100 with zero attempts — no data yet isn't the same as failing. */
export function calculateAccuracy(correctKeystrokes: number, totalKeystrokes: number): number {
  if (totalKeystrokes <= 0) return 100;
  return (correctKeystrokes / totalKeystrokes) * 100;
}

/**
 * Which word (by index among non-space tokens) the learner is currently
 * on, given how many characters they've correctly typed so far. Landing
 * exactly on a space returns the *next* word — anticipatory, matching "the
 * word about to be typed" rather than the one just finished. Shared by the
 * current-word translation card and the word-level underline so both always
 * agree on the same word.
 */
/**
 * The raw word token containing `charIndex` (e.g. a sentence's own
 * `errorIndex`), plus that token's own start offset within `target` — used
 * to convert a whole-sentence character index into a word-relative one (see
 * TypingSentence's mistake tracking, which needs "which letter within THIS
 * word" for Fix Your Mistakes' red-letter hint, not just which word). Same
 * token boundaries as getCurrentWordIndex (tokenize's non-space runs), but
 * keyed to a literal index rather than "the word about to be typed" — a
 * charIndex landing on a space returns null, since a space is never part of
 * any word.
 */
export function locateWordAtCharIndex(
  target: string,
  charIndex: number,
): { word: string; startOffset: number } | null {
  const tokens = tokenize(target);
  let cumulative = 0;
  for (const token of tokens) {
    const tokenEnd = cumulative + token.length;
    if (charIndex < tokenEnd) {
      return token === " " ? null : { word: token, startOffset: cumulative };
    }
    cumulative = tokenEnd;
  }
  return null;
}

export function getCurrentWordIndex(target: string, typedLength: number): number {
  const tokens = tokenize(target);
  let cumulative = 0;
  let wordIndex = -1;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!;
    const isSpace = token === " ";
    if (!isSpace) wordIndex += 1;

    const tokenEnd = cumulative + token.length;

    if (typedLength < tokenEnd) {
      if (!isSpace) return wordIndex;
      // Currently on a space — anticipate the next word, if there is one.
      const next = tokens.slice(i + 1).find((t) => t !== " ");
      return next ? wordIndex + 1 : wordIndex;
    }

    cumulative = tokenEnd;
  }

  return Math.max(wordIndex, 0);
}
