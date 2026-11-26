import assert from "node:assert/strict";
import test from "node:test";

import { GERMAN_KEYBOARD_ROWS, GERMAN_LETTERS, matchesGermanLetter } from "./german-letters";

test("the letter itself, its plain stand-in and its spelled form are all right", () => {
  assert.equal(matchesGermanLetter("Ä", "ä"), true);
  assert.equal(matchesGermanLetter("Ä", "Ä"), true);
  assert.equal(matchesGermanLetter("Ä", "a"), true);
  assert.equal(matchesGermanLetter("Ä", "ae"), true);
  assert.equal(matchesGermanLetter("Ö", "oe"), true);
  assert.equal(matchesGermanLetter("Ü", "ue"), true);
  assert.equal(matchesGermanLetter("ß", "ss"), true);
  assert.equal(matchesGermanLetter("ß", "s"), true);
  assert.equal(matchesGermanLetter("Z", "z"), true);
});

test("anything else is wrong, and an empty box is not an answer", () => {
  assert.equal(matchesGermanLetter("Ä", "o"), false);
  assert.equal(matchesGermanLetter("Ö", "ä"), false);
  assert.equal(matchesGermanLetter("Z", "y"), false);
  assert.equal(matchesGermanLetter("Y", "z"), false);
  assert.equal(matchesGermanLetter("Ä", ""), false);
  assert.equal(matchesGermanLetter("Ä", "  "), false);
});

test("every lesson letter has its own key on the drawn keyboard", () => {
  const keys = new Set(GERMAN_KEYBOARD_ROWS.flat());
  for (const letter of GERMAN_LETTERS) {
    assert.ok(keys.has(letter.lower), `${letter.letter} has no key`);
    assert.equal(letter.letter.toLowerCase(), letter.lower);
  }
});

test("the alphabet has all 30 letters, every lesson letter among them, each with a unique clip key", async () => {
  const { GERMAN_ALPHABET, alphabetEntry } = await import("./german-alphabet");
  assert.equal(GERMAN_ALPHABET.length, 30);
  assert.equal(new Set(GERMAN_ALPHABET.map((entry) => entry.key)).size, 30);
  for (const letter of GERMAN_LETTERS) assert.ok(alphabetEntry(letter.letter), letter.letter);
});
