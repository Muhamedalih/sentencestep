import { normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { recordVocabularyEncounter } from "@/lib/supabase/queries/vocabulary-recall";
import { parseVocabularyItemId } from "@/lib/vocabulary-recall/item-id";
import type { Lesson } from "@/types/content";

/**
 * Records this lesson's target vocabulary as Vocabulary Recall encounters for
 * the signed-in learner who just completed it — called from
 * recordCompletionAction, once per completion. Never throws: a write failure
 * here is a missed opportunity to schedule a review, not a reason to fail the
 * completion itself, same treatment recordCompletionAction already gives
 * milestone emails/analytics. A no-op for a lesson with no vocabulary (e.g.
 * conversation mode, or a lesson whose sentences have no wordTranslations to
 * rank) and for any word this learner has already met before (see
 * record_vocabulary_encounter's ON CONFLICT DO NOTHING).
 */
export async function recordVocabularyEncountersForLesson(lesson: Lesson): Promise<void> {
  if (!lesson.vocabulary || lesson.vocabulary.length === 0) return;
  if (lesson.mode !== "normal" && lesson.mode !== "stories") return;
  // Captured into a local const: TS narrows `lesson.mode` right after the
  // guard above, but that narrowing doesn't survive into the async closure
  // below (an object property, not a local binding) — this does.
  const mode = lesson.mode;

  const sentenceById = new Map(lesson.sentences.map((sentence) => [sentence.id, sentence]));

  await Promise.all(
    lesson.vocabulary.map(async (item) => {
      const parsed = parseVocabularyItemId(item.id);
      if (!parsed) return;
      const { sentenceId, wordIndex } = parsed;
      const sentence = sentenceById.get(sentenceId);
      if (!sentence) return;

      try {
        await recordVocabularyEncounter({
          // Normalized the exact same way resolvePronunciationAudioAction's
          // "sentence_word" lookup re-derives a word from the live sentence
          // (see that function's doc comment) — a mismatch here would mean
          // the isolated-word pronunciation pipeline can never find this
          // word inside its own sentence, silently falling back to the
          // browser's speech synthesis.
          word: normalizeMistakeWord(item.en),
          ar: item.ar,
          mode,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          sentenceId,
          sentenceEn: sentence.en,
          wordIndex,
        });
      } catch (error) {
        console.error("[vocabulary-recall] recordVocabularyEncounter failed", error);
      }
    }),
  );
}
