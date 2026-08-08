import { updateStreak } from "@/lib/progress/streak";
import { emptyProgressState } from "@/lib/progress/types";
import type { LessonCompletion, ProgressState } from "@/lib/progress/types";
import type { LearningMode } from "@/types/content";

const STORAGE_KEY = "looma:progress:v2";

export function readProgress(): ProgressState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgressState;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      completions: parsed.completions ?? [],
      streak: parsed.streak ?? emptyProgressState.streak,
    };
  } catch {
    return emptyProgressState;
  }
}

function writeProgress(state: ProgressState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Records (or updates) a lesson completion and advances the streak. */
export function recordCompletion(
  state: ProgressState,
  mode: LearningMode,
  lessonId: string,
  accuracy: number,
): ProgressState {
  const completion: LessonCompletion = {
    lessonId,
    mode,
    accuracy,
    completedAt: new Date().toISOString(),
  };

  const withoutExisting = state.completions.filter((entry) => entry.lessonId !== lessonId);

  const next: ProgressState = {
    completions: [...withoutExisting, completion],
    streak: updateStreak(state.streak),
  };

  writeProgress(next);
  return next;
}
