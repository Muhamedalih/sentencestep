import { createHmac, randomInt } from "node:crypto";

import { checkSymbol } from "./code";
import { CODE_ALPHABET, CODE_BODY_LENGTH } from "./constants";

// Server only (node:crypto). The client side of the box needs code.ts alone.

/** One new code: 15 symbols drawn with a cryptographic generator, then the check symbol. */
export function generateCode(draw: (max: number) => number = randomInt): string {
  let body = "";
  for (let index = 0; index < CODE_BODY_LENGTH; index += 1) {
    body += CODE_ALPHABET[draw(CODE_ALPHABET.length)];
  }
  return body + checkSymbol(body);
}

/** `count` different codes (a repeat inside a batch is drawn again, never kept). */
export function generateCodes(
  count: number,
  draw: (max: number) => number = randomInt,
  taken: ReadonlySet<string> = new Set(),
): string[] {
  const codes = new Set<string>();
  let guard = 0;
  while (codes.size < count) {
    guard += 1;
    if (guard > count * 20 + 100) throw new Error("Could not draw enough different codes.");
    const code = generateCode(draw);
    if (!taken.has(code)) codes.add(code);
  }
  return [...codes];
}

/** The secret mixed into every stored hash must be long enough to be a secret. */
export const MIN_PEPPER_LENGTH = 32;

/**
 * What the database keeps instead of the code: an HMAC with a secret held only by the server. A copy
 * of the table is therefore no list of free Premium, and a code can only be looked up by someone who
 * already holds it. The input is the canonical code (normalizeCode), so every way of typing it hashes alike.
 */
export function hashCode(code: string, pepper: string): string {
  if (pepper.length < MIN_PEPPER_LENGTH) {
    throw new Error(`The code pepper must be at least ${MIN_PEPPER_LENGTH} characters.`);
  }
  return createHmac("sha256", pepper).update(`redeem-code:v1:${code}`).digest("hex");
}
