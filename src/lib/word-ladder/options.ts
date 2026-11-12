import { splitWordHint } from "@/lib/word-lists-hint";
import { seededShuffle } from "@/lib/word-ladder/random";

/**
 * The choices of the ladder's two multiple-choice steps and the scrambled letters, worked out from
 * the topic's own words (nothing is read from anywhere else). Pure and client-safe.
 */

/** The short term of a word's hint (Arabic, Spanish or Turkish), without its closing full stop: "العمة أو الخالة: أخت والدك." -> "العمة أو الخالة". */
export function termOf(hint: string): string {
  return splitWordHint(hint)
    .term.replace(/[\s.،؛;]+$/u, "")
    .trim();
}

/** The line that explains a term, when the hint has one after its colon. */
export function definitionOf(hint: string): string | undefined {
  return splitWordHint(hint).definition;
}

const sameTerm = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export interface MeaningPoolItem {
  id: string;
  term: string;
  pos?: string | null;
}

/**
 * Four terms to choose a word's meaning from: the right one and three of the topic's other words'
 * terms, the ones of the same type (noun, verb...) first, since "which of these nouns" is the fair
 * question. Fewer when the topic has too few different terms. A seeded order, the right one anywhere.
 */
export function meaningChoices(
  target: { id: string; term: string },
  pool: readonly MeaningPoolItem[],
  targetPos: string | null | undefined,
  seed: string,
  size = 4,
): string[] {
  const others = pool.filter(
    (item) => item.id !== target.id && item.term.length > 0 && !sameTerm(item.term, target.term),
  );
  const samePos = targetPos ? others.filter((item) => item.pos === targetPos) : [];
  const ordered = [
    ...seededShuffle(samePos, `${seed}:same`),
    ...seededShuffle(
      others.filter((item) => !samePos.includes(item)),
      `${seed}:rest`,
    ),
  ];
  const picked: string[] = [];
  for (const item of ordered) {
    if (picked.length >= size - 1) break;
    if (picked.some((term) => sameTerm(term, item.term))) continue;
    picked.push(item.term);
  }
  return seededShuffle([target.term, ...picked], `${seed}:order`);
}

/** Pairs of spellings that really get mixed up: tried at every place they fit. */
const SWAPS: readonly (readonly [string, string])[] = [
  ["ea", "ee"],
  ["ee", "ea"],
  ["ai", "ay"],
  ["ay", "ai"],
  ["oa", "ow"],
  ["ow", "oa"],
  ["ou", "ow"],
  ["ow", "ou"],
  ["ie", "ei"],
  ["ei", "ie"],
  ["oo", "ou"],
  ["au", "aw"],
  ["aw", "au"],
  ["oi", "oy"],
  ["oy", "oi"],
  ["er", "ur"],
  ["ur", "er"],
  ["ir", "er"],
  ["tion", "sion"],
  ["sion", "tion"],
  ["ph", "f"],
  ["f", "ph"],
  ["ck", "k"],
  ["k", "ck"],
  ["c", "k"],
  ["k", "c"],
  ["c", "s"],
  ["s", "c"],
  ["z", "s"],
  ["s", "z"],
  ["g", "j"],
  ["j", "g"],
  ["y", "i"],
  ["i", "y"],
];

const VOWELS = "aeiou";

function replaceAt(word: string, index: number, length: number, text: string): string {
  return word.slice(0, index) + text + word.slice(index + length);
}

/** Near-miss spellings of a word, grouped by the kind of slip, none checked against real words yet. */
export function spellingCandidates(word: string): Record<string, string[]> {
  const kinds: Record<string, string[]> = {
    vowel: [],
    digraph: [],
    double: [],
    silentE: [],
    swap: [],
  };
  for (let i = 0; i < word.length; i++) {
    const char = word[i]!;
    if (VOWELS.includes(char)) {
      for (const other of VOWELS) {
        if (other !== char) kinds.vowel!.push(replaceAt(word, i, 1, other));
      }
    } else {
      kinds.double!.push(replaceAt(word, i, 1, char + char));
    }
    if (i + 1 < word.length && word[i + 1] === char) {
      kinds.double!.push(replaceAt(word, i, 2, char));
    }
    if (i + 1 < word.length && word[i + 1] !== char) {
      kinds.swap!.push(replaceAt(word, i, 2, word[i + 1]! + char));
    }
    for (const [from, to] of SWAPS) {
      if (word.startsWith(from, i)) kinds.digraph!.push(replaceAt(word, i, from.length, to));
    }
  }
  kinds.silentE!.push(word.endsWith("e") ? word.slice(0, -1) : `${word}e`);
  return kinds;
}

/**
 * Four spellings to pick the word you hear from: the right one and three near misses. A near miss is
 * thrown away when it is a real word (`known`: the site's own words), when it SOUNDS like the answer
 * (`ipaOf` gives the same pronunciation: "ant" for "aunt"), or when it is one of the topic's own
 * words, because then the question would have two right answers or none. The slips are taken
 * round-robin across their kinds, so the three are not all the same kind of mistake. Fewer than four
 * when not enough clean ones exist.
 */
export function spellingChoices(
  word: string,
  options: {
    known: ReadonlySet<string>;
    ipaOf?: (word: string) => string | null | undefined;
    seed: string;
    size?: number;
  },
): string[] {
  const size = options.size ?? 4;
  const sound = options.ipaOf?.(word) ?? null;
  const usable = (candidate: string) =>
    candidate !== word &&
    candidate.length >= 2 &&
    /^[a-z]+$/.test(candidate) &&
    !options.known.has(candidate) &&
    !(sound && options.ipaOf?.(candidate) === sound);

  const kinds = Object.entries(spellingCandidates(word)).map(([kind, list]) => ({
    kind,
    list: seededShuffle([...new Set(list.filter(usable))], `${options.seed}:${kind}`),
  }));
  const picked: string[] = [];
  for (let round = 0; picked.length < size - 1; round++) {
    let any = false;
    for (const { list } of seededShuffle(kinds, `${options.seed}:kinds:${round}`)) {
      const candidate = list[round];
      if (candidate === undefined) continue;
      any = true;
      if (!picked.includes(candidate) && picked.length < size - 1) picked.push(candidate);
    }
    if (!any) break;
  }
  return seededShuffle([word, ...picked], `${options.seed}:order`);
}

/** The word's letters in a seeded jumble that is never the word itself (a word of one repeated letter is not scrambled at all: see canScramble). */
export function scrambleLetters(word: string, seed: string): string[] {
  const letters = [...word];
  for (let attempt = 0; attempt < 8; attempt++) {
    const jumbled = seededShuffle(letters, `${seed}:${attempt}`);
    if (jumbled.join("") !== word) return jumbled;
  }
  return [...letters.slice(1), letters[0]!];
}
