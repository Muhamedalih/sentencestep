import type { SupportLocale } from "@/lib/i18n/locales";
import { findWordInSentences, wordMeaning } from "@/lib/story-words";
import type { StoryWordOutcomes } from "@/lib/story-words";
import type { BankWordContext } from "@/lib/word-bank/types";
import type { VocabularyItem } from "@/types/content";

/** One target word of a finished story, ready for recordBankWordAction (which adds nothing but the day). */
export interface StoryBankAnswer extends BankWordContext {
  word: string;
  outcome: "clean" | "missed";
}

/**
 * What a story's words step tells the words bank («كلماتي»): each target word the learner finished,
 * with how its FIRST answer went (typed right the first time it was asked = clean; right only after a
 * miss = missed, so it comes back tomorrow), the story it belongs to, the meaning the learner saw and
 * the sentence of the story it sits in. Only target words: nothing else a learner reads or mistypes
 * enters the bank from a story. Pure; a word with no outcome yet is left out.
 */
export function storyBankAnswers(args: {
  lessonId: string;
  title: string;
  vocabulary: readonly VocabularyItem[];
  sentences: readonly { en: string }[];
  outcomes: StoryWordOutcomes;
  locale: SupportLocale | null;
}): StoryBankAnswer[] {
  const answers: StoryBankAnswer[] = [];
  for (const item of args.vocabulary) {
    const outcome = args.outcomes[item.id];
    if (!outcome) continue;
    const found = findWordInSentences(item.en, args.sentences);
    const homeSentence = found
      ? [found.prefix, `${found.lead}${found.word}${found.tail}`, found.suffix]
          .filter(Boolean)
          .join(" ")
      : undefined;
    answers.push({
      word: item.en,
      outcome: outcome === "first" ? "clean" : "missed",
      source: "story",
      lessonId: args.lessonId,
      lessonTitle: args.title,
      ar: wordMeaning(item, args.locale) ?? undefined,
      homeSentence,
    });
  }
  return answers;
}
