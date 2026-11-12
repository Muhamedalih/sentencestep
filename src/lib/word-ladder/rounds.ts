/**
 * Word Lists as rounds of four words (the five-step ladder behind the wordLadder permission). A topic's
 * words are taken in their own order, four at a time (three only where the topic's count needs it),
 * and a round is made of the words the learner has NOT finished yet: so a word typed right in the old
 * Practice already counts, a word that missed is simply offered again, and nothing has to be stored
 * about rounds. Pure and client-safe.
 */

/** Words in a round: four is what the order of a round is built for (see buildQueue). */
export const LADDER_ROUND_SIZE = 4;
/** The smaller round, used only when the count of words cannot be split into fours. */
export const LADDER_SHORT_ROUND_SIZE = 3;

/**
 * How `remaining` words are split into rounds, in the order they are played: fours first, and
 * threes only as many as the count needs (25 = four fours and three threes, 30 = six fours and two
 * threes, 28 = seven fours). A count that cannot be split into fours and threes (1, 2 or 5 words)
 * is one round (or, for 5, a three and a two). Never a round of more than four.
 */
export function roundSizes(remaining: number): number[] {
  if (remaining <= 0) return [];
  if (remaining <= LADDER_ROUND_SIZE) return [remaining];
  // The fewest threes that leave a multiple of four.
  for (let threes = 0; threes * LADDER_SHORT_ROUND_SIZE <= remaining; threes++) {
    const rest = remaining - threes * LADDER_SHORT_ROUND_SIZE;
    if (rest % LADDER_ROUND_SIZE === 0) {
      return [
        ...Array<number>(rest / LADDER_ROUND_SIZE).fill(LADDER_ROUND_SIZE),
        ...Array<number>(threes).fill(LADDER_SHORT_ROUND_SIZE),
      ];
    }
  }
  // 5 words: no fours-and-threes split exists.
  return [LADDER_SHORT_ROUND_SIZE, remaining - LADDER_SHORT_ROUND_SIZE];
}

/** How many words the next round asks when `remaining` words are still open. */
export function nextRoundSize(remaining: number): number {
  return roundSizes(remaining)[0] ?? 0;
}

/** How many rounds a whole topic of `total` words takes. */
export function ladderRoundCount(total: number): number {
  return roundSizes(total).length;
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
