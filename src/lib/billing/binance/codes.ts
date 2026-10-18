import { randomInt } from "node:crypto";

import { ORDER_CODE_ALPHABET, ORDER_CODE_LENGTH, ORDER_CODE_PREFIX } from "./constants";

/** A new order code such as "SS-7K3Q2". Drawn with a cryptographic generator, so codes can't be predicted. */
export function generateOrderCode(draw: (max: number) => number = randomInt): string {
  let body = "";
  for (let index = 0; index < ORDER_CODE_LENGTH; index += 1) {
    body += ORDER_CODE_ALPHABET[draw(ORDER_CODE_ALPHABET.length)];
  }
  return `${ORDER_CODE_PREFIX}${body}`;
}

// "SS", then optional separators people type or paste ("SS-7K3Q2", "ss 7k3q2",
// "SS_7K3Q2", "ss7k3q2"), then exactly five symbols of the code alphabet. The
// lookbehind keeps it from matching inside another word ("CLASS ABCDE"), the
// lookahead from matching the first five symbols of something longer.
const CODE_IN_NOTE = new RegExp(
  `(?<![A-Z0-9])SS[\\s\\-_.:#]*([${ORDER_CODE_ALPHABET}]{${ORDER_CODE_LENGTH}})(?![A-Z0-9])`,
  "g",
);

/**
 * Every distinct order code written in a transfer's note, in the canonical
 * form "SS-XXXXX", however the sender spaced or cased it. Notes are free text
 * typed by a stranger, so this only ever looks for the one shape, never trusts
 * anything else in the note.
 */
export function extractOrderCodes(note: string | null | undefined): string[] {
  if (!note) return [];
  const codes = new Set<string>();
  for (const match of note.toUpperCase().matchAll(CODE_IN_NOTE)) {
    codes.add(`${ORDER_CODE_PREFIX}${match[1]}`);
  }
  return [...codes];
}
