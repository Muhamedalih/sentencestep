/**
 * Prepared sentences: the sentences written for a rule (teach.ts, `items`), read into what a question needs.
 * A sentence has one blank in [brackets]: the first answer inside is the one shown when the blank is
 * revealed, the others (after "|") are also accepted. A {hint} at the end is shown with the blank and is not
 * part of the sentence (it is not read aloud): "I like [swimming] in summer.{swim}".
 */

export interface PreparedItem {
  /** The sentence as it is read aloud: the first answer in place of the blank, without the hint. */
  text: string;
  before: string;
  /** The answer shown and used for the hint. */
  answer: string;
  /** Every answer that is right, the shown one first. */
  answers: string[];
  after: string;
  hint?: string;
}

/** The sentence in its written form, or null when it does not have exactly one blank with an answer in it. */
export function parsePrepared(raw: string): PreparedItem | null {
  const hintAt = /\{([^{}]*)\}\s*$/.exec(raw);
  const hint = hintAt?.[1]?.trim();
  const body = (hintAt ? raw.slice(0, hintAt.index) : raw).trimEnd();
  const open = body.indexOf("[");
  const close = body.indexOf("]", open + 1);
  if (open < 0 || close < 0 || body.indexOf("[", close) >= 0 || body.indexOf("]", close + 1) >= 0)
    return null;
  const answers = body
    .slice(open + 1, close)
    .split("|")
    .map((answer) => answer.trim())
    .filter((answer) => answer.length > 0);
  if (answers.length === 0) return null;
  const before = body.slice(0, open);
  const after = body.slice(close + 1);
  return {
    text: before + answers[0] + after,
    before,
    answer: answers[0]!,
    answers,
    after,
    ...(hint ? { hint } : {}),
  };
}
