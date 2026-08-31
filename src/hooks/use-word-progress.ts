"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuthUserId } from "@/components/providers/auth-user-provider";
import { fetchWordProgressAction, recordWordCompletionAction } from "@/lib/word-progress/actions";
import { readWordProgress, recordWordCompletion } from "@/lib/word-progress/store";
import { emptyWordProgressState } from "@/lib/word-progress/types";
import type { WordProgressState } from "@/lib/word-progress/types";

/**
 * Tracks which vocabulary words a learner has completed. Same signed-in
 * (Supabase) vs guest (localStorage) split as useProgress, but this is
 * its own hook rather than an extension of that one — Word Lists progress
 * has no XP/streak/daily-goal dimension, so folding it into useProgress
 * would mean every lesson-completion caller starts carrying word-list
 * state it never needed.
 */
export function useWordProgress() {
  const userId = useAuthUserId();
  const [state, setState] = useState<WordProgressState>(emptyWordProgressState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoaded(false);

    async function load() {
      const next = userId ? await fetchWordProgressAction() : readWordProgress();
      if (!cancelled) {
        setState(next);
        setIsLoaded(true);
      }
    }

    // Same reasoning as useProgress's identical load effect: a signed-in
    // fetchWordProgressAction() call is a real network request fired on
    // every mount with nothing awaiting it, so a dropped connection or a
    // navigation-aborted request would otherwise surface as an uncaught
    // "Failed to fetch" instead of the graceful degraded state this already
    // falls back to. Silent only when already `cancelled` (a superseded
    // load, or Strict Mode's dev-only double-invoke) — logged when it's
    // still the relevant, current load.
    load().catch((error: unknown) => {
      if (!cancelled) console.error("[word-progress] fetchWordProgressAction failed", error);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const markWordComplete = useCallback(
    (groupId: string, wordId: string) => {
      if (userId) {
        void recordWordCompletionAction(groupId, wordId)
          .then(setState)
          .catch((error: unknown) => {
            console.error("[word-progress] recordWordCompletionAction failed", error);
          });
      } else {
        setState((prev) => recordWordCompletion(prev, wordId));
      }
    },
    [userId],
  );

  const isWordCompleted = useCallback(
    (wordId: string) => state.completedWordIds.includes(wordId),
    [state.completedWordIds],
  );

  const completedCountIn = useCallback(
    (wordIds: string[]) => wordIds.filter((id) => state.completedWordIds.includes(id)).length,
    [state.completedWordIds],
  );

  return {
    isLoaded,
    completedWordIds: state.completedWordIds,
    isWordCompleted,
    completedCountIn,
    markWordComplete,
  };
}
