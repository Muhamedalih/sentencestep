import type { DailyProgressState, StreakState } from "@/lib/progress/types";

/**
 * The result of recording one book-sentence completion — what the reading
 * session needs to advance its UI (has a section or the whole book just
 * finished?) and, for a signed-in learner, show any reward earned. Guests
 * never call recordBookSentenceCompletionAction (see BookReadingSession) so
 * this shape is signed-in-only, unlike src/lib/progress/types.ts's
 * ProgressState, which has a genuine guest/localStorage counterpart.
 */
export interface BookSentenceCompletionResult {
  completedSentenceCount: number;
  currentSectionId: string | null;
  currentSentenceId: string | null;
  /** True exactly when this completion crossed out of the section it was read in — either into the next section, or (see bookCompleted) out of the book entirely. */
  sectionCompleted: boolean;
  /** True exactly when this completion was the book's last sentence. */
  bookCompleted: boolean;
  /** XP awarded by this specific call — always 0 unless sectionCompleted (see recordBookSentenceCompletionAction's doc comment for why XP is section-, not sentence-, granular). */
  xpEarned: number;
  xp: number;
  streak: StreakState;
  dailyProgress: DailyProgressState;
  /** User-facing reward strings for this call, same convention as ProgressState.rewards (e.g. "Level up: Explorer") — empty when nothing new was crossed. */
  rewards: string[];
}
