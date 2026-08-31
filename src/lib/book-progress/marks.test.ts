// Lightweight Save + Notes system: pure-logic coverage for note
// normalization, the "adding a note implicitly saves the sentence" rule,
// and the "My Saves" pagination split. Duplicate-save prevention and
// per-user isolation are enforced structurally by the schema itself — the
// book_sentence_marks primary key is (user_id, sentence_id) and every
// query/write goes through RLS scoped to auth.uid() = user_id (see
// 20250129000000_book_reading_marks.sql and book-marks.ts's own doc
// comment) — the same "not app-code-tested" convention this codebase
// already applies to every other RLS-backed table.
//
// Run with `npm run test:book-progress` (or `npm test`).

import { test } from "node:test";
import assert from "node:assert/strict";

import { buildNoteMarkFields, normalizeNote, splitPage } from "./marks";

test("normalizeNote trims a real note", () => {
  assert.equal(normalizeNote("  underestimate = يقلل من أهمية  "), "underestimate = يقلل من أهمية");
});

test("normalizeNote collapses empty/whitespace-only/undefined/null to null — 'no note' has exactly one representation", () => {
  assert.equal(normalizeNote(""), null);
  assert.equal(normalizeNote("   "), null);
  assert.equal(normalizeNote(null), null);
  assert.equal(normalizeNote(undefined), null);
});

test("writing a real note implies is_bookmarked — adding a note to an unsaved sentence saves it too", () => {
  const fields = buildNoteMarkFields("underestimate = يقلل من أهمية");
  assert.equal(fields.note, "underestimate = يقلل من أهمية");
  assert.equal(fields.isBookmarked, true);
});

test("clearing a note never touches is_bookmarked — deleting a note does not unsave the sentence", () => {
  const fields = buildNoteMarkFields(null);
  assert.equal(fields.note, null);
  assert.equal(
    "isBookmarked" in fields,
    false,
    "isBookmarked must be entirely absent, not false, so it's never written",
  );
});

test("a whitespace-only note is treated as a clear, not a save", () => {
  const fields = buildNoteMarkFields("   ");
  assert.equal(fields.note, null);
  assert.equal("isBookmarked" in fields, false);
});

test("splitPage: fewer rows than the limit means no next page", () => {
  const result = splitPage([1, 2, 3], 20);
  assert.deepEqual(result.page, [1, 2, 3]);
  assert.equal(result.hasMore, false);
});

test("splitPage: exactly limit+1 rows trims the extra probe row and reports hasMore", () => {
  const rows = Array.from({ length: 21 }, (_, i) => i);
  const result = splitPage(rows, 20);
  assert.equal(result.page.length, 20);
  assert.deepEqual(result.page, rows.slice(0, 20));
  assert.equal(result.hasMore, true);
});

test("splitPage: exactly limit rows (no probe row present) reports no next page", () => {
  const rows = Array.from({ length: 20 }, (_, i) => i);
  const result = splitPage(rows, 20);
  assert.equal(result.page.length, 20);
  assert.equal(result.hasMore, false);
});

test("splitPage: empty input", () => {
  const result = splitPage([], 20);
  assert.deepEqual(result.page, []);
  assert.equal(result.hasMore, false);
});
