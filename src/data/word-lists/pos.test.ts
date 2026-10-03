import assert from "node:assert/strict";
import test from "node:test";

import { WORD_IPA } from "@/data/word-lists/ipa";
import { WORD_POS } from "@/data/word-lists/pos";
import { wordGroups } from "@/data/word-lists";
import { WORD_POS_VALUES } from "@/types/word-lists";

test("every word that has an IPA fallback has a word type, so the badge never goes missing for shipped content", () => {
  const missing = Object.keys(WORD_IPA).filter((word) => !(word in WORD_POS));
  assert.deepEqual(missing, []);
});

test("every word type is one of the known ones, and every key is a lower-case word", () => {
  for (const [word, pos] of Object.entries(WORD_POS)) {
    assert.ok((WORD_POS_VALUES as readonly string[]).includes(pos), `${word}: ${pos}`);
    assert.equal(word, word.toLowerCase());
  }
});

test("the map has no stray entries: every word in it is a Word Lists word", () => {
  const known = new Set(Object.keys(WORD_IPA));
  const stray = Object.keys(WORD_POS).filter((word) => !known.has(word));
  assert.deepEqual(stray, []);
});

test("spot checks: the sense the sentence uses decides the type", () => {
  assert.equal(WORD_POS.aunt, "noun");
  assert.equal(WORD_POS.afford, "verb");
  assert.equal(WORD_POS.angry, "adjective");
  assert.equal(WORD_POS.online, "adverb");
  // "file an ___" is the noun, although appeal is also a verb.
  assert.equal(WORD_POS.appeal, "noun");
  // "to ___" slots.
  for (const verb of ["exercise", "hire", "move", "wear", "support", "vote"]) {
    assert.equal(WORD_POS[verb], "verb", verb);
  }
});

test("every seeded word's own group words are covered", () => {
  for (const group of wordGroups) {
    for (const word of group.words) {
      assert.ok(word.targetWord.toLowerCase() in WORD_POS, word.targetWord);
    }
  }
});
