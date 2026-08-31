import { test } from "node:test";
import assert from "node:assert/strict";

import { getBestVoice, rankVoices, scoreVoice } from "./speech";
import type { VoiceInfo } from "./speech";

function voice(overrides: Partial<VoiceInfo>): VoiceInfo {
  return {
    voiceURI: overrides.name ?? "voice",
    name: "Voice",
    lang: "en-US",
    localService: false,
    default: false,
    ...overrides,
  };
}

// --- scoreVoice / rankVoices: never fall back to a non-English voice while an English one exists ---

test("scoreVoice: a non-English voice is rejected outright", () => {
  const result = scoreVoice(voice({ name: "Amélie", lang: "fr-FR" }));
  assert.ok(result.score < 0, "non-English voice must score below zero (rejected)");
});

test("rankVoices: excludes non-English voices even when they're the only 'good-sounding' option", () => {
  const voices = [
    voice({ name: "Amélie Natural", lang: "fr-FR" }), // sounds high-quality by name, but not English
    voice({ name: "Microsoft David", lang: "en-US" }), // plain English voice
  ];
  const ranked = rankVoices(voices);
  assert.equal(ranked.length, 1, "only the English voice should survive ranking");
  assert.equal(ranked[0]!.voice.name, "Microsoft David");
});

test("getBestVoice: returns null when the device has no English voice at all", () => {
  const voices = [voice({ name: "Amélie", lang: "fr-FR" }), voice({ name: "Hans", lang: "de-DE" })];
  assert.equal(getBestVoice(voices), null);
});

test("getBestVoice: returns null for an empty voice list", () => {
  assert.equal(getBestVoice([]), null);
});

// --- Locale preference: en-US/en-GB outrank other English locales ---

test("scoreVoice: en-US scores higher than en-AU", () => {
  const us = scoreVoice(voice({ name: "Voice A", lang: "en-US" }));
  const au = scoreVoice(voice({ name: "Voice A", lang: "en-AU" }));
  assert.ok(us.score > au.score, "en-US should outrank en-AU for an otherwise-identical voice");
});

test("scoreVoice: en-GB scores the same tier as en-US", () => {
  const us = scoreVoice(voice({ name: "Voice A", lang: "en-US" }));
  const gb = scoreVoice(voice({ name: "Voice A", lang: "en-GB" }));
  assert.equal(us.score, gb.score);
});

// --- Quality: "Natural"/"Neural"/"Online"/"Premium"/"Enhanced" voices outrank legacy voices ---

test("getBestVoice: a modern natural-sounding voice outranks a legacy SAPI-style voice", () => {
  const voices = [
    voice({ name: "Microsoft Zira - English (United States)", lang: "en-US", localService: true }),
    voice({ name: "Microsoft Aria Online (Natural) - English (United States)", lang: "en-US" }),
  ];
  const best = getBestVoice(voices);
  assert.equal(best?.name, "Microsoft Aria Online (Natural) - English (United States)");
});

test("scoreVoice: quality name patterns are case-insensitive", () => {
  const lower = scoreVoice(voice({ name: "some natural voice", lang: "en-US" }));
  const upper = scoreVoice(voice({ name: "SOME NATURAL VOICE", lang: "en-US" }));
  assert.equal(lower.score, upper.score);
});

// --- Preference: female voices outrank male voices at an equal quality tier ---

test("getBestVoice: a female-patterned voice outranks a male-patterned voice at the same quality tier", () => {
  const voices = [
    voice({ name: "Microsoft David - English (United States)", lang: "en-US" }),
    voice({ name: "Microsoft Zira - English (United States)", lang: "en-US" }),
  ];
  const best = getBestVoice(voices);
  assert.equal(best?.name, "Microsoft Zira - English (United States)");
});

test("scoreVoice: a male-patterned name is deprioritized but not rejected", () => {
  const result = scoreVoice(voice({ name: "Microsoft David", lang: "en-US" }));
  assert.ok(result.score > 0, "a male voice must still be a usable, positively-scored fallback");
});

// --- localService must not blindly outrank a clearly higher-quality voice ---

test("getBestVoice: a local legacy voice does not outrank a higher-quality non-local voice", () => {
  const voices = [
    voice({ name: "Microsoft Zira - English (United States)", lang: "en-US", localService: true }),
    voice({
      name: "Microsoft Jenny Online (Natural) - English (United States)",
      lang: "en-US",
      localService: false,
    }),
  ];
  const best = getBestVoice(voices);
  assert.equal(best?.name, "Microsoft Jenny Online (Natural) - English (United States)");
});

// --- Diagnostics: every scored voice carries human-readable reasons ---

test("scoreVoice: a valid English voice always has a non-empty reasons list", () => {
  const result = scoreVoice(voice({ name: "Google US English", lang: "en-US" }));
  assert.ok(result.reasons.length > 0);
  assert.ok(result.reasons.includes("English voice"));
});

test("rankVoices: sorts best-first", () => {
  const voices = [
    voice({ name: "Microsoft David", lang: "en-US" }),
    voice({ name: "Microsoft Aria Online (Natural)", lang: "en-US" }),
    voice({ name: "Microsoft Zira", lang: "en-US" }),
  ];
  const ranked = rankVoices(voices);
  assert.equal(ranked[0]!.voice.name, "Microsoft Aria Online (Natural)");
  for (let i = 1; i < ranked.length; i += 1) {
    assert.ok(
      ranked[i - 1]!.score >= ranked[i]!.score,
      "each entry must not score higher than the previous",
    );
  }
});
