import { markMistakeCorrectedAction, markReviewCompletedAction } from "@/lib/mistakes/actions";
import { masterMistakeWordAction } from "@/lib/mistakes/actions";
import { markCardReviewedAction } from "@/lib/cards/actions";
import type { SessionSource } from "@/lib/features/daily-session";
import { recordWordCompletionAction } from "@/lib/word-progress/actions";
import { markVocabularyRecallCompletedAction } from "@/lib/vocabulary-recall/actions";
import { todayLocalISODate } from "@/lib/progress/streak";
import { recordBankWordAction } from "@/lib/word-bank/actions";
import type { BankWordContext } from "@/lib/word-bank/types";

/**
 * Records that the learner typed one session word correctly, on the right
 * ledger for where the word came from — each source keeps its own schedule
 * (a corrected mistake, a due mistake review, a Word Lists weak word, a
 * Recall word, a personal card, a Word List word) and each already has the
 * action that advances it. `hadErrors` is whether they missed it at least
 * once first this visit.
 *
 * A word that carries `bank` (a target word of Today's story or passage, for a
 * learner the words bank is open to — see fetchTodayWordsAction) is also
 * recorded in the learner's words bank, with how its FIRST answer went. That
 * call is best-effort and never changes what this function returns.
 */
export function completeSessionWord(
  word: {
    targetWord: string;
    groupId: string;
    id: string;
    sessionSource?: SessionSource;
    bank?: BankWordContext;
  },
  hadErrors: boolean,
): Promise<unknown> {
  if (word.bank) {
    recordBankWordAction({
      ...word.bank,
      word: word.targetWord,
      outcome: hadErrors ? "missed" : "clean",
      todayISO: todayLocalISODate(),
    }).catch(() => {});
  }
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
