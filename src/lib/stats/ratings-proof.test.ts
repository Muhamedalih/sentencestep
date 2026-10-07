// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { MIN_RATINGS_TO_QUOTE, parseRatingsProof } from "./ratings-proof";

test("parseRatingsProof: a believable average from enough ratings is quoted, rounded down", () => {
  assert.deepEqual(parseRatingsProof("4.87", "137"), { average: 4.8, count: 130 });
  assert.deepEqual(parseRatingsProof(" 4.5 ", " 1234 "), { average: 4.5, count: 1_200 });
});

test("parseRatingsProof: nothing is shown until both figures are set", () => {
  assert.equal(parseRatingsProof(undefined, undefined), null);
  assert.equal(parseRatingsProof("4.8", undefined), null);
  assert.equal(parseRatingsProof(undefined, "120"), null);
  assert.equal(parseRatingsProof("", "120"), null);
  assert.equal(parseRatingsProof("4.8", "  "), null);
});

test("parseRatingsProof: too few ratings are never quoted", () => {
  assert.equal(parseRatingsProof("5", String(MIN_RATINGS_TO_QUOTE - 1)), null);
  assert.deepEqual(parseRatingsProof("5", String(MIN_RATINGS_TO_QUOTE)), {
    average: 5,
    count: MIN_RATINGS_TO_QUOTE,
  });
});

test("parseRatingsProof: an average outside 1 to 5, or not a number, is refused", () => {
  for (const bad of ["0", "0.9", "5.1", "9", "-4", "abc", "NaN", "Infinity"]) {
    assert.equal(parseRatingsProof(bad, "200"), null, bad);
  }
});

test("parseRatingsProof: a count that isn't a whole number is refused", () => {
  for (const bad of ["12.5", "abc", "-30", "1e2x"]) {
    assert.equal(parseRatingsProof("4.8", bad), null, bad);
  }
});

test("parseRatingsProof: rounding down never loses a tenth to floating point noise", () => {
  for (const [input, expected] of [
    ["4.3", 4.3],
    ["4.7", 4.7],
    ["4.1", 4.1],
    ["3.9", 3.9],
    ["4.99", 4.9],
  ] as const) {
    assert.equal(parseRatingsProof(input, "100")!.average, expected, input);
  }
});
