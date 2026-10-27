import { recordVocabularyEncounter } from "@/lib/supabase/queries/vocabulary-recall";
import { encounterTargets } from "@/lib/vocabulary-recall/encounter-targets";
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
 *
 * Which words, and where each sits in its sentence, is encounterTargets' job
 * (pure, tested): that includes a curated story's words, whose ids carry the
 * word instead of its place, and caps a story at its three words.
 */
export async function recordVocabularyEncountersForLesson(lesson: Lesson): Promise<void> {
  // Captured into a local const: TS narrows `lesson.mode` right after the
  // guard below, but that narrowing doesn't survive into the async closure
  // further down (an object property, not a local binding) — this does.
  const mode = lesson.mode;
  if (mode !== "normal" && mode !== "stories") return;

  const targets = encounterTargets(lesson);
  if (targets.length === 0) return;

  await Promise.all(
    targets.map(async ({ word, ar, sentenceId, sentenceEn, wordIndex }) => {
      try {
        await recordVocabularyEncounter({
          // Normalized the exact same way resolvePronunciationAudioAction's
          // "sentence_word" lookup re-derives a word from the live sentence
          // (see that function's doc comment) — a mismatch here would mean
          // the isolated-word pronunciation pipeline can never find this
          // word inside its own sentence, silently falling back to the
          // browser's speech synthesis.
          word,
          ar,
          mode,
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          sentenceId,
          sentenceEn,
          wordIndex,
        });
      } catch (error) {
        console.error("[vocabulary-recall] recordVocabularyEncounter failed", error);
      }
    }),
  );
}
