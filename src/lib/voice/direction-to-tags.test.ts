// Deterministic unit tests for the pure Direction -> ElevenLabs request
// translator — no database, no provider call, no randomness. Same input
// must always produce byte-identical output (see toElevenLabsInput's own
// doc comment on why this matters for reproducible generation).

import assert from "node:assert/strict";
import { test } from "node:test";

import { toElevenLabsInput } from "./direction-to-tags";
import type { SentenceDirection } from "./director-types";
import type { TTSVoiceSettings } from "./provider";

const BASE: TTSVoiceSettings = {
  stability: 0.5,
  similarityBoost: 0.75,
  style: 0.3,
  speed: 1.0,
  useSpeakerBoost: true,
};

const NEUTRAL: SentenceDirection = {
  sentenceId: "s1",
  emotion: "neutral",
  energy: "medium",
  pace: "normal",
  emphasisWord: null,
  pauseBefore: "none",
};

test("toElevenLabsInput: a neutral, medium/normal direction carries no tag and unchanged base settings", () => {
  const result = toElevenLabsInput(NEUTRAL, "The sun was shining.", BASE);
  assert.equal(result.taggedText, "The sun was shining.");
  assert.deepEqual(result.voiceSettings, BASE);
});

test("toElevenLabsInput: the same direction + text + base always produces byte-identical output", () => {
  const a = toElevenLabsInput(NEUTRAL, "Hello.", BASE);
  const b = toElevenLabsInput(NEUTRAL, "Hello.", BASE);
  assert.deepEqual(a, b);
});

test("toElevenLabsInput: an excited/high-energy direction adds the [excited] tag and shifts stability/style toward more variation", () => {
  const direction: SentenceDirection = { ...NEUTRAL, emotion: "excited", energy: "high" };
  const result = toElevenLabsInput(direction, "It moved!", BASE);
  assert.equal(result.taggedText, "[excited] It moved!");
  assert.ok(result.voiceSettings.stability < BASE.stability);
  assert.ok(result.voiceSettings.style > BASE.style);
});

test("toElevenLabsInput: a whispering/low-energy direction adds [whispers] and shifts toward more stability", () => {
  const direction: SentenceDirection = { ...NEUTRAL, emotion: "whispering", energy: "low" };
  const result = toElevenLabsInput(direction, "Be quiet.", BASE);
  assert.equal(result.taggedText, "[whispers] Be quiet.");
  assert.ok(result.voiceSettings.stability > BASE.stability);
  assert.ok(result.voiceSettings.style < BASE.style);
});

test("toElevenLabsInput: pauseBefore prepends ellipses, short shorter than long", () => {
  const shortPause = toElevenLabsInput({ ...NEUTRAL, pauseBefore: "short" }, "Wait.", BASE);
  const longPause = toElevenLabsInput({ ...NEUTRAL, pauseBefore: "long" }, "Wait.", BASE);
  assert.ok(shortPause.taggedText.startsWith("... "));
  assert.ok(longPause.taggedText.startsWith("... ... "));
  assert.ok(longPause.taggedText.length > shortPause.taggedText.length);
});

test("toElevenLabsInput: pace adjusts speed within ElevenLabs' documented 0.7-1.2 range", () => {
  const slow = toElevenLabsInput({ ...NEUTRAL, pace: "slow" }, "Text.", BASE);
  const fast = toElevenLabsInput({ ...NEUTRAL, pace: "fast" }, "Text.", BASE);
  assert.ok(slow.voiceSettings.speed < BASE.speed);
  assert.ok(fast.voiceSettings.speed > BASE.speed);
  assert.ok(slow.voiceSettings.speed >= 0.7);
  assert.ok(fast.voiceSettings.speed <= 1.2);
});

test("toElevenLabsInput: extreme base settings still clamp stability/style/speed to ElevenLabs' documented ranges", () => {
  const extremeBase: TTSVoiceSettings = { ...BASE, stability: 0.95, style: 0.95, speed: 1.15 };
  const direction: SentenceDirection = {
    ...NEUTRAL,
    emotion: "excited",
    energy: "high",
    pace: "fast",
  };
  const result = toElevenLabsInput(direction, "Go!", extremeBase);
  assert.ok(result.voiceSettings.stability >= 0 && result.voiceSettings.stability <= 1);
  assert.ok(result.voiceSettings.style >= 0 && result.voiceSettings.style <= 1);
  assert.ok(result.voiceSettings.speed >= 0.7 && result.voiceSettings.speed <= 1.2);
});

test("toElevenLabsInput: emphasisWord is never applied to the output text (no unverified control)", () => {
  const direction: SentenceDirection = { ...NEUTRAL, emphasisWord: "moved" };
  const result = toElevenLabsInput(direction, "Something moved behind the curtains.", BASE);
  assert.equal(result.taggedText, "Something moved behind the curtains.");
});

test("toElevenLabsInput: similarityBoost and useSpeakerBoost pass through unchanged regardless of direction", () => {
  const direction: SentenceDirection = { ...NEUTRAL, emotion: "sad", energy: "low", pace: "slow" };
  const result = toElevenLabsInput(direction, "Text.", BASE);
  assert.equal(result.voiceSettings.similarityBoost, BASE.similarityBoost);
  assert.equal(result.voiceSettings.useSpeakerBoost, BASE.useSpeakerBoost);
});
