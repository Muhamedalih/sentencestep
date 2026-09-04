// Deterministic unit tests for the pure Direction -> Gemini instruction
// translator — no network, no randomness. Same input must always produce
// byte-identical output. Run with `npm run test:voice`.

import assert from "node:assert/strict";
import { test } from "node:test";

import { toGeminiInput } from "./direction-to-gemini-prompt";
import type { SentenceDirection } from "./director-types";

const NEUTRAL: SentenceDirection = {
  sentenceId: "s1",
  emotion: "neutral",
  energy: "medium",
  pace: "normal",
  emphasisWord: null,
  pauseBefore: "none",
};

test("toGeminiInput: a fully neutral direction sends the plain sentence text unchanged, no instruction prefix", () => {
  const result = toGeminiInput(NEUTRAL, "The sun was shining.");
  assert.equal(result.text, "The sun was shining.");
});

test("toGeminiInput: the same direction + text always produces byte-identical output", () => {
  const a = toGeminiInput(NEUTRAL, "Hello.");
  const b = toGeminiInput(NEUTRAL, "Hello.");
  assert.equal(a.text, b.text);
});

test("toGeminiInput: an excited/high-energy/fast direction builds a natural-language tone instruction prefix", () => {
  const direction: SentenceDirection = {
    ...NEUTRAL,
    emotion: "excited",
    energy: "high",
    pace: "fast",
  };
  const result = toGeminiInput(direction, "It moved!");
  assert.equal(result.text, "Say in a excited, high-energy, animated, fast-paced tone: It moved!");
});

test("toGeminiInput: pauseBefore adds a pause clause without inventing SSML", () => {
  const shortPause = toGeminiInput({ ...NEUTRAL, pauseBefore: "short" }, "Wait.");
  const longPause = toGeminiInput({ ...NEUTRAL, pauseBefore: "long" }, "Wait.");
  assert.equal(shortPause.text, "Say, with a brief pause before starting: Wait.");
  assert.equal(longPause.text, "Say, with a long, dramatic pause before starting: Wait.");
  assert.ok(!shortPause.text.includes("<"));
  assert.ok(!longPause.text.includes("<"));
});

test("toGeminiInput: emphasisWord is included as a natural-language instruction, not applied to the text itself", () => {
  const direction: SentenceDirection = { ...NEUTRAL, emphasisWord: "moved" };
  const result = toGeminiInput(direction, "Something moved behind the curtains.");
  assert.equal(
    result.text,
    'Say, emphasizing the word "moved": Something moved behind the curtains.',
  );
  // The instruction is a prefix, before the ": " separator — the sentence
  // text itself after that separator is untouched.
  assert.ok(result.text.endsWith("Something moved behind the curtains."));
});

test("toGeminiInput: whispering/low-energy/slow combines every clause into one instruction", () => {
  const direction: SentenceDirection = {
    ...NEUTRAL,
    emotion: "whispering",
    energy: "low",
    pace: "slow",
    pauseBefore: "short",
  };
  const result = toGeminiInput(direction, "Be quiet.");
  assert.equal(
    result.text,
    "Say in a whispering, very quiet, low-energy, subdued, slow-paced tone, with a brief pause before starting: Be quiet.",
  );
});
