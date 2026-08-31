// Mirrors src/lib/translation/validate.test.ts's structure and philosophy:
// reject-on-doubt, never best-effort-coerce a malformed Voice Director
// response before anything is used for generation.

import assert from "node:assert/strict";
import { test } from "node:test";

import { validateVoiceDirectionOutput } from "./director-validate";
import type { ExpectedDirectionShape } from "./director-validate";

const EXPECTED: ExpectedDirectionShape = {
  sentenceIds: ["s1", "s2"],
  textById: new Map([
    ["s1", "The old house creaked in the wind."],
    ["s2", "Something moved behind the curtains."],
  ]),
};

function validEntry(sentenceId: string, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    sentenceId,
    emotion: "neutral",
    energy: "medium",
    pace: "normal",
    emphasisWord: null,
    pauseBefore: "none",
    ...overrides,
  };
}

test("validateVoiceDirectionOutput: a fully valid response is accepted", () => {
  const result = validateVoiceDirectionOutput(
    { sentences: [validEntry("s1"), validEntry("s2", { emotion: "curious" })] },
    EXPECTED,
  );
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.value.length, 2);
    assert.equal(result.value[1]!.emotion, "curious");
  }
});

test("validateVoiceDirectionOutput: rejects a response that is not an object", () => {
  const result = validateVoiceDirectionOutput("not an object", EXPECTED);
  assert.equal(result.valid, false);
});

test("validateVoiceDirectionOutput: rejects a missing sentence id", () => {
  const result = validateVoiceDirectionOutput({ sentences: [validEntry("s1")] }, EXPECTED);
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.errors.some((e) => e.includes("Missing direction")));
});

test("validateVoiceDirectionOutput: rejects a duplicate sentence id", () => {
  const result = validateVoiceDirectionOutput(
    { sentences: [validEntry("s1"), validEntry("s1")] },
    EXPECTED,
  );
  assert.equal(result.valid, false);
});

test("validateVoiceDirectionOutput: rejects reordered sentence ids", () => {
  const result = validateVoiceDirectionOutput(
    { sentences: [validEntry("s2"), validEntry("s1")] },
    EXPECTED,
  );
  assert.equal(result.valid, false);
});

test("validateVoiceDirectionOutput: rejects an unexpected sentence id not in the source story", () => {
  const result = validateVoiceDirectionOutput(
    { sentences: [validEntry("s1"), validEntry("s3")] },
    EXPECTED,
  );
  assert.equal(result.valid, false);
});

test("validateVoiceDirectionOutput: rejects an emotion outside the closed enum", () => {
  const result = validateVoiceDirectionOutput(
    { sentences: [validEntry("s1", { emotion: "furious" }), validEntry("s2")] },
    EXPECTED,
  );
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.errors.some((e) => e.includes("invalid emotion")));
});

test("validateVoiceDirectionOutput: rejects an energy/pace/pauseBefore outside their closed enums", () => {
  const badEnergy = validateVoiceDirectionOutput(
    { sentences: [validEntry("s1", { energy: "extreme" }), validEntry("s2")] },
    EXPECTED,
  );
  assert.equal(badEnergy.valid, false);

  const badPace = validateVoiceDirectionOutput(
    { sentences: [validEntry("s1", { pace: "warp" }), validEntry("s2")] },
    EXPECTED,
  );
  assert.equal(badPace.valid, false);

  const badPause = validateVoiceDirectionOutput(
    { sentences: [validEntry("s1", { pauseBefore: "eternal" }), validEntry("s2")] },
    EXPECTED,
  );
  assert.equal(badPause.valid, false);
});

test("validateVoiceDirectionOutput: accepts an emphasisWord that is a literal substring of that sentence's English text", () => {
  const result = validateVoiceDirectionOutput(
    { sentences: [validEntry("s1"), validEntry("s2", { emphasisWord: "moved" })] },
    EXPECTED,
  );
  assert.equal(result.valid, true);
  if (result.valid) assert.equal(result.value[1]!.emphasisWord, "moved");
});

test("validateVoiceDirectionOutput: rejects an emphasisWord that is not a literal substring of that sentence's text (invented or from a different sentence)", () => {
  const result = validateVoiceDirectionOutput(
    { sentences: [validEntry("s1"), validEntry("s2", { emphasisWord: "creaked" })] },
    EXPECTED,
  );
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.errors.some((e) => e.includes("emphasisWord")));
});

test("validateVoiceDirectionOutput: rejects a response with the wrong number of directions", () => {
  const result = validateVoiceDirectionOutput({ sentences: [validEntry("s1")] }, EXPECTED);
  assert.equal(result.valid, false);
});
