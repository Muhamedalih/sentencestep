// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { MIN_RATINGS_TO_QUOTE, buildRatingsProof } from "./ratings-proof";

test("buildRatingsProof: a believable average from enough ratings is quoted, rounded down", () => {
  // 137 ratings: 100 five-star, 30 four-star, 7 three-star = (500 + 120 + 21) / 137 = 4.678...
  assert.deepEqual(buildRatingsProof([0, 0, 7, 30, 100]), { average: 4.6, count: 130 });
  // 1,234 ratings, all five-star.
  assert.deepEqual(buildRatingsProof([0, 0, 0, 0, 1234]), { average: 5, count: 1_200 });
});

test("buildRatingsProof: the average is never rounded up", () => {
  // 19 five-star + 1 four-star = 99 / 20 = 4.95, which must read 4.9, not 5.0.
  assert.equal(buildRatingsProof([0, 0, 0, 1, 19])!.average, 4.9);
  // 4.999... must read 4.9.
  assert.equal(buildRatingsProof([0, 0, 0, 1, 999])!.average, 4.9);
});

test("buildRatingsProof: too few ratings are never quoted", () => {
  assert.equal(buildRatingsProof([0, 0, 0, 0, MIN_RATINGS_TO_QUOTE - 1]), null);
  assert.deepEqual(buildRatingsProof([0, 0, 0, 0, MIN_RATINGS_TO_QUOTE]), {
    average: 5,
    count: MIN_RATINGS_TO_QUOTE,
  });
  assert.equal(buildRatingsProof([0, 0, 0, 0, 0]), null);
});

test("buildRatingsProof: a bad shape is refused rather than guessed at", () => {
  assert.equal(buildRatingsProof([]), null);
  assert.equal(buildRatingsProof([0, 0, 0, 100]), null);
  assert.equal(buildRatingsProof([0, 0, 0, 0, 20, 5]), null);
  assert.equal(buildRatingsProof([0, 0, 0, 0, -20]), null);
  assert.equal(buildRatingsProof([0, 0, 0, 0, 20.5]), null);
  assert.equal(buildRatingsProof([0, 0, 0, 0, Number.NaN]), null);
});

test("buildRatingsProof: rounding down never loses a tenth to floating point noise", () => {
  // 100 ratings averaging exactly 4.3 / 4.7 / 4.1 / 3.9.
  for (const [perStar, expected] of [
    [[0, 0, 0, 70, 30], 4.3],
    [[0, 0, 0, 30, 70], 4.7],
    [[0, 0, 0, 90, 10], 4.1],
    [[0, 0, 10, 90, 0], 3.9],
  ] as const) {
    assert.equal(buildRatingsProof(perStar)!.average, expected, String(perStar));
  }
});

test("buildRatingsProof: the count is rounded down to two significant digits", () => {
  assert.equal(buildRatingsProof([0, 0, 0, 0, 5237])!.count, 5_200);
  assert.equal(buildRatingsProof([0, 0, 0, 0, 99])!.count, 99);
});
