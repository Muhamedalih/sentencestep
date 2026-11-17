/**
 * What the new finish screen of a video (the "videoFinish" permission) shows about the words the
 * learner mistyped: plain functions, no React, shared by the practice screen and the tests.
 */

import { normalizeMistakeWord } from "@/lib/mistakes/normalize";

import type { VideoSentence } from "./types";

/** The finish screen shows at most this many words, in one row on a computer (the owner's choice of 2026-11-08: fewer words, spread evenly). */
export const REVIEW_WORDS_MAX = 4;

/** A word the learner mistyped on this visit. */
export interface MissedWord {
  /** The word as the mistakes ledger keys it (lowercase, no punctuation around it). */
  word: string;
  /** Its meaning in the sentence it was first mistyped in ("" when the video's file has none). */
  meaning: string;
  /** How many wrong letters were typed in it, over the whole video. */
  hits: number;
  /** The order in which it was first mistyped (0 = first). */
  order: number;
}

/** The meaning of `word` (already normalised) in `sentence`, from the sentence's own word list. */
export function meaningInSentence(sentence: VideoSentence, word: string): string {
  const entry = sentence.wordTranslations.find((item) => normalizeMistakeWord(item.en) === word);
  return entry?.ar ?? "";
}

/** Counts one more wrong letter in `word`; the first time it is seen it keeps this meaning and its place. */
export function recordMissedWord(
  missed: Map<string, MissedWord>,
  word: string,
  meaning: string,
): void {
  const known = missed.get(word);
  if (known) {
    known.hits += 1;
    if (!known.meaning && meaning) known.meaning = meaning;
    return;
  }
  missed.set(word, { word, meaning, hits: 1, order: missed.size });
}

/**
 * The words the finish screen offers: the ones with the most wrong letters first, then the longer
 * ones (a long word carries more meaning than a short one like "got"), then the order they came in.
 */
export function pickReviewWords(
  missed: Iterable<MissedWord>,
  max: number = REVIEW_WORDS_MAX,
): MissedWord[] {
  return [...missed]
    .sort((a, b) => b.hits - a.hits || b.word.length - a.word.length || a.order - b.order)
    .slice(0, Math.max(0, max));
}

/** The number of words typed in the whole video: one per entry of each sentence's word list. */
export function wordsInVideo(sentences: readonly VideoSentence[]): number {
  return sentences.reduce((sum, sentence) => sum + sentence.wordTranslations.length, 0);
}

/** A word of the video the training round asks: the word itself and its meaning in the sentence. */
export interface TrainingWord {
  word: string;
  meaning: string;
}

/** The training round's size: enough to feel like a round, short enough to finish in a minute or two. */
export const TRAINING_WORDS_MAX = 8;

/** The shortest word worth typing from a sound ("a", "of" and "is" would only be a click). */
const TRAINING_MIN_LENGTH = 3;

/**
 * The words the training round asks: the ones the learner mistyped first (every one of them, not only
 * the four the finish screen shows), then the other words of the video, longest first (a long word
 * carries more meaning). Only words made of letters (and an apostrophe) can be typed from a sound, each
 * word once, whatever its case or the punctuation around it.
 */
export function buildTrainingWords(
  sentences: readonly VideoSentence[],
  missedWords: readonly string[],
  max: number = TRAINING_WORDS_MAX,
): TrainingWord[] {
  const typeable = /^[\p{L}']+$/u;
  const seen = new Map<string, TrainingWord>();
  for (const sentence of sentences) {
    for (const entry of sentence.wordTranslations) {
      const word = normalizeMistakeWord(entry.en);
      if (word.length < TRAINING_MIN_LENGTH || !typeable.test(word)) continue;
      const known = seen.get(word);
      if (!known) seen.set(word, { word, meaning: entry.ar });
      else if (!known.meaning && entry.ar) known.meaning = entry.ar;
    }
  }
  const missed = new Set(missedWords);
  const first: TrainingWord[] = [];
  const rest: TrainingWord[] = [];
  for (const item of seen.values()) (missed.has(item.word) ? first : rest).push(item);
  rest.sort((a, b) => b.word.length - a.word.length);
  return [...first, ...rest].slice(0, Math.max(0, max));
}
