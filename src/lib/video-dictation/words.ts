/** The whitespace-separated words of a sentence: the units the typing screen counts (see TypingText's word index). */
export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter((word) => word.length > 0);
}

/** A word without the punctuation around it, lower-cased: how a word and its gloss are matched. */
export function bareWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
}

/** Sentences longer than this are hard to type from one hearing: the admin tool warns above it. */
export const MAX_COMFORTABLE_WORDS = 12;
