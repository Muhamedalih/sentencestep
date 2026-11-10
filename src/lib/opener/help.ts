/**
 * The two small helps of the opening lesson (permission openerHelp), as pure rules the lesson screen
 * and the tests share:
 *  - the keyboard-language hint: a learner whose keyboard is still on Arabic types Arabic letters, every
 *    one of them is wrong, and today the letter just flashes red with no reason. After two wrong
 *    keystrokes in a row that are both Arabic letters a line says why; it goes away at the next right
 *    letter, and shows at most twice in a lesson.
 *  - the audio-failed note: a quiet line, with a try-again button, when the sentence's sound could not
 *    be played by any of the existing ways.
 */

/** Wrong keystrokes in a row, all Arabic letters, before the keyboard hint appears. */
export const KEYBOARD_HINT_RUN = 2;
/** The most times the keyboard hint appears in one lesson. */
export const KEYBOARD_HINT_MAX = 2;

/** Whether a typed character is an Arabic letter (the Arabic script's letters, not punctuation or digits). */
export function isArabicLetter(char: string): boolean {
  return /^\p{Script=Arabic}$/u.test(char) && /^\p{L}$/u.test(char);
}

export interface KeyboardHintState {
  /** Wrong Arabic letters in a row so far. */
  run: number;
  /** The hint is on screen now. */
  visible: boolean;
  /** How many times it has appeared in this lesson. */
  shown: number;
}

export const INITIAL_KEYBOARD_HINT: KeyboardHintState = { run: 0, visible: false, shown: 0 };

export type KeyboardHintKey = { type: "wrong"; char: string } | { type: "correct" };

/**
 * The hint's state after one more keystroke. A wrong Arabic letter adds to the run (and shows the hint
 * when the run reaches two, if it has not already appeared twice); a wrong key that is not an Arabic
 * letter is an ordinary typo and breaks the run; a right letter hides the hint and clears the run.
 * Returns the same object when nothing changed, so a caller can skip the re-render.
 */
export function advanceKeyboardHint(
  state: KeyboardHintState,
  key: KeyboardHintKey,
): KeyboardHintState {
  if (key.type === "correct") {
    return state.run === 0 && !state.visible ? state : { ...state, run: 0, visible: false };
  }
  if (!isArabicLetter(key.char)) {
    return state.run === 0 ? state : { ...state, run: 0 };
  }
  const run = state.run + 1;
  if (!state.visible && run >= KEYBOARD_HINT_RUN && state.shown < KEYBOARD_HINT_MAX) {
    return { run, visible: true, shown: state.shown + 1 };
  }
  return { ...state, run };
}

/** What a speech error means for the audio-failed note: an utterance that was cut off on purpose (a new one started, the page left) or blocked until a tap (autoplay) is not a failure. */
export function isSpeechFailure(error: string | undefined): boolean {
  return error !== "interrupted" && error !== "canceled" && error !== "not-allowed";
}
