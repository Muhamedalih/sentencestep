import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { tokenize } from "@/lib/typing";

/**
 * Identifies one word's audio clip the way every word-audio caller does: the
 * `contentId` is `${sentenceId}::${normalized word}` (what
 * resolvePronunciationAudioAction expects) and `text` is the raw token as
 * written in the sentence (what the clip is actually cached under — case and
 * punctuation included, see normalizeTextForVoice). Pure, so the lesson page
 * and the tests share exactly one definition.
 */
export interface WordAudioRef {
  contentId: string;
  text: string;
}

/** Every distinct trackable word of one sentence, first occurrence wins (the same token the server resolves a contentId back to). */
export function sentenceWordRefs(sentence: { id: string; en: string }): WordAudioRef[] {
  const seen = new Set<string>();
  const refs: WordAudioRef[] = [];
  for (const token of tokenize(sentence.en)) {
    if (!isTrackableWord(token)) continue;
    const contentId = `${sentence.id}::${normalizeMistakeWord(token)}`;
    if (seen.has(contentId)) continue;
    seen.add(contentId);
    refs.push({ contentId, text: token });
  }
  return refs;
}

/** The words of a whole lesson in sentence order, capped so a very long story can't bloat the page. */
export function lessonWordRefs(
  sentences: readonly { id: string; en: string }[],
  maxWords = 400,
): WordAudioRef[] {
  const refs: WordAudioRef[] = [];
  for (const sentence of sentences) {
    for (const ref of sentenceWordRefs(sentence)) {
      if (refs.length >= maxWords) return refs;
      refs.push(ref);
    }
  }
  return refs;
}
