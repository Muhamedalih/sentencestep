import { WORD_IPA } from "@/data/word-lists/ipa";
import { CORE_WORDS } from "@/lib/word-bank/core-words";
import { loadLessonWords } from "@/lib/word-bank/lesson-words";

/**
 * What the ladder's spelling choices are checked against, read on the server: the real words of the
 * site's own lessons (kept for an hour for everyone, the same index the story cards use), the
 * pronunciation list and the core words. A near-miss spelling that is any of these is never offered
 * (the question would have two right answers), and one that SOUNDS like the answer is never offered
 * either (`ipaOf`). When the lessons' words cannot be read the other two lists still hold, so the
 * choices are a little less strict, never an error.
 */
export async function loadSpellingChecks(): Promise<{
  known: Set<string>;
  ipaOf: (word: string) => string | null;
}> {
  const lessons = await loadLessonWords();
  const known = new Set<string>(Object.keys(WORD_IPA));
  for (const list of Object.values(lessons)) for (const word of list) known.add(word);
  for (const entry of CORE_WORDS) known.add(entry.word);
  return { known, ipaOf: (word) => WORD_IPA[word] ?? null };
}
