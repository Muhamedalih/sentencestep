import { test } from "node:test";
import assert from "node:assert/strict";

import { isCorrectChar } from "./typing";
import { isPlainStandIn, plainLetterFor, secondLetterToSwallow } from "./german-typing";

test("plain letters stand in for ä ö ü ß, in either case", () => {
  assert.equal(plainLetterFor("ä"), "a");
  assert.equal(plainLetterFor("Ö"), "o");
  assert.equal(plainLetterFor("ü"), "u");
  assert.equal(plainLetterFor("ß"), "s");
  assert.equal(plainLetterFor("a"), null);
  assert.equal(isPlainStandIn("ä", "a"), true);
  assert.equal(isPlainStandIn("Ä", "A"), true);
  assert.equal(isPlainStandIn("ß", "s"), true);
  assert.equal(isPlainStandIn("ä", "o"), false);
  assert.equal(isPlainStandIn("a", "a"), false);
});

test("the spelled-out second letter is swallowed unless the sentence needs it", () => {
  assert.equal(secondLetterToSwallow("ä", "s"), "e"); // Mädchen? no: "Käse" k-ä-s-e → a then e swallowed
  assert.equal(secondLetterToSwallow("ü", "r"), "e"); // für: u then e swallowed
  assert.equal(secondLetterToSwallow("ß", "e"), "s"); // Straße: s then s swallowed
  assert.equal(secondLetterToSwallow("ß", "s"), null); // the sentence's own next letter is s
  assert.equal(secondLetterToSwallow("ä", "e"), null); // the sentence's own next letter is e
  assert.equal(secondLetterToSwallow("a", "b"), null); // not a special letter
});

test("exact comparison is unchanged when folding is off or not needed", () => {
  assert.equal(isCorrectChar("Käse", 1, "a"), false);
  assert.equal(isCorrectChar("Käse", 1, "ä"), true);
  assert.equal(isCorrectChar("Käse", 1, "a", true), true);
  assert.equal(isCorrectChar("Käse", 1, "o", true), false);
  assert.equal(isCorrectChar("Käse", 0, "k", true), true);
});
