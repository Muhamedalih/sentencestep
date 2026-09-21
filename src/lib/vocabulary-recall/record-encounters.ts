import { recordVocabularyEncounter } from "@/lib/supabase/queries/vocabulary-recall";
import type { Lesson } from "@/types/content";

/**
 * The marker VocabularyItem.id is built from (see buildStoryVocabulary in
 * src/lib/content/story-vocabulary.ts: `${sentenceId}-vocab-${wordIndex}`) —
 * parsed back apart here rather than threading a second, richer shape through
 * getLessonById, since every mode (normal and stories alike) already
 * populates `lesson.vocabulary` in exactly this id format (see
 * withLessonVocabulary/withStoryVocabulary in src/lib/content.ts).
 */
const VOCAB_ID_MARKER = "-vocab-";

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

  const sentenceById = new Map(lesson.sentences.map((sentence) => [sentence.id, sentence]));

  await Promise.all(
    lesson.vocabulary.map(async (item) => {
      const cut = item.id.lastIndexOf(VOCAB_ID_MARKER);
      if (cut === -1) return;
      const sentenceId = item.id.slice(0, cut);
      const wordIndex = Number(item.id.slice(cut + VOCAB_ID_MARKER.length));
      const sentence = sentenceById.get(sentenceId);
      if (!sentence || !Number.isInteger(wordIndex)) return;

      try {
        await recordVocabularyEncounter({
          word: item.en.toLowerCase(),
          ar: item.ar,
          mode: lesson.mode,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          sentenceEn: sentence.en,
          wordIndex,
        });
      } catch (error) {
        console.error("[vocabulary-recall] recordVocabularyEncounter failed", error);
      }
    }),
  );
}
