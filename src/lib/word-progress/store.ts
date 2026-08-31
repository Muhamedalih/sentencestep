import { emptyWordProgressState } from "@/lib/word-progress/types";
import type { WordProgressState } from "@/lib/word-progress/types";

const STORAGE_KEY = "looma:wordProgress:v1";

export function readWordProgress(): WordProgressState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyWordProgressState;
    const parsed = JSON.parse(raw) as Partial<WordProgressState>;
    return { completedWordIds: parsed.completedWordIds ?? [] };
  } catch {
    return emptyWordProgressState;
  }
}

function writeWordProgress(state: WordProgressState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Records a word as completed (idempotent — typing an already-completed word again doesn't duplicate it). */
export function recordWordCompletion(state: WordProgressState, wordId: string): WordProgressState {
  if (state.completedWordIds.includes(wordId)) return state;
  const next: WordProgressState = { completedWordIds: [...state.completedWordIds, wordId] };
  writeWordProgress(next);
  return next;
}
