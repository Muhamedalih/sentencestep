"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type RefObject,
} from "react";

import {
  calculateAccuracy,
  calculateWpm,
  getLetterStates,
  isCorrectChar,
  isValidPrefixEdit,
} from "@/lib/typing";
import type { LetterState } from "@/lib/typing";

/** How often the live WPM display re-computes while a sentence is actively being typed, purely to keep it ticking between keystrokes — see the effect below. */
const STATS_TICK_MS = 250;

interface UseTypingEngineOptions {
  /** The sentence the learner is typing. */
  target: string;
  /** Changing this resets the engine — pass the sentence id, not the text. */
  resetKey: string;
  /** Called with this sentence's final WPM, computed from the same refs `wpm` below reads live — never a stale render-cycle value, since it fires from a timeout after `completeDelayMs`. */
  onComplete?: (wpm: number) => void;
  onCorrectChar?: () => void;
  onErrorChar?: () => void;
  /** Delay before onComplete fires, so the final correct character is visible first. */
  completeDelayMs?: number;
  /** How long a wrong character stays visible (as `errorIndex`/`errorChar`) before the engine clears it and the learner can try again. */
  errorDelayMs?: number;
  /**
   * Supply this to hold a stable reference to the input from *outside* the
   * component that calls this hook — e.g. a parent that renders a replay
   * button and needs to refocus the input after the click steals focus
   * (see PronunciationButton's `inputRef` prop), when the engine itself is
   * owned by a child component that remounts (VocabularySentence, once per
   * word). Defaults to an internally-created ref, identical to today's
   * behavior, for every other caller.
   */
  inputRef?: RefObject<HTMLInputElement | null>;
}

/**
 * Reusable character-by-character typing engine shared by every lesson mode
 * (normal, stories, conversation). Compares input against `target` one
 * character at a time — a wrong keystroke is rejected outright (never
 * accepted into the buffer), so the correct-position never advances on bad
 * input. Backspace works naturally since it only ever shrinks a validated
 * prefix. Presentation lives entirely outside this hook.
 */
