import { CODE_ALPHABET, CODE_BODY_LENGTH, CODE_GROUP_SIZE, CODE_LENGTH } from "./constants";

// Safe to import from a client component: no node:crypto here (the generator and the hash live in generate.ts).

const SYMBOLS = CODE_ALPHABET.length;

/**
 * The check symbol for a code body: its symbols' values weighted 1, 2, 3 ... and added up, modulo
 * the alphabet size. The size, 31, is prime, so a different symbol at any position always changes
 * the sum, and two neighbours always carry different weights, so swapping two different neighbours
 * always changes it too. Those are the two slips a person typing a code makes. (The usual Luhn
 * mod-N check does not give that promise for an alphabet of this size, so it is not used.)
 */
export function checkSymbol(body: string): string | null {
  let sum = 0;
  for (let index = 0; index < body.length; index += 1) {
    const point = CODE_ALPHABET.indexOf(body[index]!);
    if (point < 0) return null;
    sum += (index + 1) * point;
  }
  return CODE_ALPHABET[sum % SYMBOLS]!;
}

/** True when the last symbol is the check symbol of the rest. Assumes a canonical code (see normalizeCode). */
export function hasValidChecksum(code: string): boolean {
  if (code.length !== CODE_LENGTH) return false;
  return checkSymbol(code.slice(0, CODE_BODY_LENGTH)) === code[CODE_LENGTH - 1];
}

/** "ABCDEFGHJKMNPQRS" -> "ABCD-EFGH-JKMN-PQRS". */
export function formatCode(code: string): string {
  const groups: string[] = [];
  for (let index = 0; index < code.length; index += CODE_GROUP_SIZE) {
    groups.push(code.slice(index, index + CODE_GROUP_SIZE));
  }
  return groups.join("-");
}

// Everything a person's keyboard, a chat app or a copy-paste can wrap around the symbols: spaces, the
// dashes and dots people add between groups, and the invisible direction marks that Arabic text
// carries along when it is copied (they would otherwise make a correct code look wrong).
const IGNORED =
  /[\s\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff_.:\-\u2010-\u2015\u2212\u066b\u066c]/g;

/** Arabic-Indic (٠-٩) and Persian (۰-۹) digits typed on an Arabic keyboard, as the plain digits the alphabet uses. */
function foldDigits(value: string): string {
  return value.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (digit) => {
    const point = digit.charCodeAt(0);
    return String.fromCharCode((point >= 0x06f0 ? point - 0x06f0 : point - 0x0660) + 48);
  });
}

export type NormalizedCode =
  | { ok: true; code: string }
  | { ok: false; reason: "empty" | "characters" | "length" | "checksum" };

/**
 * What a learner typed or pasted, as the canonical 16-symbol code, or why it can't be one. Case,
 * spacing, dashes, full-width letters, Arabic-Indic digits and direction marks don't matter.
 * Nothing here says whether the code exists: a code with a wrong check symbol is turned away
 * before it costs the learner one of their few failed attempts.
 */
export function normalizeCode(raw: string): NormalizedCode {
  const cleaned = foldDigits(raw.normalize("NFKC")).replace(IGNORED, "").toUpperCase();
  if (cleaned.length === 0) return { ok: false, reason: "empty" };
  for (const symbol of cleaned) {
    if (!CODE_ALPHABET.includes(symbol)) return { ok: false, reason: "characters" };
  }
  if (cleaned.length !== CODE_LENGTH) return { ok: false, reason: "length" };
  if (!hasValidChecksum(cleaned)) return { ok: false, reason: "checksum" };
  return { ok: true, code: cleaned };
}
