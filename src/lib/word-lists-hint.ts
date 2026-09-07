/**
 * Splits a word's `hintAr`/`supportHint` into a short "term" and a longer
 * definition, on the first colon — the shape most of the word-lists content
 * already uses (e.g. "الجد: والد والدك أو والدتك."). A hint with no colon
 * (many shorter entries, e.g. "الزوجة.") has nothing to split — it IS the
 * term, with no separate definition line to show underneath. Shared by
 * VocabularyLearn (term above the word, definition below it) and
 * VocabularyPractice's support-hint display, so the two screens read the
 * same content the same way.
 *
 * Deliberately its own tiny client-safe module rather than a colocated
 * export from src/lib/word-lists.ts — that file also re-exports the
 * session-aware, server-only getWordGroupById, and both Learn and Practice
 * are Client Components that need this helper directly.
 */
export function splitWordHint(hint: string): { term: string; definition?: string } {
  const colonIndex = hint.indexOf(":");
  if (colonIndex === -1) return { term: hint };
  return {
    term: hint.slice(0, colonIndex).trim(),
    definition: hint.slice(colonIndex + 1).trim() || undefined,
  };
}
