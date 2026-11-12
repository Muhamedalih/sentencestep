import assert from "node:assert/strict";
import test from "node:test";

import {
  EMPTY_ROUNDS_RATING_STATE,
  parseRoundsRatingState,
  shouldAskRoundsRating,
  withFinishedRound,
  withRated,
  withSkip,
} from "@/lib/word-ladder/rating-gate";

test("the card is asked after the first finished round", () => {
  assert.equal(shouldAskRoundsRating(EMPTY_ROUNDS_RATING_STATE), false);
  assert.equal(shouldAskRoundsRating(withFinishedRound(EMPTY_ROUNDS_RATING_STATE)), true);
});

test("'not now' waits three more finished rounds, and a second one waits three more", () => {
  let state = withFinishedRound(EMPTY_ROUNDS_RATING_STATE);
  state = withSkip(state);
  for (let i = 0; i < 2; i++) {
    state = withFinishedRound(state);
    assert.equal(shouldAskRoundsRating(state), false, `round ${state.finished}`);
  }
  state = withFinishedRound(state);
  assert.equal(shouldAskRoundsRating(state), true);
  state = withSkip(state);
  for (let i = 0; i < 2; i++) {
    state = withFinishedRound(state);
    assert.equal(shouldAskRoundsRating(state), false);
  }
  state = withFinishedRound(state);
  assert.equal(state.skips, 2);
  assert.equal(shouldAskRoundsRating(state), false, "never asked a third time");
  assert.equal(shouldAskRoundsRating(withFinishedRound(state)), false);
});

test("a learner who rated is never asked again", () => {
  const state = withRated(withFinishedRound(EMPTY_ROUNDS_RATING_STATE));
  assert.equal(shouldAskRoundsRating(state), false);
  assert.equal(shouldAskRoundsRating(withFinishedRound(withFinishedRound(state))), false);
});

test("storage that holds nothing, rubbish or a wrong shape gives the empty state", () => {
  assert.deepEqual(parseRoundsRatingState(null), EMPTY_ROUNDS_RATING_STATE);
  assert.deepEqual(parseRoundsRatingState("not json"), EMPTY_ROUNDS_RATING_STATE);
  assert.deepEqual(parseRoundsRatingState("3"), EMPTY_ROUNDS_RATING_STATE);
  assert.deepEqual(
    parseRoundsRatingState(JSON.stringify({ rated: "yes", skips: -2, finished: 1.5 })),
    EMPTY_ROUNDS_RATING_STATE,
  );
});

test("a saved state comes back as it was", () => {
  const saved = { rated: false, skips: 1, finished: 4 };
  assert.deepEqual(parseRoundsRatingState(JSON.stringify(saved)), saved);
});
