/** Small pure text helpers shared by the content validator and the server query that finds a word's context line. */

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True when `word` appears as a whole word (case-insensitive) in `text` — "plan" is in "a plan:" but not in "planet". */
export function containsWholeWord(text: string, word: string): boolean {
  return new RegExp(`(^|[^\\p{L}'])${escapeRegExp(word)}($|[^\\p{L}'])`, "iu").test(text);
}

/**
 * Splits a line around the first whole-word occurrence of `word`, so the UI can
 * draw that word highlighted: [before, match, after]. Null when it does not
 * occur (the caller then shows the line plain).
 */
export function splitAroundWord(text: string, word: string): [string, string, string] | null {
  const match = new RegExp(`(^|[^\\p{L}'])(${escapeRegExp(word)})(?=$|[^\\p{L}'])`, "iu").exec(
    text,
  );
  if (!match || match.index === undefined) return null;
  const start = match.index + (match[1]?.length ?? 0);
  const matched = match[2] ?? word;
  return [text.slice(0, start), matched, text.slice(start + matched.length)];
}
