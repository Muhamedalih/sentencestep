import { normalizeDictationToken } from "@/lib/features/dictation";
import { normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { isImportantWord } from "@/lib/today/important-words";

/**
 * Partial dictation, the first of the three review forms: the learner hears the sentence and sees
 * it with one or two words missing, and types what is missing. Pure — which words are hidden, and
 * whether what was typed is right. The sentence is cut into the pieces the learner sees (the
 * whitespace-separated ones, punctuation attached: "tea," "Tom!"), and a hidden piece keeps its
 * punctuation around the blank, so only the word itself has to be typed.
 */

/** One whitespace-separated piece of a sentence, as written. */
export interface SentenceToken {
  /** The piece exactly as written ("tea," / "Tom!"). */
  text: string;
  /** The punctuation before the word. */
  before: string;
  /** The word itself (letters and digits, apostrophes and hyphens inside it stay); empty for a piece with none, like a lone dash. */
  core: string;
  /** The punctuation after the word. */
  after: string;
}

const TOKEN_SHAPE = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u;

export function sentenceTokens(en: string): SentenceToken[] {
  return en
    .trim()
    .split(/\s+/)
    .filter((text) => text.length > 0)
    .map((text) => {
      const match = TOKEN_SHAPE.exec(text);
      return { text, before: match?.[1] ?? "", core: match?.[2] ?? text, after: match?.[3] ?? "" };
    });
}

/** The most words a partial dictation hides. */
export const PARTIAL_MAX_BLANKS = 2;

/** A word the learner can type as one: letters and digits (an apostrophe inside is fine), no hyphen, at least three characters. */
function isHideable(token: SentenceToken): boolean {
  return /^[\p{L}\p{N}'’]+$/u.test(token.core) && normalizeDictationToken(token.core).length >= 3;
}

/** FNV-1a: a tiny stable hash, enough to vary the choice between reviews without ever being random. */
function hash(text: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

export interface MaskOptions {
  /** Where the sentence stands (0 = new or just missed): a sentence at 1 or more, long enough, hides two words instead of one. */
  strength?: number;
  /** The learner's weak words, normalized: a hidden word is one of these when the sentence has one. */
  weakWords?: ReadonlySet<string>;
  /** Varies the choice from one review of a sentence to the next (and for the second chance after a miss). */
  seed?: string;
  /** Pieces to hide last — the ones just asked, so a second chance does not repeat the word the learner has just been shown. */
  avoid?: readonly number[];
}

/**
 * Which pieces (indexes into sentenceTokens) the partial dictation hides: one word for a sentence at
 * strength 0 or a short one, two for a longer sentence at strength 1. Content words come first — a
 * blank on "the" tests nothing — the learner's weak words before the others, and then a stable
 * hash of the seed picks, so the same review always hides the same words and the next review of
 * the sentence may hide others. A sentence with no content word hides its longest word; one with
 * no word at all hides nothing.
 */
export function maskedTokenIndexes(en: string, options: MaskOptions = {}): number[] {
  const tokens = sentenceTokens(en);
  const seed = options.seed ?? en;
  const weakWords = options.weakWords;
  const count = (options.strength ?? 0) >= 1 && tokens.length >= 6 ? PARTIAL_MAX_BLANKS : 1;

  const hideable = tokens.flatMap((token, index) => (isHideable(token) ? [{ token, index }] : []));
  if (hideable.length === 0) {
    const longest = tokens
      .flatMap((token, index) => (token.core ? [{ token, index }] : []))
      .sort((a, b) => b.token.core.length - a.token.core.length || a.index - b.index)[0];
    return longest ? [longest.index] : [];
  }

  const rank = ({ token, index }: { token: SentenceToken; index: number }) => ({
    index,
    avoided: options.avoid?.includes(index) === true,
    important: isImportantWord(token.core),
    weak: weakWords?.has(normalizeMistakeWord(token.core)) === true,
    order: hash(`${seed}:${index}`),
  });
  const picked = hideable
    .map(rank)
    .sort(
      (a, b) =>
        Number(b.important) - Number(a.important) ||
        Number(a.avoided) - Number(b.avoided) ||
        Number(b.weak) - Number(a.weak) ||
        a.order - b.order,
    )
    .slice(0, count)
    .map((entry) => entry.index);
  return picked.sort((a, b) => a - b);
}

export interface MaskedAnswer {
  /** Every hidden word was typed right (case and punctuation never matter). */
  exact: boolean;
  /** One entry per hidden word, in the order they were asked. */
  correct: boolean[];
  /** The sentence as the learner completed it, to lay beside the real one. */
  sentence: string;
}

/** Checks what was typed into the blanks: `typed[n]` answers the n-th index of `masked`. */
export function gradeMasked(
  en: string,
  masked: readonly number[],
  typed: readonly string[],
): MaskedAnswer {
  const tokens = sentenceTokens(en);
  const correct = masked.map((tokenIndex, position) => {
    const expected = normalizeDictationToken(tokens[tokenIndex]?.core ?? "");
    return expected !== "" && normalizeDictationToken((typed[position] ?? "").trim()) === expected;
  });
  const sentence = tokens
    .map((token, index) => {
      const position = masked.indexOf(index);
      if (position < 0) return token.text;
      return `${token.before}${(typed[position] ?? "").trim()}${token.after}`;
    })
    .join(" ");
  return { exact: correct.length > 0 && correct.every(Boolean), correct, sentence };
}
