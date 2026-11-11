import { CORE_WORDS } from "@/lib/word-bank/core-words";
import type { CoreWord } from "@/lib/word-bank/core-words";
import type { BankWordState } from "@/lib/word-bank/select";

/**
 * The core words in sets of eight, and how far a learner has got through them. Pure: the page reads
 * the learner's bank rows once and this only counts them.
 *
 * A set is eight words typed in their home sentences in one short round (the bank's own review
 * screen); the first answer to each word puts it in the learner's bank, where it waits its turn like
 * any other word (see shelves.ts), so learning a set can never pile words up. The shelf is in three
 * levels of about a third of the sets each, and the first set of each level is free.
 */

/** Words in one set. */
export const CORE_SET_SIZE = 8;
/** The shelf has three levels (the same three as Word Lists). */
export const CORE_LEVELS = [1, 2, 3] as const;
export type CoreLevel = (typeof CORE_LEVELS)[number];

export interface CoreSet {
  /** 1-based, in frequency order. */
  n: number;
  level: CoreLevel;
  /** The first set of each level is free; the rest are Premium. */
  free: boolean;
  words: readonly CoreWord[];
}

function buildSets(words: readonly CoreWord[]): CoreSet[] {
  const count = Math.ceil(words.length / CORE_SET_SIZE);
  const perLevel = Math.max(1, Math.floor(count / CORE_LEVELS.length));
  const sets: CoreSet[] = [];
  for (let index = 0; index < count; index++) {
    const level = Math.min(CORE_LEVELS.length, Math.floor(index / perLevel) + 1) as CoreLevel;
    sets.push({
      n: index + 1,
      level,
      free: index % perLevel === 0 && index / perLevel < CORE_LEVELS.length,
      words: words.slice(index * CORE_SET_SIZE, (index + 1) * CORE_SET_SIZE),
    });
  }
  return sets;
}

export const CORE_SETS: readonly CoreSet[] = buildSets(CORE_WORDS);

/** The set with this number, or undefined for a number outside the shelf. */
export function coreSet(n: number): CoreSet | undefined {
  return Number.isInteger(n) ? CORE_SETS[n - 1] : undefined;
}

/** How a learner stands on one set: how many of its words are already in their bank. */
export interface CoreSetProgress {
  n: number;
  level: CoreLevel;
  free: boolean;
  size: number;
  inBank: number;
}

export interface CoreProgress {
  sets: CoreSetProgress[];
  /** Core words in the learner's bank, whichever way they got there. */
  inBank: number;
  total: number;
  /** The first set that is not finished yet (the one the shelf says to carry on with), or null when every set is. */
  currentN: number | null;
}

/** The learner's rows (only the words are read) against the shelf. */
export function coreProgress(states: readonly Pick<BankWordState, "word">[]): CoreProgress {
  const have = new Set(states.map((state) => state.word));
  let inBank = 0;
  let currentN: number | null = null;
  const sets = CORE_SETS.map((set) => {
    const here = set.words.filter((word) => have.has(word.word)).length;
    inBank += here;
    if (currentN === null && here < set.words.length) currentN = set.n;
    return { n: set.n, level: set.level, free: set.free, size: set.words.length, inBank: here };
  });
  return { sets, inBank, total: CORE_WORDS.length, currentN };
}

/**
 * A set's words as the bank's round builder takes them: new words (strength 0) of today, each with its
 * meaning and home sentence, filed under the set's name. Only the first answer puts a word in the
 * bank, with this context (the database keeps the first meeting's context and never overwrites it).
 */
export function coreSetStates(set: CoreSet, todayISO: string): BankWordState[] {
  return set.words.map((word) => ({
    word: word.word,
    strength: 0,
    dueOn: todayISO,
    lastReviewedOn: todayISO,
    source: "core",
    lessonId: `core-${set.n}`,
    lessonTitle: `Core words ${set.n}`,
    ar: word.ar,
    homeSentence: word.home,
    firstSeenOn: todayISO,
  }));
}
