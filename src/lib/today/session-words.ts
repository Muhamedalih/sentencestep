import type { ReviewWord } from "@/components/learning/word-review-session";
import { normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { splitAroundWord } from "@/lib/passages/text";
import type { PassageWord } from "@/lib/passages/types";
import { isImportantWord } from "@/lib/today/important-words";
import { buildBlankSentence } from "@/lib/vocabulary-recall/blank-sentence";
import { parseVocabularyItemId } from "@/lib/vocabulary-recall/item-id";
import { BLANK_TOKEN } from "@/types/word-lists";
import type { VocabularyItem } from "@/types/content";

/**
 * Today's words step is tied to the same session's story and passage: its five words are the TARGET
 * words of the story finished today (two or three) and, for the places left, those of the passage
 * finished today. Pure — session-words-load.ts finds the lessons and reads them, this turns their
 * target words into the review words the step quizzes, each with its sentence blanked out and a
 * small "from today's story" line (ReviewWord.fromToday) so the link is visible.
 */

/** The story gives at most this many of the five; its own target vocabulary is two or three words anyway. */
export const STORY_WORDS_MAX = 3;

/** The story's target words (its `lesson.vocabulary`), the important ones only, each with the story sentence it sits in blanked out. They are the very words the story's Vocabulary Recall encounters were made from, so finishing one advances that schedule. */
export function storyReviewWords(lesson: {
  title: string;
  sentences: readonly { id: string; en: string }[];
  vocabulary?: readonly VocabularyItem[];
}): ReviewWord[] {
  const sentences = new Map(lesson.sentences.map((sentence) => [sentence.id, sentence]));
  const words: ReviewWord[] = [];
  for (const item of lesson.vocabulary ?? []) {
    if (words.length >= STORY_WORDS_MAX) break;
    const parsed = parseVocabularyItemId(item.id);
    const sentence = parsed ? sentences.get(parsed.sentenceId) : undefined;
    const targetWord = normalizeMistakeWord(item.en);
    if (!parsed || !sentence || !isImportantWord(targetWord)) continue;
    const blanked = buildBlankSentence(sentence.en, parsed.wordIndex);
    if (!blanked.includes(BLANK_TOKEN)) continue;
    words.push({
      id: `recall-${targetWord}`,
      groupId: "recall",
      order: words.length,
      targetWord,
      sentence: blanked,
      hintAr: item.ar,
      supportHint: item.supportText ?? item.ar,
      reason: "review",
      lessonTitle: lesson.title,
      fromToday: "story",
      // The real, synthesized isolated-word pipeline, as for every Vocabulary Recall word.
      pronunciationContentType: "sentence_word",
      pronunciationContentId: `${sentence.id}::${targetWord}`,
    });
  }
  return words;
}

/**
 * The passage's target words (the word lesson it hands over at its end), the important ones that
 * can be shown inside the passage line they appear in, in the passage's own order, each with that
 * line blanked out. Empty for a passage with no word lesson: there is nothing to complete them
 * against.
 */
export function passageReviewWords(passage: {
  title: string;
  wordGroupId: string | null;
  words: readonly PassageWord[];
}): ReviewWord[] {
  if (!passage.wordGroupId) return [];
  const words: ReviewWord[] = [];
  for (const entry of passage.words) {
    const parts = entry.contextEn ? splitAroundWord(entry.contextEn, entry.word) : null;
    if (!parts || !isImportantWord(entry.word)) continue;
    words.push({
      id: entry.id,
      groupId: passage.wordGroupId,
      order: words.length,
      targetWord: entry.word,
      sentence: `${parts[0]}${BLANK_TOKEN}${parts[2]}`,
      hintAr: entry.hintAr,
      supportHint: entry.hintAr,
      reason: "review",
      lessonTitle: passage.title,
      fromToday: "passage",
      audioUrl: entry.audioUrl,
    });
  }
  return words;
}
