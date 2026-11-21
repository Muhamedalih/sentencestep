/**
 * Easy typing for German (permission germanTrack): nobody needs a German keyboard.
 *
 * The learner may type the plain letter for ä, ö, ü (a, o, u) and "ss" for ß, as Duolingo and
 * Babbel accept them, and may also type the real letter or the usual spelled-out form (ae, oe, ue,
 * ss). The sentence stays exactly as written in German: when a plain letter is accepted, the
 * sentence's own letter (ä, ö, ü, ß) is what goes into the typed text, so the display, the backspace
 * rule and the saved text never see a "wrong" spelling.
 *
 * Pure functions only; the typing engine (src/hooks/use-typing-engine.ts) calls them when it is
 * given `foldDiacritics`. English and every other caller never reach this file.
 */

const PLAIN_LETTER: Readonly<Record<string, string>> = { ä: "a", ö: "o", ü: "u", ß: "s" };

/** The extra letter the spelled-out form adds after the plain one: ä → "ae", ö → "oe", ü → "ue", ß → "ss". */
const SPELLED_SECOND_LETTER: Readonly<Record<string, string>> = { ä: "e", ö: "e", ü: "e", ß: "s" };

function lower(char: string): string {
  return char.toLowerCase();
}

/** The plain letter that stands in for a German special letter (any case), or null for every other character. */
export function plainLetterFor(targetChar: string): string | null {
  return PLAIN_LETTER[lower(targetChar)] ?? null;
}

/** Whether `typedChar` is the plain stand-in for the German special letter `targetChar` (a for ä, s for ß...). Case does not matter, as everywhere in the typing engine. */
export function isPlainStandIn(targetChar: string, typedChar: string): boolean {
  const plain = plainLetterFor(targetChar);
  return plain !== null && plain === lower(typedChar);
}

/**
 * After a special letter was accepted through its plain stand-in, the second letter of the spelled-out
 * form ("e" after the a of ae, "s" after the s of ss) is swallowed instead of being a mistake — unless
 * the sentence itself goes on with that very letter (the "e" of "Aerobic"...), in which case it is the
 * real next letter. `nextTargetChar` is the character the sentence has after the special letter.
 */
export function secondLetterToSwallow(
  acceptedTargetChar: string,
  nextTargetChar: string,
): string | null {
  const second = SPELLED_SECOND_LETTER[lower(acceptedTargetChar)] ?? null;
  if (second === null) return null;
  return lower(nextTargetChar) === second ? null : second;
}
