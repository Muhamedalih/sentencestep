"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";

export type WordAttemptStatus = "pending" | "correct" | "incorrect";

/** Extra characters allowed past the target's own length — generous enough for any realistic wrong guess, just a sanity cap on the native input. */
const MAX_EXTRA_CHARS = 8;

interface UseWordTypingEngineOptions {
  /** The single word being learned. */
  target: string;
  /** Changing this resets the engine — pass the word's id/targetWord, not e.g. an index. */
  resetKey: string;
  /**
   * Fires once this word's attempt is settled — `true` the instant the
   * buffer exactly matches `target` (no Enter required), `false` once the
   * learner presses Enter on anything that doesn't. Fired from a timeout
   * (see correctDelayMs/incorrectDelayMs) so the final visual state is
   * fully played out first.
   */
  onResult: (correct: boolean) => void;
  /** Delay before onResult(true) fires, so the settled green state is visible before advancing. */
  correctDelayMs?: number;
  /**
   * Delay before onResult(false) fires — deliberately much longer than
   * correctDelayMs by default: it has to cover the wrong attempt's own
   * green/red diff AND the correct-answer reveal animation that plays
   * after it (see VocabularySentence's DIFF_VISIBLE_MS/REVEAL_LETTER_MS),
   * not just a quick color flash.
   */
  incorrectDelayMs?: number;
  /** Same rationale as useTypingEngine's identical option — an externally owned, stable ref for a parent's replay button to refocus after a click. */
  inputRef?: RefObject<HTMLInputElement | null>;
}

/**
 * Word Lists' typing engine — deliberately NOT useTypingEngine. Every other
 * lesson mode rejects a wrong keystroke outright (it never enters the
 * buffer), which is the right feel for "copy what you see." Word Lists is a
 * recall exercise instead: the learner produces the word from memory, so a
 * wrong guess has to actually land on screen to be graded, not vanish
 * before it's felt. Letters accumulate freely here; grading happens either
 * automatically (an exact match) or on Enter (anything else), never per
 * keystroke.
 */
export function useWordTypingEngine({
  target,
  resetKey,
  onResult,
  correctDelayMs = 550,
  incorrectDelayMs = 550,
  inputRef: externalInputRef,
}: UseWordTypingEngineOptions) {
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState<WordAttemptStatus>("pending");
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalInputRef;
  const resultTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Guards against a second grading firing while the current one's timeout
  // is still pending (e.g. a stray keystroke or Enter after the buffer's
  // already settled) — mirrors useTypingEngine's completedRef.
  const settledRef = useRef(false);
  const maxLength = target.length + MAX_EXTRA_CHARS;

  useEffect(() => {
    setTyped("");
    setStatus("pending");
    settledRef.current = false;
    clearTimeout(resultTimeoutRef.current);
    inputRef.current?.focus();
  }, [resetKey, inputRef]);

  useEffect(() => {
    return () => clearTimeout(resultTimeoutRef.current);
  }, []);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (settledRef.current) return;
      const value = event.target.value.slice(0, maxLength);
      setTyped(value);

      if (value.length > 0 && value.toLowerCase() === target.toLowerCase()) {
        settledRef.current = true;
        setStatus("correct");
        resultTimeoutRef.current = setTimeout(() => onResult(true), correctDelayMs);
      }
    },
    [target, maxLength, onResult, correctDelayMs],
  );

  const submit = useCallback(() => {
    // Reaching here with an exact match is impossible — handleChange already
    // settles that case the instant it happens — so any submit that gets
    // this far is necessarily wrong.
    if (settledRef.current || typed.length === 0) return;
    settledRef.current = true;
    setStatus("incorrect");
    resultTimeoutRef.current = setTimeout(() => {
      onResult(false);
      // Self-heal rather than relying solely on the caller's resetKey
      // changing: a caller whose queue narrows to exactly this one
      // outstanding word (see WordReviewSession) requeues it right back to
      // the front, so `target`/`resetKey` end up identical to what they
      // already were — the [resetKey] effect above never re-fires, and
      // without this, settledRef would stay true forever, silently
      // swallowing every further keystroke.
      setTyped("");
      setStatus("pending");
      settledRef.current = false;
    }, incorrectDelayMs);
  }, [typed, onResult, incorrectDelayMs]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      submit();
    },
    [submit],
  );

  const handlePaste = useCallback((event: ClipboardEvent<HTMLInputElement>) => {
    // Recall is the point — block pasting the answer in wholesale.
    event.preventDefault();
  }, []);

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  return { typed, status, inputRef, handleChange, handleKeyDown, handlePaste, focus };
}
