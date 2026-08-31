/**
 * Word Lists progress: deliberately just "which words has this learner
 * ever typed correctly" — no XP, no streak, no daily goal. Those belong to
 * the lesson-completion loop (src/lib/progress), which this intentionally
 * does not touch or extend; see src/types/word-lists.ts's doc comment for
 * why Word Lists is its own shape throughout.
 */
export interface WordProgressState {
  completedWordIds: string[];
}

export const emptyWordProgressState: WordProgressState = { completedWordIds: [] };
