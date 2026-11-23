/**
 * Word Drop, the falling-words typing game: the rules that do not need a screen. Pure and
 * client-safe, so the game component, the page that builds the word pool and the tests share them.
 */

export const WORD_DROP_MODES = ["easy", "mid", "hard"] as const;
export type WordDropMode = (typeof WORD_DROP_MODES)[number];

export function isWordDropMode(value: unknown): value is WordDropMode {
  return typeof value === "string" && (WORD_DROP_MODES as readonly string[]).includes(value);
}

/** One word of the pool: the English word, its short Arabic (or Spanish/Turkish) meaning and, when it has one, its stored clip. */
export interface DropWord {
  id: string;
  en: string;
  meaning: string;
  /** The word's own sentence with the word filled in, kept for «كلماتي» when the learner saves it. */
  sentence: string | null;
  audioUrl: string | null;
}

export const ROUND_SECONDS = 120;
export const START_LIVES = 3;
/** How many words can be on screen at once. */
export const MAX_ON_SCREEN = 4;
/** Hard mode needs a clip for every word it asks; with fewer than this many words that have one, it stays closed. */
export const MIN_HARD_WORDS = 8;
/** The speed factor's bounds: the round starts at 1, rises after correct words and falls after a miss. */
export const SPEED_MIN = 0.7;
export const SPEED_MAX = 1.8;

/** A word the game can ask: lower-case letters only, 3 to 10 of them, so it can fall and be typed on a phone. */
export function isDroppable(word: string): boolean {
  return /^[a-z]{3,10}$/.test(word);
}

/**
 * The word's short meaning, cut from the Word Lists hint: the hint explains the word in a sentence
 * ("العمة أو الخالة: أخت والدك أو والدتك."), a falling tile only has room for the first part.
 */
export function shortMeaning(hint: string, max = 22): string {
  const text = hint.replace(/\s+/g, " ").trim();
  const cut = text.split(/[:：.،؛;(؟?]/)[0]?.trim() ?? "";
  const first = cut.length > 0 ? cut : text;
  return first.length > max ? `${first.slice(0, max - 1).trim()}…` : first;
}

export function speedAfterCorrect(factor: number): number {
  return Math.min(SPEED_MAX, factor + 0.05);
}

export function speedAfterMiss(factor: number): number {
  return Math.max(SPEED_MIN, factor - 0.1);
}

/** Points for a correct word: 10, plus 2 for each word of the current combo (the combo counts up to 10). */
export function pointsFor(combo: number): number {
  return 10 + Math.min(combo, 10) * 2;
}

/** Share of typed letters that were right, as a whole percent; a round with nothing typed reads 100. */
export function accuracyPercent(typed: number, wrong: number): number {
  if (typed <= 0) return 100;
  return Math.max(0, Math.round(((typed - wrong) / typed) * 100));
}

/** Words a minute, counting five letters as one word, over the seconds the round actually ran (at least 15, so a short round is not blown up). */
export function wordsPerMinute(correctLetters: number, secondsPlayed: number): number {
  const minutes = Math.max(15, secondsPlayed) / 60;
  return Math.round(correctLetters / 5 / minutes);
}

/** Seconds between two new words: shorter as the speed factor rises. */
export function spawnGapMs(factor: number): number {
  return 2400 / factor;
}

/** The word the typed letters belong to: among the falling words that start with them, the one closest to the bottom. */
export function pickTarget<T extends { en: string; y: number }>(
  typed: string,
  falling: readonly T[],
): T | null {
  if (typed.length === 0) return null;
  let best: T | null = null;
  for (const word of falling) {
    if (!word.en.startsWith(typed)) continue;
    if (best === null || word.y > best.y) best = word;
  }
  return best;
}

/** A shuffled pool that never runs dry: it reshuffles when empty, and a missed word is slipped back in a few words from now. */
export interface Deck {
  next(): DropWord;
  /** Brings a missed word back sooner (after about `after` more words). */
  requeue(word: DropWord, after?: number): void;
}

export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function createDeck(pool: readonly DropWord[], random: () => number = Math.random): Deck {
  if (pool.length === 0) throw new Error("A Word Drop deck needs at least one word.");
  let queue: DropWord[] = [];
  let last: string | null = null;
  return {
    next() {
      if (queue.length === 0) queue = shuffled(pool, random);
      // The same word twice in a row would be two tiles of one word on the screen: skip to the next one.
      let index = 0;
      if (queue[0]!.id === last && queue.length > 1) index = 1;
      const [word] = queue.splice(index, 1);
      last = word!.id;
      return word!;
    },
    requeue(word, after = 4) {
      queue = queue.filter((candidate) => candidate.id !== word.id);
      queue.splice(Math.min(after, queue.length), 0, word);
    },
  };
}

/** Builds the pool the page hands to the game: droppable words only, one per spelling, in the order given. */
export function buildPool(
  words: readonly {
    id: string;
    targetWord: string;
    hintAr: string;
    supportHint?: string;
    sentence: string;
  }[],
  clips: ReadonlyMap<string, string>,
): DropWord[] {
  const seen = new Set<string>();
  const pool: DropWord[] = [];
  for (const word of words) {
    const en = word.targetWord.trim().toLowerCase();
    if (!isDroppable(en) || seen.has(en)) continue;
    const meaning = shortMeaning(word.supportHint?.trim() ? word.supportHint : word.hintAr);
    if (meaning.length === 0) continue;
    seen.add(en);
    pool.push({
      id: word.id,
      en,
      meaning,
      sentence: word.sentence.includes("___") ? word.sentence.replace("___", en) : null,
      audioUrl: clips.get(word.targetWord) ?? clips.get(en) ?? null,
    });
  }
  return pool;
}
