import { test } from "node:test";
import assert from "node:assert/strict";

import { wordGroups } from "@/data/word-lists";
import { WORD_IPA } from "@/data/word-lists/ipa";
import { formatIpa, normalizeIpa } from "@/lib/word-lists-ipa";

test("normalizeIpa: drops surrounding slashes, brackets and spaces", () => {
  assert.equal(normalizeIpa("/ænt/"), "ænt");
  assert.equal(normalizeIpa("  [ˈʌŋkəl] "), "ˈʌŋkəl");
  assert.equal(normalizeIpa("ænt"), "ænt");
});

test("normalizeIpa: nothing to show is null", () => {
  assert.equal(normalizeIpa(undefined), null);
  assert.equal(normalizeIpa(null), null);
  assert.equal(normalizeIpa(""), null);
  assert.equal(normalizeIpa(" // "), null);
});

test("formatIpa: wraps the bare IPA in slashes, once", () => {
  assert.equal(formatIpa("ænt"), "/ænt/");
  assert.equal(formatIpa("/ænt/"), "/ænt/");
  assert.equal(formatIpa(null), null);
});

test("word lists: every seed word has a generated IPA", () => {
  for (const group of wordGroups) {
    for (const word of group.words) {
      assert.ok(
        WORD_IPA[word.targetWord.toLowerCase()],
        `${word.id} (${word.targetWord}) has no IPA`,
      );
    }
  }
});

test("word lists: every generated IPA is bare, non-empty, and has no Arabic or digits", () => {
  for (const [word, ipa] of Object.entries(WORD_IPA)) {
    assert.ok(ipa.length > 0, `${word} has an empty IPA`);
    assert.equal(normalizeIpa(ipa), ipa, `${word}'s IPA still has slashes or spaces around it`);
    assert.ok(!/[0-9؀-ۿ]/.test(ipa), `${word}'s IPA has digits or Arabic`);
  }
});

test("word lists: the generated IPA keys are lowercase", () => {
  for (const word of Object.keys(WORD_IPA)) assert.equal(word, word.toLowerCase());
});
