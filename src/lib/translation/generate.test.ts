// Deterministic unit tests for the pure eligibility-filter logic in
// generate.ts — no database, no provider call. generateLessonTranslationDraft
// itself requires a real Supabase client and isn't unit-testable in
// isolation (same established pattern as translations.ts/candidates.ts);
// isFieldEligibleForGeneration is the pure piece extracted specifically so
// the "approved is never re-selected, and this has nothing to do with
// which locale it is" invariant has a permanent, fast regression test.

import assert from "node:assert/strict";
import { test } from "node:test";

import { isFieldEligibleForGeneration } from "./generate";

test("isFieldEligibleForGeneration: an approved field, not forced, is not eligible (never auto-overwritten)", () => {
  assert.equal(isFieldEligibleForGeneration("approved", false), false);
});

test("isFieldEligibleForGeneration: an approved field IS eligible when explicitly forced (the dashboard's Regenerate action)", () => {
  assert.equal(isFieldEligibleForGeneration("approved", true), true);
});

test("isFieldEligibleForGeneration: an ai_generated field is always eligible (a fresh draft may still need retranslating)", () => {
  assert.equal(isFieldEligibleForGeneration("ai_generated", false), true);
});

test("isFieldEligibleForGeneration: a failed field is always eligible (retry)", () => {
  assert.equal(isFieldEligibleForGeneration("failed", false), true);
});

test("isFieldEligibleForGeneration: a field with no existing row (missing) is always eligible", () => {
  assert.equal(isFieldEligibleForGeneration(undefined, false), true);
});

// The function's signature takes only (status, forced) — no locale
// parameter exists for it to special-case on, which is what actually
// guarantees Arabic, Spanish, and Turkish rows are filtered by the exact
// same rule with no per-locale branch anywhere in this logic.
