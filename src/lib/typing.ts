export type LetterState = "correct" | "current" | "error" | "pending";

/**
 * Splits a sentence into word and single-space tokens so word-wrapping only
 * happens between words — each word's letters render inside their own
 * whitespace-nowrap span so long sentences never break mid-word.
 */
export function tokenize(target: string): string[] {
  return target.match(/\S+|\s/g) ?? [];
}

/** Per-character visual state, derived from how much of the target has been typed correctly. */
export function getLetterStates(
  target: string,
  typed: string,
  errorIndex: number | null,
): LetterState[] {
  return target.split("").map((_char, index) => {
    if (errorIndex === index) return "error";
    if (index < typed.length) return "correct";
    if (index === typed.length) return "current";
    return "pending";
  });
}
