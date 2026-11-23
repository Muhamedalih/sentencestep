/**
 * Word Drop, the falling-words typing game: the rules that do not need a screen. Pure and
 * client-safe, so the game component, the page that builds the word pool and the tests share them.
 */

export const WORD_DROP_MODES = ["easy", "mid", "hard", "sentences"] as const;
export type WordDropMode = (typeof WORD_DROP_MODES)[number];

export function isWordDropMode(value: unknown): value is WordDropMode {
  return typeof value === "string" && (WORD_DROP_MODES as readonly string[]).includes(value);
}

/** One word of the pool: the English word (or, in sentences mode, a whole short sentence), its short Arabic (or Spanish/Turkish) meaning and, when it has one, its stored clip. */
export interface DropWord {
  id: string;
  /** What is typed: lower-case letters of one word, or (sentences mode) 3 to 6 words separated by single spaces. */
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
/**
 * The speed factor's bounds: the round starts at 1, rises a little after each correct word and falls
 * after a miss. Tuned with a model of a learner who works the lowest tile first (a reaction time plus
 * so much a letter): a below-average typist (about 3.5 s for a 6-letter word) lasts the whole round, a
 * slow one (about 4.5 s) nearly does, and a fast one is pushed up towards the top speed.
 */
export const SPEED_MIN = 0.6;
export const SPEED_MAX = 1.8;
export const SPEED_UP = 0.02;
export const SPEED_DOWN = 0.15;
/** The gap between two new words at speed 1. */
export const BASE_GAP_MS = 4800;
/** The most words a round can ever hold: the quickest spawn gap fills the round, plus the tiles that can be on screen at once. No honest score has more correct words than this. */
export const MAX_ROUND_WORDS =
  Math.ceil((ROUND_SECONDS * 1000) / (BASE_GAP_MS / SPEED_MAX)) + MAX_ON_SCREEN + 1;
/** Sentences mode: the sentence's length in words, and the level it opens at. */
export const SENTENCE_MIN_WORDS = 3;
export const SENTENCE_MAX_WORDS = 6;
/** Sentences mode needs at least this many sentences in the pool, or it stays closed (like Hard without clips). */
export const MIN_SENTENCES = 8;
export const SENTENCE_MIN_LEVEL = 2;

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

/**
 * A short sentence the game can ask, as it is typed: letters and single spaces only (a full stop, a
 * question mark and a comma at the end are dropped; an apostrophe, a digit or any other mark keeps
 * the sentence out, so a phone keyboard never needs a symbol page), 3 to 6 words. Returns null when
 * the text does not fit.
 */
export function sentenceForDrop(text: string): string | null {
  const plain = text
    .replace(/[.!?,;:]+(\s|$)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!/^[a-z]+( [a-z]+)*$/.test(plain)) return null;
  const count = plain.split(" ").length;
  if (count < SENTENCE_MIN_WORDS || count > SENTENCE_MAX_WORDS) return null;
  return plain.length <= 40 ? plain : null;
}

/** How many words a typed text holds: 1 for a word, 3 to 6 for a sentence. */
export function wordCountOf(text: string): number {
  return text.split(" ").filter((part) => part.length > 0).length;
}

/** Points for a correct word: 10, plus 2 for each word of the current combo (the combo counts up to 10); a sentence adds 6 for each word after its first. */
export function pointsForText(combo: number, words: number): number {
  return pointsFor(combo) + Math.max(0, words - 1) * 6;
}

export function speedAfterCorrect(factor: number): number {
  return Math.min(SPEED_MAX, factor + SPEED_UP);
}

export function speedAfterMiss(factor: number): number {
  return Math.max(SPEED_MIN, factor - SPEED_DOWN);
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
  return BASE_GAP_MS / factor;
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
  /** The word the next call to next() will give, without taking it. */
  peek(): DropWord;
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

export function createDeck(
  pool: readonly DropWord[],
  random: () => number = Math.random,
  /** Ids of words that come first in the opening queue (the learner's own words), in a shuffled order of their own; later reshuffles treat every word alike. */
  priority: ReadonlySet<string> = new Set(),
): Deck {
  if (pool.length === 0) throw new Error("A Word Drop deck needs at least one word.");
  const opening = () => [
    ...shuffled(
      pool.filter((word) => priority.has(word.id)),
      random,
    ),
    ...shuffled(
      pool.filter((word) => !priority.has(word.id)),
      random,
    ),
  ];
  let queue: DropWord[] = opening();
  let last: string | null = null;
  // The same word twice in a row would be two tiles of one word on the screen: skip to the next one.
  const indexOfNext = () => (queue[0]!.id === last && queue.length > 1 ? 1 : 0);
  const refill = () => {
    if (queue.length === 0) queue = shuffled(pool, random);
  };
  return {
    peek() {
      refill();
      return queue[indexOfNext()]!;
    },
    next() {
      refill();
      const [word] = queue.splice(indexOfNext(), 1);
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

/** What the page needs to know about a Word Lists group to decide which ones to read. */
export interface GroupRef {
  id: string;
  level: number;
  order: number;
}

/**
 * The order a level's groups are drawn in: the level's own groups first, then the levels below it
 * (the nearest first), then the levels above it (the nearest first), each by the group's own order.
 * A learner who has only one group of their level still gets a full pool from its neighbours, and the
 * order is the same for everyone, so a seeded round deals the same words to every player.
 */
export function orderGroupsForLevel<T extends GroupRef>(groups: readonly T[], level: number): T[] {
  const rank = (group: T) =>
    group.level === level
      ? 0
      : group.level < level
        ? level - group.level
        : 10 + (group.level - level);
  return [...groups].sort(
    (a, b) => rank(a) - rank(b) || a.order - b.order || a.id.localeCompare(b.id),
  );
}

/** How many words a round wants to draw from before the page stops reading groups. */
export const WANTED_WORDS = 50;
/** The most words kept in a pool. */
export const MAX_POOL = 70;

/** One word of the learner's own bank («كلماتي»), as the page reads it. */
export interface PersonalWord {
  word: string;
  ar: string;
  homeSentence: string | null;
}

/** The learner's own words as a pool: droppable ones with a short meaning, one per spelling. */
export function buildPersonalPool(
  rows: readonly PersonalWord[],
  clips: ReadonlyMap<string, string>,
): DropWord[] {
  const seen = new Set<string>();
  const pool: DropWord[] = [];
  for (const row of rows) {
    const en = row.word.trim().toLowerCase();
    if (!isDroppable(en) || seen.has(en)) continue;
    const meaning = shortMeaning(row.ar);
    if (meaning.length === 0) continue;
    seen.add(en);
    pool.push({
      id: `bank:${en}`,
      en,
      meaning,
      sentence:
        row.homeSentence && row.homeSentence.toLowerCase().includes(en) ? row.homeSentence : null,
      audioUrl: clips.get(en) ?? null,
    });
  }
  return pool;
}

/** The learner's own words first, then the level's words that are not among them. */
export function mergePools(personal: readonly DropWord[], level: readonly DropWord[]): DropWord[] {
  const own = new Set(personal.map((word) => word.en));
  return [...personal, ...level.filter((word) => !own.has(word.en))].slice(0, MAX_POOL);
}

/** A tile's size in pixels as the game draws it: fixed up front so two tiles can be kept apart without measuring the screen. */
export interface TileSize {
  w: number;
  h: number;
  /** The font size of the tile's main line. */
  font: number;
}

export const TILE_MIN_WIDTH = 96;
const WORD_TILE_HEIGHT = 74;
const SENTENCE_TILE_HEIGHT = 92;

export function tileSize(mode: WordDropMode, word: DropWord, fieldWidth: number): TileSize {
  const room = Math.max(TILE_MIN_WIDTH, fieldWidth - 8);
  if (mode === "sentences") return { w: Math.min(room, 300), h: SENTENCE_TILE_HEIGHT, font: 16 };
  const main = mode === "mid" ? word.meaning.length * 11.5 : word.en.length * 12.5;
  const sub = mode === "easy" ? word.meaning.length * 7.5 : 0;
  const w = Math.ceil(Math.max(TILE_MIN_WIDTH, main + 40, sub + 40));
  return { w: Math.min(w, room), h: WORD_TILE_HEIGHT, font: 19 };
}

/** A tile on the field: the left edge, the top, and its size. */
export interface Placed {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Where a new tile appears: the top of the field, just above the edge. */
export const SPAWN_Y = -10;
/** The clear space kept around two tiles. */
const TILE_GAP = 8;

/**
 * A left edge for a new tile that does not sit on any tile still near the top. Every tile falls at
 * the same speed, so tiles that do not overlap when the new one appears never overlap later: this is
 * the only check needed. Tries random places first, then a sweep across the field; null when the
 * tiles near the top leave no room (the game waits a moment and asks again).
 */
export function findSpot(args: {
  fieldWidth: number;
  tile: { w: number; h: number };
  others: readonly Placed[];
  rand: () => number;
}): number | null {
  const { fieldWidth, tile, others, rand } = args;
  const span = Math.max(0, fieldWidth - tile.w);
  const near = others.filter(
    (other) => other.y < SPAWN_Y + tile.h + TILE_GAP && other.y + other.h + TILE_GAP > SPAWN_Y,
  );
  const free = (x: number) =>
    near.every((other) => x + tile.w + TILE_GAP <= other.x || x >= other.x + other.w + TILE_GAP);
  for (let tries = 0; tries < 10; tries += 1) {
    const x = Math.round(rand() * span);
    if (free(x)) return x;
  }
  for (let step = 0; step <= 8; step += 1) {
    const x = Math.round((span * step) / 8);
    if (free(x)) return x;
  }
  return null;
}
