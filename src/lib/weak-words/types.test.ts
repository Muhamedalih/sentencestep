import { test } from "node:test";
import assert from "node:assert/strict";

import { isWeakWord, isWeakWordDue, WEAK_WORD_REVIEW_STAGE_THRESHOLD } from "./types";

test("isWeakWord: an active, never-corrected mistake is always weak", () => {
  assert.equal(isWeakWord({ status: "active", reviewStage: 0, nextReviewAt: null }), true);
});

test("isWeakWord: a single isolated mistake (fresh correction, stage 1) is still weak", () => {
  assert.equal(
    isWeakWord({ status: "corrected", reviewStage: 1, nextReviewAt: "2026-01-01T00:00:00Z" }),
    true,
  );
});

test("isWeakWord: right at the threshold is still weak", () => {
  assert.equal(
    isWeakWord({
      status: "corrected",
      reviewStage: WEAK_WORD_REVIEW_STAGE_THRESHOLD,
      nextReviewAt: "2026-01-01T00:00:00Z",
    }),
    true,
  );
});

test("isWeakWord: past the threshold (demonstrated consistency) is no longer weak", () => {
  assert.equal(
    isWeakWord({
      status: "corrected",
      reviewStage: WEAK_WORD_REVIEW_STAGE_THRESHOLD + 1,
      nextReviewAt: "2026-01-01T00:00:00Z",
    }),
    false,
  );
});

test("isWeakWord: a mastered word (schedule exhausted, nextReviewAt null) is never weak regardless of stage", () => {
  assert.equal(isWeakWord({ status: "corrected", reviewStage: 5, nextReviewAt: null }), false);
});

test("isWeakWord: high historical mistake_count alone (not modeled here) never enters the decision", () => {
  // mistakeCount isn't even a field on the predicate's input — this test
  // documents that omission is intentional: a word with a long history of
  // mistakes but full, recent review success (past the threshold) reads as
  // not-weak, exactly like a word with no history at all.
  assert.equal(
    isWeakWord({
      status: "corrected",
      reviewStage: WEAK_WORD_REVIEW_STAGE_THRESHOLD + 1,
      nextReviewAt: "2026-01-01T00:00:00Z",
    }),
    false,
  );
});

test("isWeakWordDue: an unfixed mistake is always waiting for review", () => {
  const now = new Date("2026-01-10T12:00:00Z");
  assert.equal(isWeakWordDue({ status: "active", nextReviewAt: null }, now), true);
  assert.equal(
    isWeakWordDue({ status: "active", nextReviewAt: "2026-02-01T00:00:00Z" }, now),
    true,
  );
});

test("isWeakWordDue: a corrected word waits for its scheduled day, then is due", () => {
  const now = new Date("2026-01-10T12:00:00Z");
  assert.equal(
    isWeakWordDue({ status: "corrected", nextReviewAt: "2026-01-11T00:00:00Z" }, now),
    false,
  );
  assert.equal(
    isWeakWordDue({ status: "corrected", nextReviewAt: "2026-01-10T12:00:00Z" }, now),
    true,
  );
  assert.equal(
    isWeakWordDue({ status: "corrected", nextReviewAt: "2026-01-09T00:00:00Z" }, now),
    true,
  );
});

test("isWeakWordDue: a corrected word with nothing scheduled, or an unreadable time, is not due", () => {
  const now = new Date("2026-01-10T12:00:00Z");
  assert.equal(isWeakWordDue({ status: "corrected", nextReviewAt: null }, now), false);
  assert.equal(isWeakWordDue({ status: "corrected", nextReviewAt: "not a date" }, now), false);
});
