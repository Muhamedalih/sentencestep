import { BLANK_TOKEN } from "@/types/word-lists";

/** `sentence` with its target word blanked back out — same convention Word Lists content is hand-authored in (see BLANK_TOKEN), just derived here instead of pre-written, since a Recall word's sentence is a real lesson/story sentence rather than a purpose-built one. */
export function buildBlankSentence(sentenceEn: string, wordIndex: number): string {
  const words = sentenceEn.split(/\s+/);
  if (wordIndex < 0 || wordIndex >= words.length) return sentenceEn;
  words[wordIndex] = BLANK_TOKEN;
  return words.join(" ");
}
