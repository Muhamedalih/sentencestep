// Deterministic unit tests for the Word Lists admin's validation — no database.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  validateVocabularyWordInput,
  validateWordGroupInput,
  validateWordGroupWords,
} from "./word-lists-validation";
import type { VocabularyWordInput, WordGroupInput } from "./word-lists-validation";

function groupInput(overrides: Partial<WordGroupInput> = {}): WordGroupInput {
  return {
    level: 1,
    orderIndex: 0,
    title: "Family",
    titleAr: "العائلة",
    isFree: true,
    status: "draft",
    ...overrides,
  };
}

function wordInput(overrides: Partial<VocabularyWordInput> = {}): VocabularyWordInput {
  return {
    targetWord: "aunt",
    sentence: "My ___ gives me cookies when I visit her.",
    hintAr: "العمة أو الخالة.",
    ...overrides,
  };
}

test("validateWordGroupInput: a well-formed group is valid", () => {
  const result = validateWordGroupInput(groupInput());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateWordGroupInput: rejects a missing title", () => {
  const result = validateWordGroupInput(groupInput({ title: "" }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Title")));
});

test("validateWordGroupInput: rejects a missing Arabic title", () => {
  const result = validateWordGroupInput(groupInput({ titleAr: "" }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Arabic title")));
});

test("validateWordGroupInput: rejects a level outside 1-3", () => {
  assert.equal(validateWordGroupInput(groupInput({ level: 0 })).valid, false);
  assert.equal(validateWordGroupInput(groupInput({ level: 4 })).valid, false);
  assert.equal(validateWordGroupInput(groupInput({ level: 2 })).valid, true);
});

test("validateWordGroupInput: rejects a negative or non-integer order", () => {
  assert.equal(validateWordGroupInput(groupInput({ orderIndex: -1 })).valid, false);
  assert.equal(validateWordGroupInput(groupInput({ orderIndex: 1.5 })).valid, false);
});

test("validateVocabularyWordInput: a well-formed word has no errors", () => {
  assert.deepEqual(validateVocabularyWordInput(wordInput()), []);
});

test("validateVocabularyWordInput: rejects a missing target word", () => {
  const errors = validateVocabularyWordInput(wordInput({ targetWord: "" }));
  assert.ok(errors.some((e) => e.includes("Target word is required")));
});

test("validateVocabularyWordInput: rejects a target word containing whitespace", () => {
  const errors = validateVocabularyWordInput(wordInput({ targetWord: "ice cream" }));
  assert.ok(errors.some((e) => e.includes("single word")));
});

test("validateVocabularyWordInput: rejects a sentence with no blank", () => {
  const errors = validateVocabularyWordInput(wordInput({ sentence: "My aunt gives me cookies." }));
  assert.ok(errors.some((e) => e.includes("exactly once")));
});

test("validateVocabularyWordInput: rejects a sentence with two blanks", () => {
  const errors = validateVocabularyWordInput(
    wordInput({ sentence: "My ___ visits her ___ every year." }),
  );
  assert.ok(errors.some((e) => e.includes("exactly once")));
});

test("validateVocabularyWordInput: rejects the target word leaking into its own sentence", () => {
  const errors = validateVocabularyWordInput(
    wordInput({ targetWord: "aunt", sentence: "My ___ is my aunt on my mother's side." }),
  );
  assert.ok(errors.some((e) => e.includes("appears in its own sentence")));
});

test("validateVocabularyWordInput: a whole-word match elsewhere in the sentence is still caught, not just a substring", () => {
  // "ant" is a substring of "aunt" but not the same word — must not false-positive.
  const errors = validateVocabularyWordInput(
    wordInput({ targetWord: "ant", sentence: "An ___ crawled across the picnic blanket." }),
  );
  assert.deepEqual(errors, []);
});

test("validateVocabularyWordInput: rejects a missing Arabic hint", () => {
  const errors = validateVocabularyWordInput(wordInput({ hintAr: "" }));
  assert.ok(errors.some((e) => e.includes("Arabic hint is required")));
});

test("validateVocabularyWordInput: rejects a hint that doesn't look like Arabic", () => {
  const errors = validateVocabularyWordInput(wordInput({ hintAr: "The aunt." }));
  assert.ok(errors.some((e) => e.includes("doesn't look like Arabic")));
});

test("validateWordGroupWords: a well-formed set of words is valid", () => {
  const result = validateWordGroupWords([
    wordInput({ targetWord: "aunt" }),
    wordInput({ targetWord: "uncle", sentence: "My ___ teaches us to fish." }),
  ]);
  assert.equal(result.valid, true);
});

test("validateWordGroupWords: rejects a duplicate target word within the group", () => {
  const result = validateWordGroupWords([
    wordInput({ targetWord: "aunt" }),
    wordInput({ targetWord: "AUNT", sentence: "My ___ visits every summer." }),
  ]);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("more than once")));
});

test("validateWordGroupWords: rejects a duplicate sentence within the group", () => {
  const result = validateWordGroupWords([
    wordInput({ targetWord: "aunt", sentence: "My ___ visits every summer." }),
    wordInput({ targetWord: "uncle", sentence: "My ___ visits every summer." }),
  ]);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("more than one word")));
});

test("validateWordGroupWords: collects a per-word error alongside a duplicate error", () => {
  const result = validateWordGroupWords([
    wordInput({ targetWord: "" }),
    wordInput({ targetWord: "uncle" }),
  ]);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Target word is required")));
});
