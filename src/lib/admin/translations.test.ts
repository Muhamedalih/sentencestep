// Deterministic unit tests for the pure translation-lifecycle logic in
// translations.ts — no database. upsertTranslation/getEsTranslations/
// upsertEsWordArrayTranslation/markTranslationsStaleIfChanged all require a
// real Supabase session client (createClient() from @/lib/supabase/server,
// which needs next/headers) and aren't unit-testable in isolation;
// orphanedSentenceTranslationIds and isNowStale are the pure pieces,
// extracted specifically so they can be tested this way. Run with
// `npm run test:admin`.

import assert from "node:assert/strict";
import { test } from "node:test";

import { isNowStale, orphanedSentenceTranslationIds } from "./translations";

test("orphanedSentenceTranslationIds: no change in sentence count leaves nothing orphaned", () => {
  const previous = ["story-1-s1", "story-1-s2", "story-1-s3"];
  const current = ["story-1-s1", "story-1-s2", "story-1-s3"];
  assert.deepEqual(orphanedSentenceTranslationIds(previous, current), []);
});

test("orphanedSentenceTranslationIds: a shrinking sentence count orphans the trailing ids", () => {
  // Mirrors saveLesson()'s actual id scheme (${lessonId}-s${index + 1}) and
  // its delete-and-reinsert behavior: a 12-sentence story edited down to 9
  // sentences (e.g. after a mode change) leaves ids s10-s12 with no
  // matching sentence row anymore.
  const previous = Array.from({ length: 12 }, (_, i) => `story-1-s${i + 1}`);
  const current = Array.from({ length: 9 }, (_, i) => `story-1-s${i + 1}`);
  assert.deepEqual(orphanedSentenceTranslationIds(previous, current), [
    "story-1-s10",
    "story-1-s11",
    "story-1-s12",
  ]);
});

test("orphanedSentenceTranslationIds: a growing sentence count orphans nothing", () => {
  const previous = Array.from({ length: 9 }, (_, i) => `story-1-s${i + 1}`);
  const current = Array.from({ length: 12 }, (_, i) => `story-1-s${i + 1}`);
  assert.deepEqual(orphanedSentenceTranslationIds(previous, current), []);
});

test("orphanedSentenceTranslationIds: a brand-new lesson (no previous sentences) orphans nothing", () => {
  const current = Array.from({ length: 9 }, (_, i) => `normal-42-s${i + 1}`);
  assert.deepEqual(orphanedSentenceTranslationIds([], current), []);
});

test("orphanedSentenceTranslationIds: every previous sentence removed orphans all of them", () => {
  const previous = ["normal-1-s1", "normal-1-s2"];
  assert.deepEqual(orphanedSentenceTranslationIds(previous, []), ["normal-1-s1", "normal-1-s2"]);
});

// --- isNowStale ---

test("isNowStale: a matching snapshot is not stale", () => {
  assert.equal(isNowStale("I drink coffee.", "I drink coffee."), false);
});

test("isNowStale: a mismatched snapshot is stale", () => {
  assert.equal(isNowStale("I drink coffee.", "I drink tea."), true);
});

test("isNowStale: a null snapshot (unknown baseline) is never treated as stale", () => {
  assert.equal(isNowStale(null, "I drink tea."), false);
});
