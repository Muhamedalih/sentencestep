"use client";

import { useCallback, useRef, useState } from "react";

import type { WordAttempt } from "@/lib/word-mastery/schedule";

const FRESH: WordAttempt = { missed: false, hinted: false };

/**
 * What the learner has done with each word during this visit: whether it has
 * been missed (a wrong answer or "I don't know") and whether the first-letter
 * hint was used. The practice screen's words remount for every question, and a
 * missed word comes back later in the same visit, so this lives above them.
 *
 * A ref-backed map with a version counter: the reads in event handlers and
 * timeouts are always current, and the counter re-renders the screen (the help
 * bar's stars) when something changes.
 */
export function useWordAttempts() {
  const attempts = useRef(new Map<string, WordAttempt>());
  const [version, setVersion] = useState(0);

  const get = useCallback(
    (wordId: string): WordAttempt => attempts.current.get(wordId) ?? FRESH,
    [],
  );

  const update = useCallback((wordId: string, patch: Partial<WordAttempt>) => {
    attempts.current.set(wordId, { ...(attempts.current.get(wordId) ?? FRESH), ...patch });
    setVersion((current) => current + 1);
  }, []);

  const reset = useCallback(() => {
    attempts.current = new Map();
    setVersion((current) => current + 1);
  }, []);

  return { get, update, reset, version };
}
