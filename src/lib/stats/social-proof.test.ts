// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MIN_LEARNERS_TO_SHOW,
  MIN_LESSONS_TO_SHOW,
  buildSocialProof,
  roundDownForDisplay,
} from "./social-proof";

test("roundDownForDisplay: keeps two significant digits and only ever rounds down", () => {
  assert.equal(roundDownForDisplay(5_237), 5_200);
  assert.equal(roundDownForDisplay(999), 990);
  assert.equal(roundDownForDisplay(1_000), 1_000);
  assert.equal(roundDownForDisplay(1_999), 1_900);
  assert.equal(roundDownForDisplay(12_345), 12_000);
  assert.equal(roundDownForDisplay(1_234_567), 1_200_000);
});

test("roundDownForDisplay: small and unusable numbers pass through or become zero", () => {
  assert.equal(roundDownForDisplay(87), 87);
  assert.equal(roundDownForDisplay(0), 0);
  assert.equal(roundDownForDisplay(-5), 0);
  assert.equal(roundDownForDisplay(Number.NaN), 0);
  assert.equal(roundDownForDisplay(Number.POSITIVE_INFINITY), 0);
});

test("roundDownForDisplay: never exceeds the real number", () => {
  for (const value of [100, 101, 555, 9_999, 10_000, 123_456, 7_777_777]) {
    assert.ok(roundDownForDisplay(value) <= value, String(value));
  }
});

test("buildSocialProof: a figure below its minimum is left out, one at or above it is rounded down", () => {
  assert.deepEqual(buildSocialProof({ learners: MIN_LEARNERS_TO_SHOW - 1, lessons: 100 }), {
    learners: null,
    lessons: null,
  });
  assert.deepEqual(buildSocialProof({ learners: 3_456, lessons: 61_234 }), {
    learners: 3_400,
    lessons: 61_000,
  });
  assert.deepEqual(
    buildSocialProof({ learners: MIN_LEARNERS_TO_SHOW, lessons: MIN_LESSONS_TO_SHOW }),
    { learners: 500, lessons: 5_000 },
  );
});
