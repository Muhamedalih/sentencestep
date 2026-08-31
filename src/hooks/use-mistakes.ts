"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuthUserId } from "@/components/providers/auth-user-provider";
import {
  fetchActiveMistakeCountAction,
  recordSentenceMistakesAction,
} from "@/lib/mistakes/actions";

/**
 * The lightweight, count-only half of "Fix Your Mistakes" — what
 * LessonSession/LessonCompletion need to decide whether the completion
 * screen's primary action should be "Fix Your Mistakes" or "Next lesson".
 * Deliberately never loads the full hydrated queue (see
 * FixYourMistakesSession, which fetches that itself, fresh, only once the
 * learner actually opens the flow) — a lesson-completion screen has no use
 * for per-word sentence context, so there's no reason to pay that query's
 * cost every time this hook mounts.
 *
 * Signed-in only: mistake tracking is tied to a persistent account by
 * design (see the feature's own requirements), so a guest simply never
 * accumulates or sees any — count stays 0 and the completion screen is
 * untouched, exactly as it already was before this feature existed.
 */
export function useMistakes() {
  const userId = useAuthUserId();
  const [count, setCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoaded(false);

    if (!userId) {
      setCount(0);
      setIsLoaded(true);
      return;
    }

    fetchActiveMistakeCountAction()
      .then((next) => {
        if (!cancelled) {
          setCount(next);
          setIsLoaded(true);
        }
      })
      .catch((error: unknown) => {
        // Same reasoning as useProgress/useWordProgress's identical load
        // effects: nothing awaits this, so a dropped connection must land
        // somewhere other than an uncaught rejection.
        if (!cancelled) {
          console.error("[mistakes] fetchActiveMistakeCountAction failed", error);
          setIsLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  /** Batched per completed sentence — see recordSentenceMistakesAction's own doc comment for why this is never called per keystroke. Updates the local count from the server's own response rather than a separate re-fetch. */
  const recordSentenceMistakes = useCallback(
    (sentenceId: string, words: { word: string; errorIndex: number }[]) => {
      if (!userId || words.length === 0) return;
      void recordSentenceMistakesAction(sentenceId, words)
        .then(({ activeCount }) => setCount(activeCount))
        .catch((error: unknown) => {
          console.error("[mistakes] recordSentenceMistakesAction failed", error);
        });
    },
    [userId],
  );

  return { isLoaded, count, recordSentenceMistakes };
}
