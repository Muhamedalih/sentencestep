/**
 * The short Arabic meaning written on a word card of Home's words section. It is the word's own
 * `hint_ar` (vocabulary_words), written as a sentence ("الزوجة."), so the full stop at its end is
 * dropped for a card, and an empty or oversized hint is left out (the card then shows the word alone).
 */

/** A hint longer than this is an explanation, not a meaning: it does not fit a card. */
export const MAX_CARD_HINT_LENGTH = 48;

export function cardHint(hint: string | null | undefined): string | null {
  if (typeof hint !== "string") return null;
  const text = hint
    .trim()
    .replace(/[.。]+$/u, "")
    .trim();
  if (text.length === 0 || text.length > MAX_CARD_HINT_LENGTH) return null;
  return text;
}
