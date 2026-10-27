import { normalizeMistakeWord } from "@/lib/mistakes/normalize";

/**
 * The marker a lesson's VocabularyItem.id is built from (see buildStoryVocabulary in
 * src/lib/content/story-vocabulary.ts: `${sentenceId}-vocab-${wordIndex}`) — every mode (normal and
 * stories alike) populates `lesson.vocabulary` in exactly this id format (see withLessonVocabulary /
 * withStoryVocabulary in src/lib/content.ts), so the sentence a target word sits in and its place in
 * that sentence are read back out of the id rather than threading a second, richer shape through
 * getLessonById.
 *
 * The one exception is a curated story (story-79..198, every story in use): its target words are
 * authored, so its ids carry the word itself (`story-121-vocab-burnout`, see
 * applyCuratedStoryVocabulary) and the place has to be found in the story's sentences instead —
 * locateVocabularyItem below does both.
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

/**
 * Where one target word sits in its lesson: its sentence (an index into `sentences`, which
 * `indexById` maps the sentence ids to) and its place among that sentence's whitespace-split words.
 * Derived vocabulary says so in its id (`<sentence>-vocab-<wordIndex>`); a curated story's ids carry
 * the word itself (`story-121-vocab-burnout`), so the word's first occurrence in the story's own
 * sentences is found instead, matched the way mistakes are (lower case, punctuation stripped).
 * Null when it cannot be placed: a word that is nowhere in the sentences is skipped, never guessed.
 * Shared by Today's words step (session-words.ts) and the Vocabulary Recall encounters
 * (encounter-targets.ts), so the two always place a story's words the same way.
 */
export function locateVocabularyItem(
  item: { id: string; en: string },
  sentences: readonly { id: string; en: string }[],
  indexById: ReadonlyMap<string, number>,
): { index: number; wordIndex: number } | null {
  const parsed = parseVocabularyItemId(item.id);
  if (parsed) {
    const index = indexById.get(parsed.sentenceId);
    return index === undefined ? null : { index, wordIndex: parsed.wordIndex };
  }
  if (!item.id.includes(VOCAB_ID_MARKER)) return null;
  const target = normalizeMistakeWord(item.en);
  if (!target) return null;
  for (let index = 0; index < sentences.length; index++) {
    const wordIndex = sentences[index]!.en.split(/\s+/).findIndex(
      (word) => normalizeMistakeWord(word) === target,
    );
    if (wordIndex !== -1) return { index, wordIndex };
  }
  return null;
}
