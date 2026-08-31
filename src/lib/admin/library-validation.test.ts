// Deterministic unit tests for the Library admin's validation — no database.
// Run with `npm run test:admin`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  splitSentenceLines,
  splitTranslationLines,
  validateBookSectionInput,
  validateCategoryInput,
} from "./library-validation";
import type { BookSectionInput } from "./library-validation";

function sectionInput(overrides: Partial<BookSectionInput> = {}): BookSectionInput {
  return {
    bookId: "book-1",
    title: "Section 1",
    orderIndex: 0,
    sentencesText: "First sentence.\nSecond sentence.\nThird sentence.",
    ...overrides,
  };
}

test("splitSentenceLines: splits on newlines and trims each line", () => {
  assert.deepEqual(splitSentenceLines("First.\nSecond.\nThird."), ["First.", "Second.", "Third."]);
  assert.deepEqual(splitSentenceLines("  First.  \n  Second.  "), ["First.", "Second."]);
});

test("splitSentenceLines: drops empty and whitespace-only lines", () => {
  assert.deepEqual(splitSentenceLines("First.\n\n   \nSecond."), ["First.", "Second."]);
});

test("splitSentenceLines: empty input yields an empty list", () => {
  assert.deepEqual(splitSentenceLines(""), []);
  assert.deepEqual(splitSentenceLines("   \n  \n"), []);
});

test("validateBookSectionInput: a well-formed section is valid", () => {
  const result = validateBookSectionInput(sectionInput());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateBookSectionInput: rejects a missing title", () => {
  const result = validateBookSectionInput(sectionInput({ title: "" }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Title")));
});

test("validateBookSectionInput: rejects a title over 120 characters", () => {
  const result = validateBookSectionInput(sectionInput({ title: "x".repeat(121) }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("120")));
});

test("validateBookSectionInput: rejects a negative or non-integer order", () => {
  assert.equal(validateBookSectionInput(sectionInput({ orderIndex: -1 })).valid, false);
  assert.equal(validateBookSectionInput(sectionInput({ orderIndex: 1.5 })).valid, false);
  assert.equal(validateBookSectionInput(sectionInput({ orderIndex: 0 })).valid, true);
});

test("validateBookSectionInput: rejects a section with no sentences", () => {
  const result = validateBookSectionInput(sectionInput({ sentencesText: "" }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("sentence")));
});

test("validateBookSectionInput: rejects a sentences textarea that is only blank lines", () => {
  const result = validateBookSectionInput(sectionInput({ sentencesText: "\n   \n\n" }));
  assert.equal(result.valid, false);
});

test("validateCategoryInput: still validates independently of the section additions (regression guard)", () => {
  const result = validateCategoryInput({ name: "Self Development", orderIndex: 0 });
  assert.equal(result.valid, true);
});

test("splitTranslationLines: empty/whitespace-only input yields no lines (no translation supplied)", () => {
  assert.deepEqual(splitTranslationLines(""), []);
  assert.deepEqual(splitTranslationLines("   \n  \n "), []);
});

test("splitTranslationLines: preserves an internal blank line instead of dropping it", () => {
  assert.deepEqual(splitTranslationLines("First.\n\nThird."), ["First.", "", "Third."]);
});

test("validateBookSectionInput: accepts a section with no translations supplied at all", () => {
  const result = validateBookSectionInput(sectionInput());
  assert.equal(result.valid, true);
});

test("validateBookSectionInput: accepts translations with one line per English sentence, same order", () => {
  const result = validateBookSectionInput(
    sectionInput({
      arabicText: "الأولى.\nالثانية.\nالثالثة.",
      turkishText: "Birinci.\nİkinci.\nÜçüncü.",
      spanishText: "Primera.\nSegunda.\nTercera.",
    }),
  );
  assert.equal(result.valid, true);
});

test("validateBookSectionInput: rejects a translation with fewer lines than English sentences", () => {
  const result = validateBookSectionInput(sectionInput({ arabicText: "الأولى.\nالثانية." }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Arabic")));
});

test("validateBookSectionInput: rejects a translation with more lines than English sentences", () => {
  const result = validateBookSectionInput(
    sectionInput({ turkishText: "Birinci.\nİkinci.\nÜçüncü.\nFazladan." }),
  );
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Turkish")));
});

test("validateBookSectionInput: rejects a translation with a blank line in the middle", () => {
  const result = validateBookSectionInput(sectionInput({ spanishText: "Primera.\n\nTercera." }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Spanish")));
});

test("validateBookSectionInput: one locale can be supplied while others are left empty", () => {
  const result = validateBookSectionInput(
    sectionInput({ arabicText: "الأولى.\nالثانية.\nالثالثة." }),
  );
  assert.equal(result.valid, true);
});
