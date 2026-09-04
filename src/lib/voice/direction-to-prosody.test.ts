// Deterministic unit tests for the pure Direction -> Edge-TTS SSML
// translator — no network, no randomness. Same input must always produce
// byte-identical output. Run with `npm run test:voice`.

import assert from "node:assert/strict";
import { test } from "node:test";

import { toProsodyInput, wrapPlainTextProsodySsml } from "./direction-to-prosody";
import type { SentenceDirection } from "./director-types";

const NEUTRAL: SentenceDirection = {
  sentenceId: "s1",
  emotion: "neutral",
  energy: "medium",
  pace: "normal",
  emphasisWord: null,
  pauseBefore: "none",
};

test("toProsodyInput: exactly one voice and one prosody element, no unsupported elements", () => {
  const result = toProsodyInput(NEUTRAL, "The sun was shining.", "en-US-AriaNeural");
  assert.equal((result.ssml.match(/<prosody/g) ?? []).length, 1);
  assert.equal((result.ssml.match(/<voice/g) ?? []).length, 1);
  assert.ok(!result.ssml.includes("express-as"));
  assert.ok(!result.ssml.includes("<break"));
  assert.ok(!result.ssml.includes("<emphasis"));
});

test("toProsodyInput: a neutral, medium/normal direction has 0% prosody deltas and default volume", () => {
  const result = toProsodyInput(NEUTRAL, "The sun was shining.", "en-US-AriaNeural");
  assert.ok(result.ssml.includes('rate="+0%"'));
  assert.ok(result.ssml.includes('pitch="+0%"'));
  assert.ok(result.ssml.includes('volume="default"'));
});

test("toProsodyInput: the same direction + text + voice always produces byte-identical output", () => {
  const a = toProsodyInput(NEUTRAL, "Hello.", "en-US-AriaNeural");
  const b = toProsodyInput(NEUTRAL, "Hello.", "en-US-AriaNeural");
  assert.equal(a.ssml, b.ssml);
});

test("toProsodyInput: an excited/high-energy direction raises rate/pitch and volume", () => {
  const direction: SentenceDirection = { ...NEUTRAL, emotion: "excited", energy: "high" };
  const result = toProsodyInput(direction, "It moved!", "en-US-AriaNeural");
  assert.match(result.ssml, /rate="\+\d+%"/);
  assert.match(result.ssml, /pitch="\+\d+%"/);
  assert.ok(result.ssml.includes('volume="loud"'));
});

test("toProsodyInput: a whispering/low-energy direction lowers rate/pitch and volume", () => {
  const direction: SentenceDirection = { ...NEUTRAL, emotion: "whispering", energy: "low" };
  const result = toProsodyInput(direction, "Be quiet.", "en-US-AriaNeural");
  assert.match(result.ssml, /rate="-\d+%"/);
  assert.match(result.ssml, /pitch="-\d+%"/);
  assert.ok(result.ssml.includes('volume="x-soft"'));
});

test("toProsodyInput: pauseBefore prepends ellipses into the spoken text, short shorter than long", () => {
  const shortPause = toProsodyInput(
    { ...NEUTRAL, pauseBefore: "short" },
    "Wait.",
    "en-US-AriaNeural",
  );
  const longPause = toProsodyInput(
    { ...NEUTRAL, pauseBefore: "long" },
    "Wait.",
    "en-US-AriaNeural",
  );
  assert.ok(shortPause.ssml.includes("... Wait."));
  assert.ok(longPause.ssml.includes("... ... Wait."));
});

test("toProsodyInput: emphasisWord is never applied to the output text (no verified per-word control)", () => {
  const direction: SentenceDirection = { ...NEUTRAL, emphasisWord: "moved" };
  const result = toProsodyInput(
    direction,
    "Something moved behind the curtains.",
    "en-US-AriaNeural",
  );
  assert.ok(!result.ssml.includes("<emphasis"));
  assert.ok(result.ssml.includes("Something moved behind the curtains."));
});

test("toProsodyInput: XML-special characters in the sentence text are escaped", () => {
  const result = toProsodyInput(NEUTRAL, `She said "hello" & left.`, "en-US-AriaNeural");
  assert.ok(result.ssml.includes("&quot;hello&quot;"));
  assert.ok(result.ssml.includes("&amp;"));
});

test("wrapPlainTextProsodySsml: produces a single-prosody speak document with no direction applied", () => {
  const ssml = wrapPlainTextProsodySsml("en-US-AriaNeural", "Hello there!");
  assert.ok(ssml.startsWith("<speak"));
  assert.equal((ssml.match(/<prosody/g) ?? []).length, 1);
  assert.ok(ssml.includes("Hello there!"));
});
