// Deterministic unit tests for the AI-response structural validator — no
// database, no network. This is the gate between untrusted model output and
// content_translations; every case here corresponds directly to one of the
// Phase 3 spec's required checks. Run with `npm run test:translation`.

import assert from "node:assert/strict";
import { test } from "node:test";

import { validateLessonTranslationOutput } from "./validate";
import type { ExpectedLessonShape } from "./validate";

const twoSentences: ExpectedLessonShape = {
  hasDescription: true,
  sentenceIds: ["story-1-s1", "story-1-s2"],
  sentenceWords: new Map(),
};

function validOutput() {
  return {
    title: "Vecina nueva",
    description: "Una historia corta.",
    sentences: [
      { id: "story-1-s1", text: "Layla vivía sola.", words: [] },
      { id: "story-1-s2", text: "Escuchó un ruido.", words: [] },
    ],
  };
}

test("accepts a well-formed response", () => {
  const result = validateLessonTranslationOutput(validOutput(), twoSentences);
  assert.equal(result.valid, true);
});

test("rejects a non-object response", () => {
  const result = validateLessonTranslationOutput("not an object", twoSentences);
  assert.equal(result.valid, false);
});

test("rejects a missing title", () => {
  const output = { ...validOutput(), title: undefined };
  const result = validateLessonTranslationOutput(output, twoSentences);
  assert.equal(result.valid, false);
  if (!result.valid) assert.match(result.errors.join(" "), /title/i);
});

test("rejects an empty (whitespace-only) title", () => {
  const output = { ...validOutput(), title: "   " };
  const result = validateLessonTranslationOutput(output, twoSentences);
  assert.equal(result.valid, false);
});

test("rejects a missing description when the source lesson has one", () => {
  const output = { ...validOutput(), description: null };
  const result = validateLessonTranslationOutput(output, twoSentences);
  assert.equal(result.valid, false);
  if (!result.valid) assert.match(result.errors.join(" "), /description/i);
});

test("rejects a non-null description when the source lesson has none", () => {
  const noDescription: ExpectedLessonShape = { ...twoSentences, hasDescription: false };
  const output = { ...validOutput(), description: "Should not be here." };
  const result = validateLessonTranslationOutput(output, noDescription);
  assert.equal(result.valid, false);
});

test("accepts a null description when the source lesson has none", () => {
  const noDescription: ExpectedLessonShape = { ...twoSentences, hasDescription: false };
  const output = { ...validOutput(), description: null };
  const result = validateLessonTranslationOutput(output, noDescription);
  assert.equal(result.valid, true);
});

test("rejects a sentence count mismatch", () => {
  const output = { ...validOutput(), sentences: [validOutput().sentences[0]] };
  const result = validateLessonTranslationOutput(output, twoSentences);
  assert.equal(result.valid, false);
  if (!result.valid) assert.match(result.errors.join(" "), /2 sentences, got 1/);
});

test("rejects a response missing one of the expected sentence ids", () => {
  const output = {
    ...validOutput(),
    sentences: [
      { id: "story-1-s1", text: "Layla vivía sola.", words: [] },
      { id: "story-1-s3", text: "Un intruso desconocido.", words: [] },
    ],
  };
  const result = validateLessonTranslationOutput(output, twoSentences);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.match(result.errors.join(" "), /Missing translations.*story-1-s2/);
    assert.match(result.errors.join(" "), /Unexpected sentence id.*story-1-s3/);
  }
});

test("rejects a duplicated sentence id", () => {
  const output = {
    ...validOutput(),
    sentences: [
      { id: "story-1-s1", text: "Layla vivía sola.", words: [] },
      { id: "story-1-s1", text: "Duplicado.", words: [] },
    ],
  };
  const result = validateLessonTranslationOutput(output, twoSentences);
  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.match(result.errors.join(" "), /Duplicate sentence id/);
    assert.match(result.errors.join(" "), /Missing translations.*story-1-s2/);
  }
});

test("rejects sentences returned out of order, even with the correct id set", () => {
  const output = {
    ...validOutput(),
    sentences: [
      { id: "story-1-s2", text: "Escuchó un ruido.", words: [] },
      { id: "story-1-s1", text: "Layla vivía sola.", words: [] },
    ],
  };
  const result = validateLessonTranslationOutput(output, twoSentences);
  assert.equal(result.valid, false);
  if (!result.valid) assert.match(result.errors.join(" "), /order/i);
});

test("rejects an empty translation for a sentence", () => {
  const output = {
    ...validOutput(),
    sentences: [
      { id: "story-1-s1", text: "", words: [] },
      { id: "story-1-s2", text: "Escuchó un ruido.", words: [] },
    ],
  };
  const result = validateLessonTranslationOutput(output, twoSentences);
  assert.equal(result.valid, false);
  if (!result.valid) assert.match(result.errors.join(" "), /empty translation/i);
});

