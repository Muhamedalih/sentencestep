import assert from "node:assert/strict";
import { test } from "node:test";

import { isAppRatingDue } from "./app-rating-due";

const done = (...ids: string[]) => ids.map((lessonId) => ({ lessonId }));

test("English is asked at the second English lesson only", () => {
  assert.equal(isAppRatingDue(done("a"), "a"), false);
  assert.equal(isAppRatingDue(done("a", "b"), "b"), true);
  assert.equal(isAppRatingDue(done("a", "b", "c"), "c"), false);
});

test("an English history does not count for German", () => {
  assert.equal(isAppRatingDue(done("a", "b", "c", "de-a"), "de-a"), false);
  assert.equal(isAppRatingDue(done("a", "b", "c", "de-a", "de-b"), "de-b"), true);
});

test("a German learner already past the second lesson is still asked", () => {
  assert.equal(isAppRatingDue(done("de-a", "de-b", "de-c", "de-d"), "de-d"), true);
});

test("German lessons do not count for English", () => {
  assert.equal(isAppRatingDue(done("de-a", "de-b", "a"), "a"), false);
  assert.equal(isAppRatingDue(done("de-a", "a", "b"), "b"), true);
});
