// Deterministic unit tests for the pure Direction -> Azure SSML translator —
// no database, no provider call, no randomness. Same input must always
// produce byte-identical output. Run with `npm run test:voice`.

import assert from "node:assert/strict";
import { test } from "node:test";

import { toAzureInput, wrapPlainTextSsml } from "./direction-to-ssml";
import type { SentenceDirection } from "./director-types";

const NEUTRAL: SentenceDirection = {
  sentenceId: "s1",
  emotion: "neutral",
  energy: "medium",
  pace: "normal",
  emphasisWord: null,
  pauseBefore: "none",
};

test("toAzureInput: a neutral, medium/normal direction has no express-as wrapper, no break, and 0% prosody deltas", () => {
  const result = toAzureInput(NEUTRAL, "The sun was shining.", "en-US-AriaNeural");
  assert.ok(!result.ssml.includes("express-as"));
  assert.ok(!result.ssml.includes("<break"));
  assert.ok(result.ssml.includes('rate="+0%"'));
  assert.ok(result.ssml.includes('pitch="+0%"'));
  assert.ok(result.ssml.includes('<voice name="en-US-AriaNeural">'));
  assert.ok(result.ssml.includes("The sun was shining."));
});

test("toAzureInput: the same direction + text + voice always produces byte-identical output", () => {
  const a = toAzureInput(NEUTRAL, "Hello.", "en-US-AriaNeural");
  const b = toAzureInput(NEUTRAL, "Hello.", "en-US-AriaNeural");
  assert.equal(a.ssml, b.ssml);
});

test("toAzureInput: an excited/high-energy direction adds a real express-as style and positive rate/pitch", () => {
  const direction: SentenceDirection = { ...NEUTRAL, emotion: "excited", energy: "high" };
  const result = toAzureInput(direction, "It moved!", "en-US-AriaNeural");
  assert.ok(result.ssml.includes('<mstts:express-as style="excited"'));
  assert.match(result.ssml, /rate="\+\d+%"/);
  assert.match(result.ssml, /pitch="\+\d+%"/);
});

test("toAzureInput: an emotion with no real Azure style match (e.g. sarcastic) never fabricates a style tag", () => {
  const direction: SentenceDirection = { ...NEUTRAL, emotion: "sarcastic" };
  const result = toAzureInput(direction, "Sure, great idea.", "en-US-AriaNeural");
  assert.ok(!result.ssml.includes("express-as"));
});

test("toAzureInput: pauseBefore inserts a <break>, short shorter than long", () => {
  const shortPause = toAzureInput(
    { ...NEUTRAL, pauseBefore: "short" },
    "Wait.",
    "en-US-AriaNeural",
  );
  const longPause = toAzureInput({ ...NEUTRAL, pauseBefore: "long" }, "Wait.", "en-US-AriaNeural");
  assert.ok(shortPause.ssml.includes('<break time="400ms"/>'));
  assert.ok(longPause.ssml.includes('<break time="900ms"/>'));
});

test("toAzureInput: emphasisWord wraps the word's first occurrence in a real <emphasis> tag", () => {
  const direction: SentenceDirection = { ...NEUTRAL, emphasisWord: "moved" };
  const result = toAzureInput(
    direction,
    "Something moved behind the curtains.",
    "en-US-AriaNeural",
  );
  assert.ok(result.ssml.includes('<emphasis level="strong">moved</emphasis>'));
});

test("toAzureInput: emphasisWord only wraps a whole-word match, never a substring inside another word", () => {
  const direction: SentenceDirection = { ...NEUTRAL, emphasisWord: "art" };
  const result = toAzureInput(direction, "The start of the art exhibit.", "en-US-AriaNeural");
  // "art" must match the standalone word, not the "art" inside "start".
  const before = result.ssml.indexOf("The start of the ");
  assert.ok(before !== -1);
  assert.ok(result.ssml.includes('of the <emphasis level="strong">art</emphasis> exhibit'));
});

test("toAzureInput: XML-special characters in the sentence text are escaped", () => {
  const result = toAzureInput(NEUTRAL, `She said "hello" & left.`, "en-US-AriaNeural");
  assert.ok(result.ssml.includes("&quot;hello&quot;"));
  assert.ok(result.ssml.includes("&amp;"));
  assert.ok(!result.ssml.includes(`"hello" &`));
});

test("wrapPlainTextSsml: produces a valid speak document with no direction applied", () => {
  const ssml = wrapPlainTextSsml("en-US-AriaNeural", "Hello there!");
  assert.ok(ssml.startsWith("<speak"));
  assert.ok(ssml.includes('<voice name="en-US-AriaNeural">Hello there!</voice>'));
  assert.ok(!ssml.includes("express-as"));
});
