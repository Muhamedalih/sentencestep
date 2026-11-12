import { definitionOf, meaningChoices, spellingChoices, termOf } from "@/lib/word-ladder/options";
import type { LadderWord } from "@/lib/word-ladder/types";
import { BLANK_TOKEN } from "@/types/word-lists";
import type { VocabularyWord } from "@/types/word-lists";

/** The context sentence with its blank filled by the word, capitalised when the blank opens the sentence. */
export function fillSentence(sentence: string, word: string): string {
  const index = sentence.indexOf(BLANK_TOKEN);
  if (index === -1) return sentence;
  const shown = index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word;
  return sentence.replace(BLANK_TOKEN, shown);
}

/**
 * The words of a topic as the ladder needs them. `known` are real words (so a near-miss spelling is
 * never one), `ipaOf` says how a word sounds (so none sounds like the answer); both come from the
 * server, which holds the lessons' words and the pronunciation list.
 */
export function buildLadderWords(
  words: readonly VocabularyWord[],
  options: {
    known: ReadonlySet<string>;
    ipaOf?: (word: string) => string | null | undefined;
  },
): LadderWord[] {
  const ordered = [...words].sort((a, b) => a.order - b.order);
  const pool = ordered.map((word) => ({
    id: word.id,
    term: termOf(word.supportHint ?? word.hintAr),
    pos: word.pos ?? null,
  }));
  const known = new Set([
    ...options.known,
    ...ordered.map((word) => word.targetWord.toLowerCase()),
  ]);

  return ordered.map((word, index) => {
    const hint = word.supportHint ?? word.hintAr;
    const text = word.targetWord.toLowerCase();
    const term = pool[index]!.term;
    // The word itself is not "a real word to avoid": it is the answer.
    const avoid = new Set(known);
    avoid.delete(text);
    return {
      id: word.id,
      word: text,
      term,
      definition: definitionOf(hint),
      sentence: fillSentence(word.sentence, word.targetWord),
      ipa: word.ipa ?? null,
      pos: word.pos ?? null,
      meaningOptions: meaningChoices({ id: word.id, term }, pool, word.pos ?? null, `m:${word.id}`),
      spellingOptions: spellingChoices(text, {
        known: avoid,
        ipaOf: options.ipaOf,
        seed: `s:${word.id}`,
      }),
      audioUrl: word.audioUrl ?? null,
    };
  });
}
