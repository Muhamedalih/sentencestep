/**
 * Words of a sentence, and what a typed answer says about the word it was asked for.
 *
 * A word is letters with apostrophes inside them (don't, Tom's, it's), or a run of digits (at 5).
 * Answers are compared exactly once case, curly quotes and edge spaces are set aside: a grammar
 * drill is about the form of the word, so a near miss such as "start" for "starts" is NOT a typo to
 * forgive. Instead the diagnosis names the ending that is missing or extra, which is the teaching.
 */

export interface Token {
  /** The word as written in the sentence. */
  text: string;
  /** Lower case, with a straight apostrophe. */
  lower: string;
  /** Character offsets in the sentence (end is exclusive). */
  start: number;
  end: number;
}

const WORD = /[A-Za-z]+(?:['’][A-Za-z]+)*|\d+/g;

export function tokenize(sentence: string): Token[] {
  const tokens: Token[] = [];
  for (const match of sentence.matchAll(WORD)) {
    const text = match[0];
    const start = match.index ?? 0;
    tokens.push({
      text,
      lower: text.replace(/’/g, "'").toLowerCase(),
      start,
      end: start + text.length,
    });
  }
  return tokens;
}

/** The sentence split around one token, so a blank can take its place. */
export function aroundToken(sentence: string, token: Token): { before: string; after: string } {
  return { before: sentence.slice(0, token.start), after: sentence.slice(token.end) };
}

/** What a learner typed, prepared for comparison: NFKC, straight quotes, single spaces, no edge punctuation. */
export function normalizeAnswer(typed: string): string {
  return typed
    .normalize("NFKC")
    .replace(/[‘’`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[.!?,;:]+$/, "");
}

/** What is wrong with a typed answer, when it is wrong: the one thing the card explains. */
export type Diagnosis = "correct" | "missing-s" | "missing-ed" | "extra-s" | "a-an" | "other";

export function diagnose(typed: string, target: string): Diagnosis {
  const got = normalizeAnswer(typed);
  const want = target.toLowerCase();
  if (got === want) return "correct";
  if (want.endsWith("ed") && (got === want.slice(0, -2) || got === want.slice(0, -1)))
    return "missing-ed";
  if (want.endsWith("s") && got === want.slice(0, -1)) return "missing-s";
  if (got === `${want}s`) return "extra-s";
  if ((want === "an" && got === "a") || (want === "a" && got === "an")) return "a-an";
  return "other";
}

/**
 * The same, against every answer that is right (a prepared sentence may accept more than one: "isn't" and
 * "is not"): correct when any of them matches, otherwise the first hint any of them gives, "other" if none.
 */
export function diagnoseAny(typed: string, answers: readonly string[]): Diagnosis {
  let hint: Diagnosis = "other";
  for (const answer of answers) {
    const result = diagnose(typed, answer);
    if (result === "correct") return "correct";
    if (hint === "other") hint = result;
  }
  return hint;
}
