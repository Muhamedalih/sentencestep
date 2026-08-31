/**
 * "Weak word" is a derived signal, not stored data — see the doc comment on
 * isWeakWord below and fetchWeakWordsAction in actions.ts, which is the only
 * place this is computed. There is no weak_words table: mistakes remains
 * the one source of truth for "does this learner currently struggle with
 * this word," and this module only interprets it.
 */

/** Why a word is currently weak — active means "not corrected even once yet"; review means "corrected, but not through enough clean reviews to be considered solid." Exposed to the UI only to pick an icon/tone, never a second priority ranking. */
export type WeakWordReason = "active" | "review";

export interface WeakWordItem {
  wordId: string;
  groupId: string;
  targetWord: string;
  reason: WeakWordReason;
}

/**
 * Below this review_stage, a corrected-and-scheduled word is still treated
 * as weak — matching record_mistake_review's schedule
 * (supabase/migrations/20250130000000_mistake_review_scheduling.sql:
 * [1, 3, 7, 16] days), stage 1 is "just corrected, first review due
 * tomorrow" and stage 2 is "one clean review passed, next due in 3 days" —
 * both still fresh enough to call weak. Stage 3+ (7+ day interval) reads as
 * "demonstrated enough consistency to stop flagging," even though a review
 * may still be pending. A named, exported constant specifically so this one
 * number is easy to find and retune later without touching the predicate
 * itself.
 */
export const WEAK_WORD_REVIEW_STAGE_THRESHOLD = 2;

/**
 * The whole weak-word rule, in one place: a word is weak if it's an
 * outstanding mistake never yet corrected, OR if it's been corrected but
 * hasn't cleared enough scheduled reviews to be considered solid. A
 * mastered word (reviewStage past the schedule, nextReviewAt null) is never
 * weak, regardless of how many times it was missed historically —
 * mistakeCount deliberately plays no part here, since the signal is meant
 * to represent CURRENT difficulty, not a running tally of past mistakes.
 */
export function isWeakWord(mistake: {
  status: "active" | "corrected";
  reviewStage: number;
  nextReviewAt: string | null;
}): boolean {
  if (mistake.status === "active") return true;
  return mistake.nextReviewAt !== null && mistake.reviewStage <= WEAK_WORD_REVIEW_STAGE_THRESHOLD;
}
