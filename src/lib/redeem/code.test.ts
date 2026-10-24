import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { checkSymbol, formatCode, hasValidChecksum, normalizeCode } from "./code";
import { CODE_ALPHABET, CODE_BODY_LENGTH, CODE_LENGTH } from "./constants";
import { generateCode, generateCodes, hashAddress, hashCode } from "./generate";

/** A fixed code for the examples: built from a body so its check symbol is the real one. */
const BODY = "ABCDEFGHJKMNPQR";
const CODE = BODY + checkSymbol(BODY);

describe("check symbol", () => {
  it("makes a code of 16 symbols that validates", () => {
    assert.equal(CODE.length, CODE_LENGTH);
    assert.ok(hasValidChecksum(CODE));
  });

  it("is a symbol of the alphabet, and null for a body outside it", () => {
    assert.ok(CODE_ALPHABET.includes(checkSymbol(BODY)!));
    assert.equal(checkSymbol("ABC0"), null);
  });

  it("catches every single wrong symbol at every position", () => {
    for (let position = 0; position < CODE_LENGTH; position += 1) {
      for (const symbol of CODE_ALPHABET) {
        if (symbol === CODE[position]) continue;
        const typo = CODE.slice(0, position) + symbol + CODE.slice(position + 1);
        assert.equal(hasValidChecksum(typo), false, `${typo} should be refused`);
      }
    }
  });

  it("catches every swap of two different neighbouring symbols of the body", () => {
    // Over a few codes, so the positions meet many different pairs.
    for (const seed of [0, 3, 7, 11, 19]) {
      const body = [...Array(CODE_BODY_LENGTH).keys()]
        .map((index) => CODE_ALPHABET[(index * 5 + seed + (index % 3)) % CODE_ALPHABET.length])
        .join("");
      const code = body + checkSymbol(body);
      for (let position = 0; position < CODE_BODY_LENGTH - 1; position += 1) {
        if (code[position] === code[position + 1]) continue;
        const swapped =
          code.slice(0, position) + code[position + 1] + code[position] + code.slice(position + 2);
        assert.equal(hasValidChecksum(swapped), false, `${swapped} should be refused`);
      }
    }
  });
});

describe("formatCode", () => {
  it("groups the symbols by four", () => {
    assert.equal(
      formatCode(CODE),
      `${CODE.slice(0, 4)}-${CODE.slice(4, 8)}-${CODE.slice(8, 12)}-${CODE.slice(12)}`,
    );
  });
});

describe("normalizeCode", () => {
  it("accepts the canonical form and the shown form alike", () => {
    assert.deepEqual(normalizeCode(CODE), { ok: true, code: CODE });
    assert.deepEqual(normalizeCode(formatCode(CODE)), { ok: true, code: CODE });
  });

  it("ignores case, spaces, other dashes and dots", () => {
    const messy = ` ${formatCode(CODE).toLowerCase().replaceAll("-", " – ")} .`;
    assert.deepEqual(normalizeCode(messy), { ok: true, code: CODE });
  });

  it("ignores the invisible direction marks that copied Arabic text carries", () => {
    const marked = `\u200f${CODE.slice(0, 8)}\u200e\u202b${CODE.slice(8)}\u202c\ufeff`;
    assert.deepEqual(normalizeCode(marked), { ok: true, code: CODE });
  });

  it("reads full-width letters", () => {
    const wide = [...CODE]
      .map((symbol) => String.fromCharCode(symbol.charCodeAt(0) + 0xfee0))
      .join("");
    assert.deepEqual(normalizeCode(wide), { ok: true, code: CODE });
  });

  it("reads Arabic-Indic and Persian digits as the digits they are", () => {
    // Build a code whose body has digits, then type it with Arabic-Indic digits.
    const body = "23456789ABCDEFG";
    const code = body + checkSymbol(body);
    const typed = code.replace(/[2-9]/g, (digit) => String.fromCharCode(0x0660 + Number(digit)));
    assert.notEqual(typed, code);
    assert.deepEqual(normalizeCode(typed), { ok: true, code });
    const persian = code.replace(/[2-9]/g, (digit) => String.fromCharCode(0x06f0 + Number(digit)));
    assert.deepEqual(normalizeCode(persian), { ok: true, code });
  });

  it("says why it is not a code", () => {
    assert.deepEqual(normalizeCode(""), { ok: false, reason: "empty" });
    assert.deepEqual(normalizeCode("  - - "), { ok: false, reason: "empty" });
    assert.deepEqual(normalizeCode(`${CODE.slice(0, 15)}0`), { ok: false, reason: "characters" });
    assert.deepEqual(normalizeCode("مرحبا"), { ok: false, reason: "characters" });
    assert.deepEqual(normalizeCode(CODE.slice(0, 12)), { ok: false, reason: "length" });
    assert.deepEqual(normalizeCode(`${CODE}A`), { ok: false, reason: "length" });
    const wrong = CODE.slice(0, 15) + (CODE.endsWith("2") ? "3" : "2");
    assert.deepEqual(normalizeCode(wrong), { ok: false, reason: "checksum" });
  });
});

