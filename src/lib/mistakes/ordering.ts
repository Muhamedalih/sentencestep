import { LEARNING_MODES } from "@/lib/learning-modes";
import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { tokenize } from "@/lib/typing";
import type { LearningMode, Lesson } from "@/types/content";

/**
 * Earliest-occurrence position for every distinct word across the whole
 * curriculum — built fresh from the same lesson content the dashboard
 * already loads (getAllLessons), never a stored/frozen order, so it always
 * reflects the CURRENT lesson order even if content is later reordered.
 * "Earliest" means: walk LEARNING_MODES in their fixed app order, each
 * mode's lessons in array order (already order_index-sorted by
 * getLessons), each lesson's sentences in array order, each sentence's
 * words left to right — the first time a normalized word is seen anywhere
 * in that walk is its position, no matter how many later lessons repeat
 * it. This is what "if the same word exists in multiple lessons, use the
 * earliest relevant lesson position" is built on.
 */
export function buildWordOrderIndex(
  lessonsByMode: Record<LearningMode, Lesson[]>,
): Map<string, number> {
  const index = new Map<string, number>();
  let position = 0;

  for (const mode of LEARNING_MODES) {
    for (const lesson of lessonsByMode[mode]) {
      for (const sentence of lesson.sentences) {
        for (const token of tokenize(sentence.en)) {
          if (token === " " || !isTrackableWord(token)) continue;
          const key = normalizeMistakeWord(token);
          if (!index.has(key)) index.set(key, position);
          position += 1;
        }
      }
    }
  }

  return index;
}
