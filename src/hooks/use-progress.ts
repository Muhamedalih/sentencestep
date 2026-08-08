"use client";

import { useCallback, useEffect, useState } from "react";

import type { LearningMode } from "@/types/content";

const STORAGE_KEY = "looma:progress:v1";

type ProgressMap = Record<LearningMode, string[]>;

const emptyProgress: ProgressMap = { normal: [], stories: [], conversation: [] };

function readProgress(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress;
    const parsed = JSON.parse(raw) as Partial<ProgressMap>;
    return {
      normal: parsed.normal ?? [],
      stories: parsed.stories ?? [],
      conversation: parsed.conversation ?? [],
    };
  } catch {
    return emptyProgress;
  }
}

/**
 * Tracks completed lessons in localStorage. There's no account system yet, so
 * this is the whole persistence layer for now — swap for a Supabase-backed
 * store once auth lands without changing the hook's public shape.
 */
export function useProgress() {
  const [progress, setProgress] = useState<ProgressMap>(emptyProgress);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setProgress(readProgress());
    setIsLoaded(true);
  }, []);

  const markComplete = useCallback((mode: LearningMode, lessonId: string) => {
    setProgress((prev) => {
      if (prev[mode].includes(lessonId)) return prev;
      const next: ProgressMap = { ...prev, [mode]: [...prev[mode], lessonId] };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isCompleted = useCallback(
    (mode: LearningMode, lessonId: string) => progress[mode].includes(lessonId),
    [progress],
  );

  return { progress, isLoaded, isCompleted, markComplete };
}