describe("generateCode", () => {
  it("draws 15 symbols and the check symbol, and always validates", () => {
    for (let index = 0; index < 200; index += 1) {
      const code = generateCode();
      assert.equal(code.length, CODE_LENGTH);
      assert.ok(hasValidChecksum(code));
      assert.deepEqual(normalizeCode(code), { ok: true, code });
    }
  });

  it("follows the draw it is given (so a fixed draw gives a fixed code)", () => {
    assert.equal(generateCode(() => 0).slice(0, CODE_BODY_LENGTH), "2".repeat(CODE_BODY_LENGTH));
  });

  it("gives different codes in a batch even when the draw repeats a code", () => {
    // Every code is drawn twice in a row (symbol 0, 0, 1, 1, 2, ...): the repeat must be dropped.
    let call = 0;
    const draw = () => Math.floor(Math.floor(call++ / CODE_BODY_LENGTH) / 2);
    const codes = generateCodes(3, draw);
    assert.equal(codes.length, 3);
    assert.equal(new Set(codes).size, 3);
  });

  it("skips codes already taken", () => {
    const taken = new Set([generateCode(() => 1)]);
    // The first drawn code is all symbol 1 (taken), the next all symbol 2, then 3.
    let call = 0;
    const draw = () => Math.floor(call++ / CODE_BODY_LENGTH) + 1;
    const codes = generateCodes(2, draw, taken);
    assert.equal(codes.length, 2);
    assert.ok(codes.every((code) => !taken.has(code)));
  });
});

describe("hashCode", () => {
  const pepper = "p".repeat(40);

  it("is stable, hex, and 64 characters", () => {
    const hash = hashCode(CODE, pepper);
    assert.match(hash, /^[0-9a-f]{64}$/);
    assert.equal(hashCode(CODE, pepper), hash);
  });

  it("differs by code and by pepper", () => {
    assert.notEqual(hashCode(CODE, pepper), hashCode(CODE.replace(CODE[0]!, "Z"), pepper));
    assert.notEqual(hashCode(CODE, pepper), hashCode(CODE, "q".repeat(40)));
  });

  it("refuses a pepper too short to be a secret", () => {
    assert.throws(() => hashCode(CODE, "short"), /pepper/);
    assert.throws(() => hashCode(CODE, ""), /pepper/);
  });
});

describe("hashAddress", () => {
  const pepper = "p".repeat(40);

  it("is a stable hex hash that is not the address", () => {
    const hash = hashAddress("203.0.113.9", pepper);
    assert.match(hash ?? "", /^[0-9a-f]{64}$/);
    assert.equal(hashAddress(" 203.0.113.9 ", pepper), hash);
    assert.notEqual(hashAddress("203.0.113.10", pepper), hash);
    assert.notEqual(hashAddress("203.0.113.9", "q".repeat(40)), hash);
  });

  it("is different from the hash of the same text as a code", () => {
    assert.notEqual(hashAddress("203.0.113.9", pepper), hashCode("203.0.113.9", pepper));
  });

  it("is null when no address could be read, and refuses a short secret", () => {
    assert.equal(hashAddress("unknown", pepper), null);
    assert.equal(hashAddress("  ", pepper), null);
    assert.throws(() => hashAddress("203.0.113.9", "short"), /pepper/);
  });
});
