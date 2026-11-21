import { test } from "node:test";
import assert from "node:assert/strict";
import { foldsDiacritics, isTargetLanguage, languageOfContentId, speechLangFor } from "./learn-language";

test("a content id's language comes from its prefix", () => {
  assert.equal(languageOfContentId("de-normal-1"), "de");
  assert.equal(languageOfContentId("normal-1"), "en");
  assert.equal(languageOfContentId("story-120-s4"), "en");
});

test("speech tag and typing folding follow the language", () => {
  assert.equal(speechLangFor("de"), "de-DE");
  assert.equal(speechLangFor("en"), "en-US");
  assert.equal(foldsDiacritics("de"), true);
  assert.equal(foldsDiacritics("en"), false);
  assert.equal(isTargetLanguage("de"), true);
  assert.equal(isTargetLanguage("fr"), false);
});
