import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";

/**
 * "You know 91% of its words": how much of a story a learner has already typed. Pure — the loader
 * hands over each lesson's words, this only counts.
 *
 * A word counts as known when it is in a lesson the learner has finished (every sentence of a lesson
 * is typed to finish it), so the measure is honest and costs nothing to keep: no new table, only the
 * list of finished lessons the site already has. It says "typed before", not "remembered": the bank
 * («كلماتي») is what makes words stay.
 */

/** Below this many finished lessons the line is not shown: a number with almost nothing behind it would only mislead. */
export const READINESS_MIN_LESSONS = 5;

/** A text's distinct words, written the way every word ledger writes them (lower case, no edge punctuation), in first-seen order. */
export function distinctWords(sentences: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const sentence of sentences) {
    for (const token of sentence.split(/\s+/)) {
      if (!isTrackableWord(token)) continue;
      seen.add(normalizeMistakeWord(token));
    }
  }
  return [...seen];
}

export interface Readiness {
  /** Whole percent of the lesson's distinct words the learner has typed before; 100 only when every one is known. */
  percent: number;
  /** How many of its distinct words are new to the learner. */
  fresh: number;
}

/** One lesson against the words a learner knows, or null for a lesson with no words. */
export function readinessOf(
  words: readonly string[],
  known: ReadonlySet<string>,
): Readiness | null {
  if (words.length === 0) return null;
  let have = 0;
  for (const word of words) if (known.has(word)) have += 1;
  return { percent: Math.floor((have / words.length) * 100), fresh: words.length - have };
}

/**
 * The line for every lesson of `index` the learner has NOT finished, by lesson id. Empty until they
 * have finished `READINESS_MIN_LESSONS` of the indexed lessons.
 */
export function readinessByLesson(
  index: Readonly<Record<string, readonly string[]>>,
  finishedIds: Iterable<string>,
): Record<string, Readiness> {
  const finished = new Set<string>();
  for (const id of finishedIds) if (index[id]) finished.add(id);
  if (finished.size < READINESS_MIN_LESSONS) return {};

  const known = new Set<string>();
  for (const id of finished) for (const word of index[id]!) known.add(word);

  const result: Record<string, Readiness> = {};
  for (const [id, words] of Object.entries(index)) {
    if (finished.has(id)) continue;
    const readiness = readinessOf(words, known);
    if (readiness) result[id] = readiness;
  }
  return result;
}
