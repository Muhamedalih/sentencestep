// Run with `npm run test:feedback`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { RATINGS_HIDDEN, parseRatingsSettings } from "./ratings-settings";

test("both switches read from the row", () => {
  assert.deepEqual(parseRatingsSettings({ show_rating_proof: true, show_public_ratings: false }), {
    showRatingProof: true,
    showPublicRatings: false,
  });
  assert.deepEqual(parseRatingsSettings({ show_rating_proof: false, show_public_ratings: true }), {
    showRatingProof: false,
    showPublicRatings: true,
  });
});

test("only a real true turns anything on", () => {
  for (const notTrue of ["true", 1, "yes", null, undefined, {}]) {
    assert.deepEqual(
      parseRatingsSettings({ show_rating_proof: notTrue, show_public_ratings: notTrue }),
      RATINGS_HIDDEN,
      String(notTrue),
    );
  }
});

test("no row, or something that isn't a row, shows nothing", () => {
  for (const bad of [null, undefined, "x", 5, []]) {
    assert.deepEqual(parseRatingsSettings(bad), RATINGS_HIDDEN, String(bad));
  }
});
