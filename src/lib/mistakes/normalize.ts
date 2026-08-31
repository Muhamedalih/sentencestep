/**
 * The word's identity for "Fix Your Mistakes" — sentences have no stable
 * per-word id in the existing schema, so the word's own normalized text is
 * the strongest identifier available (see the migration's own doc comment).
 * Lowercased so "Went"/"went" collapse to the same item; leading/trailing
 * punctuation stripped (a sentence-final "yesterday." must match a
 * mid-sentence "yesterday") while internal characters — including
 * apostrophes ("don't") and hyphens ("well-known") — are left alone, since
 * those are part of the word itself, not incidental punctuation around it.
 */
export function normalizeMistakeWord(word: string): string {
  return word
    .trim()
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

/** True for a token worth tracking as a mistake — excludes standalone punctuation/symbol tokens (e.g. an em dash typed as its own word) that normalize to nothing or contain no actual letters. */
export function isTrackableWord(word: string): boolean {
  const normalized = normalizeMistakeWord(word);
  return normalized.length > 0 && /\p{L}/u.test(normalized);
}
