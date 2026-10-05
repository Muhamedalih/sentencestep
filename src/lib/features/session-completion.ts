import { markMistakeCorrectedAction, markReviewCompletedAction } from "@/lib/mistakes/actions";
import { masterMistakeWordAction } from "@/lib/mistakes/actions";
import { markCardReviewedAction } from "@/lib/cards/actions";
import type { SessionSource } from "@/lib/features/daily-session";
import { recordWordCompletionAction } from "@/lib/word-progress/actions";
import { markVocabularyRecallCompletedAction } from "@/lib/vocabulary-recall/actions";

/**
 * Records that the learner typed one session word correctly, on the right
 * ledger for where the word came from — each source keeps its own schedule
 * (a corrected mistake, a due mistake review, a Word Lists weak word, a
 * Recall word, a personal card, a Word List word) and each already has the
 * action that advances it. `hadErrors` is whether they missed it at least
 * once first this visit.
 */
export function completeSessionWord(
  word: { targetWord: string; groupId: string; id: string; sessionSource?: SessionSource },
  hadErrors: boolean,
): Promise<unknown> {
  switch (word.sessionSource) {
    case "mistake":
      return markMistakeCorrectedAction(word.targetWord);
    case "mistakeReview":
      return markReviewCompletedAction(word.targetWord, hadErrors);
    case "weak":
      return masterMistakeWordAction(word.targetWord);
    case "recall":
      return markVocabularyRecallCompletedAction(word.targetWord, hadErrors);
    case "card":
      return markCardReviewedAction(word.targetWord, hadErrors);
    case "wordList":
      return recordWordCompletionAction(word.groupId, word.id);
    default:
      return Promise.resolve();
  }
}