test("rejects a malformed sentence entry", () => {
  const output = {
    ...validOutput(),
    sentences: [{ id: "story-1-s1" }, { id: "story-1-s2", text: "x", words: [] }],
  };
  const result = validateLessonTranslationOutput(output, twoSentences);
  assert.equal(result.valid, false);
});

test("trims whitespace on the validated value", () => {
  const output = {
    title: "  Vecina nueva  ",
    description: "  Una historia corta.  ",
    sentences: [
      { id: "story-1-s1", text: "  Layla vivía sola.  ", words: [] },
      { id: "story-1-s2", text: "Escuchó un ruido.", words: [] },
    ],
  };
  const result = validateLessonTranslationOutput(output, twoSentences);
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.value.title, "Vecina nueva");
    assert.equal(result.value.description, "Una historia corta.");
    assert.equal(result.value.sentences[0]!.text, "Layla vivía sola.");
  }
});

test("accepts a lesson with zero sentences (degenerate but structurally valid)", () => {
  const noSentences: ExpectedLessonShape = {
    hasDescription: false,
    sentenceIds: [],
    sentenceWords: new Map(),
  };
  const output = { title: "Título", description: null, sentences: [] };
  const result = validateLessonTranslationOutput(output, noSentences);
  assert.equal(result.valid, true);
});

// --- word-level vocabulary translation ---

const withWords: ExpectedLessonShape = {
  hasDescription: false,
  sentenceIds: ["story-1-s1"],
  sentenceWords: new Map([["story-1-s1", ["coffee", "run"]]]),
};

test("words: accepts a well-formed word-translation response matching the requested English phrases", () => {
  const output = {
    title: "Vecina nueva",
    description: null,
    sentences: [
      {
        id: "story-1-s1",
        text: "Layla vivía sola.",
        words: [
          { en: "coffee", text: "café" },
          { en: "run", text: "carrera" },
        ],
      },
    ],
  };
  const result = validateLessonTranslationOutput(output, withWords);
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.deepEqual(result.value.sentences[0]!.words, [
      { en: "coffee", text: "café" },
      { en: "run", text: "carrera" },
    ]);
  }
});

test("words: rejects a word count mismatch", () => {
  const output = {
    title: "Vecina nueva",
    description: null,
    sentences: [
      { id: "story-1-s1", text: "Layla vivía sola.", words: [{ en: "coffee", text: "café" }] },
    ],
  };
  const result = validateLessonTranslationOutput(output, withWords);
  assert.equal(result.valid, false);
  if (!result.valid)
    assert.match(result.errors.join(" "), /expected 2 word translation\(s\), got 1/);
});

test("words: rejects a response that echoes back a different English phrase than requested", () => {
  const output = {
    title: "Vecina nueva",
    description: null,
    sentences: [
      {
        id: "story-1-s1",
        text: "Layla vivía sola.",
        words: [
          { en: "coffee", text: "café" },
          { en: "jog", text: "trote" },
        ],
      },
    ],
  };
  const result = validateLessonTranslationOutput(output, withWords);
  assert.equal(result.valid, false);
  if (!result.valid) assert.match(result.errors.join(" "), /echoes "jog", expected "run"/);
});

test("words: rejects an empty word translation", () => {
  const output = {
    title: "Vecina nueva",
    description: null,
    sentences: [
      {
        id: "story-1-s1",
        text: "Layla vivía sola.",
        words: [
          { en: "coffee", text: "café" },
          { en: "run", text: "" },
        ],
      },
    ],
  };
  const result = validateLessonTranslationOutput(output, withWords);
  assert.equal(result.valid, false);
  if (!result.valid) assert.match(result.errors.join(" "), /word translation for "run" is empty/);
});

test("words: a sentence with no requested words must return an empty words array, not omit it", () => {
  const output = {
    ...validOutput(),
    sentences: [{ id: "story-1-s1", text: "Layla vivía sola." }, validOutput().sentences[1]],
  };
  const result = validateLessonTranslationOutput(output, twoSentences);
  assert.equal(result.valid, false);
  if (!result.valid) assert.match(result.errors.join(" "), /missing its words array/);
});

test("words: a sentence returning extra, unrequested words is rejected", () => {
  const output = {
    title: "Título",
    description: null,
    sentences: [
      { id: "story-1-s1", text: "Layla vivía sola.", words: [{ en: "coffee", text: "café" }] },
    ],
  };
  const noWords: ExpectedLessonShape = {
    hasDescription: false,
    sentenceIds: ["story-1-s1"],
    sentenceWords: new Map(),
  };
  const result = validateLessonTranslationOutput(output, noWords);
  assert.equal(result.valid, false);
  if (!result.valid)
    assert.match(result.errors.join(" "), /expected 0 word translation\(s\), got 1/);
});
