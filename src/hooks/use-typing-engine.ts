"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
} from "react";

import { getLetterStates } from "@/lib/typing";
import type { LetterState } from "@/lib/typing";

interface UseTypingEngineOptions {
  /** The sentence the learner is typing. */
  target: string;
  /** Changing this resets the engine — pass the sentence id, not the text. */
  resetKey: string;
  onComplete?: () => void;
  onCorrectChar?: () => void;
  onErrorChar?: () => void;
  /** Delay before onComplete fires, so the final correct character is visible first. */
  completeDelayMs?: number;
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
}: UseTypingEngineOptions) {
  const [typed, setTyped] = useState("");
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const completedRef = useRef(false);

  // Reset cleanly whenever we move to a new sentence.
  useEffect(() => {
    setTyped("");
    setErrorIndex(null);
    completedRef.current = false;
    clearTimeout(errorTimeoutRef.current);
    clearTimeout(completeTimeoutRef.current);
    inputRef.current?.focus();
  }, [resetKey]);

  useEffect(() => {
    return () => {
      clearTimeout(errorTimeoutRef.current);
      clearTimeout(completeTimeoutRef.current);
    };
  }, []);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      // Once a sentence is done, ignore stray input until the next one resets us.
      if (completedRef.current) return;

      const value = event.target.value;

      if (value.length <= typed.length) {
        setTyped(value);
        setErrorIndex(null);
        return;
      }

      // Only ever examine the single next character — protects against
      // paste/autofill/IME handing us more than one new character at once.
      const nextChar = value.charAt(typed.length);
      const expected = target.charAt(typed.length);

      if (nextChar === expected) {
        const updated = typed + nextChar;
        setTyped(updated);
        setErrorIndex(null);
        onCorrectChar?.();

        if (updated.length === target.length) {
          completedRef.current = true;
          completeTimeoutRef.current = setTimeout(() => onComplete?.(), completeDelayMs);
        }
      } else {
        setErrorIndex(typed.length);
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = setTimeout(() => setErrorIndex(null), 300);
        onErrorChar?.();
      }
    },
    [typed, target, onCorrectChar, onErrorChar, onComplete, completeDelayMs],
  );

  const handlePaste = useCallback((event: ClipboardEvent<HTMLInputElement>) => {
    // Typing is the point — block pasting the answer in wholesale.
    event.preventDefault();
  }, []);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const letterStates: LetterState[] = useMemo(
    () => getLetterStates(target, typed, errorIndex),
    [target, typed, errorIndex],
  );

  return {
    typed,
    errorIndex,
    isComplete: typed.length === target.length,
    letterStates,
    inputRef,
    handleChange,
    handlePaste,
    focus,
  };
}
