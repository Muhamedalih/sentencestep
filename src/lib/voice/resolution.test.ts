import { test } from "node:test";
import assert from "node:assert/strict";

import { cacheKeyParts, hashText, normalizeTextForVoice, resolveVoiceId } from "./resolution";

test("resolveVoiceId: a lesson's own voice wins over the global default", () => {
  assert.equal(resolveVoiceId("kokoro-fable", "kokoro-heart"), "kokoro-fable");
});

test("resolveVoiceId: no lesson voice falls back to the global default", () => {
  assert.equal(resolveVoiceId(null, "kokoro-heart"), "kokoro-heart");
  assert.equal(resolveVoiceId(undefined, "kokoro-heart"), "kokoro-heart");
});

test("resolveVoiceId: no lesson voice and no global default resolves to null", () => {
  assert.equal(resolveVoiceId(null, null), null);
});

test("normalizeTextForVoice: collapses internal whitespace runs to a single space", () => {
  assert.equal(normalizeTextForVoice("She   went   home."), "She went home.");
});

test("normalizeTextForVoice: trims leading and trailing whitespace", () => {
  assert.equal(normalizeTextForVoice("  Hello world  "), "Hello world");
});

test("normalizeTextForVoice: leaves case and punctuation untouched", () => {
  assert.equal(normalizeTextForVoice("Hello, World!"), "Hello, World!");
});

test("hashText: the same text always produces the same hash", () => {
  assert.equal(hashText("Hello world."), hashText("Hello world."));
});

test("hashText: different text produces a different hash", () => {
  assert.notEqual(hashText("Hello world."), hashText("Goodbye world."));
});

test("hashText: is sensitive to case, unlike normalizeTextForVoice", () => {
  assert.notEqual(hashText("hello"), hashText("Hello"));
});

test("cacheKeyParts: normalizes text before hashing, so incidental whitespace differences share a cache key", () => {
  const a = cacheKeyParts("Hello   world.", "kokoro-heart", "v1");
  const b = cacheKeyParts("Hello world.", "kokoro-heart", "v1");
  assert.equal(a.textHash, b.textHash);
  assert.equal(a.normalizedText, b.normalizedText);
});

test("cacheKeyParts: the same text under a different voice produces a different identity", () => {
  const a = cacheKeyParts("Hello world.", "kokoro-heart", "v1");
  const b = cacheKeyParts("Hello world.", "kokoro-bella", "v1");
  assert.equal(a.textHash, b.textHash, "text hash alone should still match");
  assert.notEqual(a.voiceId, b.voiceId);
});

test("cacheKeyParts: the same text and voice under a different generation version produces a different identity", () => {
  const a = cacheKeyParts("Hello world.", "kokoro-heart", "v1");
  const b = cacheKeyParts("Hello world.", "kokoro-heart", "v2");
  assert.notEqual(a.generationVersion, b.generationVersion);
});
