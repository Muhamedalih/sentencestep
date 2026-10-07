import { roundDownForDisplay } from "./social-proof";

/**
 * The real size of the library, quoted on /upgrade so a visitor can see what
 * Premium opens before they see a price. Like the social-proof figures, a
 * number is only ever rounded DOWN and is left out entirely while it is too
 * small to be worth saying.
 */
export const MIN_LESSONS_TO_QUOTE = 20;
export const MIN_WORDS_TO_QUOTE = 100;
export const MIN_WORD_LISTS_TO_QUOTE = 3;

export interface ContentStats {
  /** Published lessons, stories and conversations, rounded down, or null when too few to quote. */
  lessons: number | null;
  /** Words in the published word lists, rounded down, or null when too few to quote. */
  words: number | null;
  /** Published word lists, or null when too few to quote. */
  wordLists: number | null;
}

export const NO_CONTENT_STATS: ContentStats = { lessons: null, words: null, wordLists: null };

export function buildContentStats(counts: {
  lessons: number;
  words: number;
  wordLists: number;
}): ContentStats {
  return {
    lessons: counts.lessons >= MIN_LESSONS_TO_QUOTE ? roundDownForDisplay(counts.lessons) : null,
    words: counts.words >= MIN_WORDS_TO_QUOTE ? roundDownForDisplay(counts.words) : null,
    wordLists:
      counts.wordLists >= MIN_WORD_LISTS_TO_QUOTE ? roundDownForDisplay(counts.wordLists) : null,
  };
}
