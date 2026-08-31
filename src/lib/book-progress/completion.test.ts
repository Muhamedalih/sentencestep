// Regression tests for A1's other half: whether a reader is shown as having
// "completed" a book must never be inferred from a null progress pointer
// alone, since a routine content edit can null that pointer without the
// reader having read anything more. These test the underlying state
// (isBookProgressComplete's return value against real completedCount/
// totalCount pairs), not just "the completion screen doesn't render."
//
// Run with `npm run test:admin` (or `npm test`, which runs every *.test.ts).

import { test } from "node:test";
import assert from "node:assert/strict";

import { isBookProgressComplete } from "./completion";

// --- TEST 6 — final section but unfinished ---
// A reader in the book's last section who has NOT completed its final
// sentence must not be reported complete, even though their pointer could,
// in principle, be affected by an edit to that same section.
test("TEST 6 — a reader short of the book's total sentence count is never complete", () => {
  assert.equal(isBookProgressComplete(199, 201), false);
  assert.equal(isBookProgressComplete(200, 201), false);
});

// --- TEST 7 — genuine completion ---
// Completing the book's actual last sentence brings completedSentenceCount
// to exactly the live total — this must read as complete.
test("TEST 7 — completedSentenceCount reaching the live total is complete", () => {
  assert.equal(isBookProgressComplete(201, 201), true);
});

test("a completedSentenceCount past the live total (e.g. content shrank after completion) is still complete, never negative-percent", () => {
  assert.equal(isBookProgressComplete(201, 196), true);
});

test("a book with zero current sentences is never reported complete, regardless of completedSentenceCount", () => {
  assert.equal(isBookProgressComplete(0, 0), false);
  assert.equal(isBookProgressComplete(5, 0), false);
});

// --- TEST 8 — multi-user independence ---
// Two readers' completion states, computed independently, must never affect
// one another — the function takes no shared state, only the one reader's
// own numbers.
test("TEST 8 — two readers' completion states are computed independently", () => {
  // Reader A: mid-book. Reader B: genuinely finished. Same book (same total).
  const totalSentenceCount = 201;
  const readerA = isBookProgressComplete(50, totalSentenceCount);
  const readerB = isBookProgressComplete(201, totalSentenceCount);

  assert.equal(readerA, false, "reader A, at sentence 50 of 201, is not complete");
  assert.equal(readerB, true, "reader B, having read all 201, is complete");
});

// --- Explicit old-vs-new regression demonstration ---
// Simulates the previous implementation's rule (`currentSentenceId === null
// && completedSentenceCount > 0`) against the exact scenario A1 described:
// a section save nulls the pointer of a reader who is only partway through
// the book.
test("regression: a nulled pointer from a content edit read as 'complete' under the old rule, not under the new one", () => {
  const completedSentenceCount = 50; // partway through
  const totalSentenceCount = 201;
  const currentSentenceIdAfterEdit: string | null = null; // nulled by a section save, not genuine completion

  const oldRuleResult = currentSentenceIdAfterEdit === null && completedSentenceCount > 0;
  assert.equal(
    oldRuleResult,
    true,
    "OLD rule: a routine edit's nulled pointer was misread as book completion",
  );

  const newRuleResult = isBookProgressComplete(completedSentenceCount, totalSentenceCount);
  assert.equal(
    newRuleResult,
    false,
    "NEW rule: the same nulled pointer is correctly NOT read as completion",
  );
});
