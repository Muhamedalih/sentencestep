"use client";

import { useCallback, useEffect, useState } from "react";

import { readProgress, recordCompletion } from "@/lib/progress/store";
import { emptyProgressState } from "@/lib/progress/types";
import type { ProgressState } from "@/lib/progress/types";
import type { LearningMode } from "@/types/content";

/**
 * Tracks lesson completions and streak in localStorage. There's no account
 * system yet, so this is the whole persistence layer for now — see
 * src/lib/supabase/queries/progress.ts for the Supabase-backed counterpart
 * this hook swaps to once auth lands.
 */
export function useProgress() {
  const [state, setState] = useState<ProgressState>(emptyProgressState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setState(readProgress());
    setIsLoaded(true);
  }, []);

  const markComplete = useCallback((mode: LearningMode, lessonId: string, accuracy: number) => {
    setState((prev) => recordCompletion(prev, mode, lessonId, accuracy));
  }, []);

  const getCompletedIds = useCallback(
    (mode: LearningMode) =>
      state.completions.filter((entry) => entry.mode === mode).map((entry) => entry.lessonId),
    [state.completions],
  );

  const isCompleted = useCallback(
    (mode: LearningMode, lessonId: string) =>
      state.completions.some((entry) => entry.mode === mode && entry.lessonId === lessonId),
    [state.completions],
  );

  return {
    isLoaded,
    completions: state.completions,
    streak: state.streak,
    isCompleted,
    getCompletedIds,
    markComplete,
  };
}
