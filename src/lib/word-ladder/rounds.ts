/**
 * Word Lists as rounds of three words (the five-step ladder behind the wordLadder permission). A topic's
 * words are taken in their own order, three at a time, and a round is made of the words the learner
 * has NOT finished yet: so a word typed right in the old Practice already counts, a word that missed
 * twice is simply offered again, and nothing has to be stored about rounds. Pure and client-safe.
 */

/** Words in a round: three fit in a learner's head at once, and a word comes back after two others. */
export const LADDER_ROUND_SIZE = 3;

/** How many words the next round asks when `remaining` words are still open: a short tail is taken whole (4 or fewer), never left as a lone word. */
export function nextRoundSize(remaining: number): number {
  if (remaining <= 0) return 0;
  return remaining <= 4 ? remaining : LADDER_ROUND_SIZE;
}

/** How many rounds a whole topic of `total` words takes: 25 = seven of three and one of four = 8; 26 = eight of three and one of two = 9. */
export function ladderRoundCount(total: number): number {
  if (total <= 0) return 0;
  if (total <= 4) return 1;
  return total % 3 === 1 ? Math.floor(total / 3) : Math.ceil(total / 3);
}

export interface RoundPlan<T> {
  /** The words of the round, in the topic's order. */
  words: T[];
  /** Which round this is, from 1 (never more than `count`). */
  number: number;
  /** Rounds in the whole topic. */
  count: number;
  /** Words of the topic already finished. */
  done: number;
  total: number;
}

/** The next round of a topic, or null when every word is finished. */
export function planRound<T extends { id: string }>(
  words: readonly T[],
  completed: ReadonlySet<string> | readonly string[],
): RoundPlan<T> | null {
  const finished = completed instanceof Set ? completed : new Set(completed);
  const open = words.filter((word) => !finished.has(word.id));
  if (open.length === 0) return null;
  const count = ladderRoundCount(words.length);
  const number = Math.min(count, Math.max(1, count - ladderRoundCount(open.length) + 1));
  return {
    words: open.slice(0, nextRoundSize(open.length)),
    number,
    count,
    done: words.length - open.length,
    total: words.length,
  };
}
