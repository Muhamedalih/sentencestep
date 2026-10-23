/**
 * The marker a lesson's VocabularyItem.id is built from (see buildStoryVocabulary in
 * src/lib/content/story-vocabulary.ts: `${sentenceId}-vocab-${wordIndex}`) — every mode (normal and
 * stories alike) populates `lesson.vocabulary` in exactly this id format (see withLessonVocabulary /
 * withStoryVocabulary in src/lib/content.ts), so the sentence a target word sits in and its place in
 * that sentence are read back out of the id rather than threading a second, richer shape through
 * getLessonById.
 */
const VOCAB_ID_MARKER = "-vocab-";

/** The sentence a target word sits in and its index among that sentence's whitespace-split words, or null for an id that does not follow the format. */
export function parseVocabularyItemId(
  id: string,
): { sentenceId: string; wordIndex: number } | null {
  const cut = id.lastIndexOf(VOCAB_ID_MARKER);
  if (cut === -1) return null;
  const wordIndex = Number(id.slice(cut + VOCAB_ID_MARKER.length));
  if (!Number.isInteger(wordIndex)) return null;
  return { sentenceId: id.slice(0, cut), wordIndex };
}