export function useTypingEngine({
  target,
  resetKey,
  onComplete,
  onCorrectChar,
  onErrorChar,
  completeDelayMs = 350,
  errorDelayMs = 300,
  inputRef: externalInputRef,
}: UseTypingEngineOptions) {
  const [typed, setTyped] = useState("");
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const [errorChar, setErrorChar] = useState<string | null>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalInputRef;
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const completedRef = useRef(false);

  // Per-sentence WPM/accuracy — reset alongside everything else on resetKey
  // change, same as the rest of this hook's state (see the reset effect
  // below). startTimeRef is set lazily on the first keystroke, not on
  // mount, so time spent reading the sentence before typing never counts
  // against WPM.
  const startTimeRef = useRef<number | null>(null);
  const correctKeystrokesRef = useRef(0);
  const totalKeystrokesRef = useRef(0);
  const [, setStatsTick] = useState(0);

  // Reset cleanly whenever we move to a new sentence.
  useEffect(() => {
    setTyped("");
    setErrorIndex(null);
    setErrorChar(null);
    completedRef.current = false;
    clearTimeout(errorTimeoutRef.current);
    clearTimeout(completeTimeoutRef.current);
    startTimeRef.current = null;
    correctKeystrokesRef.current = 0;
    totalKeystrokesRef.current = 0;
    inputRef.current?.focus();
  }, [resetKey, inputRef]);

  useEffect(() => {
    return () => {
      clearTimeout(errorTimeoutRef.current);
      clearTimeout(completeTimeoutRef.current);
    };
  }, []);

  // Typing always wins the keyboard, no matter what was last clicked —
  // the replay button, a word (for its pronunciation), the speed control,
  // anything. Without this, a keystroke fired right after any of those
  // clicks lands on whatever element happens to still be focused (a
  // <button> swallows character keys silently) instead of the sentence
  // input, forcing an extra click back onto the input before typing can
  // continue — exactly the interruption this hook exists to avoid.
  // Listening at the document level (not on the input itself) is what lets
  // this reach regardless of which element the browser last focused.
  // Deliberately narrow about which keydowns it acts on: real character
  // keys and Backspace only (event.key.length === 1 covers letters,
  // digits, punctuation, and space — never "Enter"/"Tab"/"ArrowLeft"/etc,
  // whose length is > 1), skipping modifier combos (so Ctrl/Cmd shortcuts
  // like copy/paste/refresh still reach the browser) and IME composition
  // (isComposing) so this never fights an active East-Asian input method.
  // Refocusing during the keydown phase — before the browser's own default
  // action for that key runs — is what lets the very same keystroke that
  // triggered the refocus land in the input instead of being lost.
  useEffect(() => {
    function handleGlobalKeydown(event: KeyboardEvent) {
      if (completedRef.current) return;
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      if (event.key.length !== 1 && event.key !== "Backspace") return;

      const active = document.activeElement;
      if (active === inputRef.current) return;
      // Never steal focus from a genuine text-entry control elsewhere on
      // the page (there isn't one on this screen today, but this is what
      // keeps that true if one is ever added nearby).
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      ) {
        return;
      }

      inputRef.current?.focus();
    }

    document.addEventListener("keydown", handleGlobalKeydown);
    return () => document.removeEventListener("keydown", handleGlobalKeydown);
  }, [inputRef]);

  // Forces a re-render every STATS_TICK_MS while the sentence is actively
  // being typed, purely so the WPM figure keeps visibly ticking between
  // keystrokes (elapsed time keeps moving even when typed doesn't) — not
  // needed for correctness, only for the live-feeling display.
  useEffect(() => {
    if (!startTimeRef.current || completedRef.current) return;
    const interval = setInterval(() => setStatsTick((n) => n + 1), STATS_TICK_MS);
    return () => clearInterval(interval);
  }, [typed]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      // Once a sentence is done, ignore stray input until the next one resets us.
      if (completedRef.current) return;

      const value = event.target.value;
      if (startTimeRef.current === null) startTimeRef.current = Date.now();

      if (value.length <= typed.length) {
        // A trailing backspace always leaves a valid prefix of `target`, but a
        // native input also allows placing the cursor mid-string and deleting
        // there — which can produce a `value` that's no longer a prefix at
        // all. Only accept the edit when it still is; otherwise ignore it and
        // let the controlled input snap back to the last valid `typed` state,
        // so `typed.length` positions never silently stop matching `target`.
        if (isValidPrefixEdit(target, value)) {
          setTyped(value);
          setErrorIndex(null);
          setErrorChar(null);
        }
        return;
      }

      // Only ever examine the single next character — protects against
      // paste/autofill/IME handing us more than one new character at once.
      // `nextChar` is read from the <input>'s own resolved value, i.e. the
      // real character the learner's active keyboard layout generated —
      // see isCorrectChar's doc comment for why that's the only correct
      // thing to compare against a KeyboardEvent-derived value.
      const nextChar = value.charAt(typed.length);

      totalKeystrokesRef.current += 1;

      if (isCorrectChar(target, typed.length, nextChar)) {
        correctKeystrokesRef.current += 1;
        const updated = typed + nextChar;
        setTyped(updated);
        setErrorIndex(null);
        setErrorChar(null);
        onCorrectChar?.();

        if (updated.length === target.length) {
          completedRef.current = true;
          completeTimeoutRef.current = setTimeout(() => {
            const finalElapsedMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
            onComplete?.(calculateWpm(correctKeystrokesRef.current, finalElapsedMs));
          }, completeDelayMs);
        }
      } else {
        setErrorIndex(typed.length);
        setErrorChar(nextChar);
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = setTimeout(() => {
          setErrorIndex(null);
          setErrorChar(null);
        }, errorDelayMs);
        onErrorChar?.();
      }
    },
    [typed, target, onCorrectChar, onErrorChar, onComplete, completeDelayMs, errorDelayMs],
  );

  const handlePaste = useCallback((event: ClipboardEvent<HTMLInputElement>) => {
    // Typing is the point — block pasting the answer in wholesale.
    event.preventDefault();
  }, []);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  const letterStates: LetterState[] = useMemo(
    () => getLetterStates(target, typed, errorIndex),
    [target, typed, errorIndex],
  );

  const elapsedMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
  const wpm = calculateWpm(correctKeystrokesRef.current, elapsedMs);
  const accuracy = calculateAccuracy(correctKeystrokesRef.current, totalKeystrokesRef.current);

  return {
    typed,
    errorIndex,
    errorChar,
    isComplete: typed.length === target.length,
    letterStates,
    inputRef,
    handleChange,
    handlePaste,
    focus,
    wpm,
    accuracy,
  };
}
