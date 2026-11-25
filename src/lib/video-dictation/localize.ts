import esTable from "@/data/videos/i18n/es.json";
import trTable from "@/data/videos/i18n/tr.json";
import type { SupportLocale } from "@/lib/i18n/locales";

import type { VideoLesson } from "./types";

/**
 * Spanish and Turkish for the text a video shows beside the English: the meaning of every sentence
 * and of every word in it. The files are `src/data/videos/i18n/<locale>.json`, keyed by the
 * sentence id; each entry is the whole sentence first, then one meaning per word of the English
 * sentence in the same order as `wordTranslations` (see splitWords in validate.ts).
 *
 * The video files themselves keep the Arabic. The practice page swaps it here, on the server,
 * so a learner whose support language is Spanish or Turkish gets a lesson whose `ar` fields hold
 * their own language and the screens that show them need no change. Arabic (and a visitor who has
 * not chosen yet) gets the lesson as written.
 */

const TABLES: Record<"es" | "tr", Record<string, string[]>> = { es: esTable, tr: trTable };

/** The sentence meaning and the word meanings of one sentence in this locale, or null when there is none that fits. */
export function localizedSentenceRow(
  sentenceId: string,
  wordCount: number,
  locale: SupportLocale | null,
): { text: string; words: string[] } | null {
  if (locale !== "es" && locale !== "tr") return null;
  const row = TABLES[locale][sentenceId];
  if (!row || row.length !== wordCount + 1) return null;
  return { text: row[0]!, words: row.slice(1) };
}

export function localizeVideoLesson(
  lesson: VideoLesson,
  locale: SupportLocale | null,
): VideoLesson {
  if (locale !== "es" && locale !== "tr") return lesson;
  return {
    ...lesson,
    sentences: lesson.sentences.map((sentence) => {
      const row = localizedSentenceRow(sentence.id, sentence.wordTranslations.length, locale);
      if (!row) return sentence;
      return {
        ...sentence,
        ar: row.text,
        wordTranslations: sentence.wordTranslations.map((word, index) => ({
          en: word.en,
          ar: row.words[index]!,
        })),
      };
    }),
  };
}
