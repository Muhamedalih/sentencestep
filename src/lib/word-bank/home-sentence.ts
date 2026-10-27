import { getLessonById } from "@/lib/content";
import type { SupportLocale } from "@/lib/i18n/locales";
import { fetchPassage } from "@/lib/passages/queries";
import type { BankHomeRow } from "@/lib/supabase/queries/learner-words";
import { pickTranslation, sameSentence } from "@/lib/word-bank/round";

/**
 * The translation of a word's home sentence, for the card the review shows after a miss. The bank
 * keeps only the English sentence (and where it was met), so the translation is read back from the
 * story or passage it came from, in the learner's own language. Null when the text no longer holds
 * the sentence, has no translation for this learner, or was not a story or a passage.
 */
export async function homeSentenceTranslation(
  home: BankHomeRow,
  locale: SupportLocale | null,
): Promise<string | null> {
  const sentence = home.homeSentence;
  if (!home.lessonId || !sentence) return null;
  if (home.source === "story") {
    const lesson = await getLessonById("stories", home.lessonId, locale ?? undefined);
    const line = lesson?.sentences.find((candidate) => sameSentence(candidate.en, sentence));
    return line ? pickTranslation(line, locale) : null;
  }
  if (home.source === "passage") {
    const passage = await fetchPassage(home.lessonId);
    const line = passage?.sections
      .flatMap((section) => section.sentences)
      .find((candidate) => sameSentence(candidate.en, sentence));
    return line ? pickTranslation({ en: line.en, ar: line.ar }, locale) : null;
  }
  return null;
}
