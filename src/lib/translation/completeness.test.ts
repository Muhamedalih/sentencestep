import assert from "node:assert/strict";
import { test } from "node:test";

import {
  deriveOverallState,
  requiredTranslationFields,
  summarizeCompleteness,
} from "./completeness";
import type { ExistingTranslationRow } from "./completeness";

test("requiredTranslationFields: a lesson with a description requires title + description + every sentence", () => {
  const fields = requiredTranslationFields({ id: "story-1", description: "A blurb." }, [
    "story-1-s1",
    "story-1-s2",
  ]);
  assert.equal(fields.length, 4);
  assert.deepEqual(
    fields.map((f) => f.field),
    ["title", "description", "text", "text"],
  );
});

test("requiredTranslationFields: a lesson with no description requires one fewer field, not a missing one", () => {
  const fields = requiredTranslationFields({ id: "normal-1", description: null }, ["normal-1-s1"]);
  assert.equal(fields.length, 2);
  assert.ok(!fields.some((f) => f.field === "description"));
});

test("requiredTranslationFields: adapts automatically to any sentence count", () => {
  const nineSentenceLesson = requiredTranslationFields(
    { id: "normal-1", description: null },
    Array.from({ length: 9 }, (_, i) => `normal-1-s${i + 1}`),
  );
  const twelveSentenceStory = requiredTranslationFields(
    { id: "story-1", description: null },
    Array.from({ length: 12 }, (_, i) => `story-1-s${i + 1}`),
  );
  assert.equal(nineSentenceLesson.length, 10);
  assert.equal(twelveSentenceStory.length, 13);
});

const required = requiredTranslationFields({ id: "story-1", description: "A blurb." }, [
  "story-1-s1",
  "story-1-s2",
]);

function row(
  field: "title" | "description" | "text",
  contentId: string,
  status: ExistingTranslationRow["status"],
  isStale = false,
): ExistingTranslationRow {
  return {
    contentType: field === "text" ? "sentence" : "lesson",
    contentId,
    field,
    status,
    isStale,
  };
}

test("summarizeCompleteness: nothing generated yet — everything missing", () => {
  const summary = summarizeCompleteness(required, []);
  assert.deepEqual(summary, {
    total: 4,
    approved: 0,
    aiGenerated: 0,
    failed: 0,
    missing: 4,
    stale: 0,
  });
});

test("summarizeCompleteness: fully approved", () => {
  const existing = [
    row("title", "story-1", "approved"),
    row("description", "story-1", "approved"),
    row("text", "story-1-s1", "approved"),
    row("text", "story-1-s2", "approved"),
  ];
  const summary = summarizeCompleteness(required, existing);
  assert.equal(summary.approved, 4);
  assert.equal(summary.missing, 0);
});

test("summarizeCompleteness: a mix of approved, ai_generated, and missing", () => {
  const existing = [
    row("title", "story-1", "approved"),
    row("description", "story-1", "ai_generated"),
  ];
  const summary = summarizeCompleteness(required, existing);
  assert.deepEqual(summary, {
    total: 4,
    approved: 1,
    aiGenerated: 1,
    failed: 0,
    missing: 2,
    stale: 0,
  });
});

test("summarizeCompleteness: counts stale independently of status", () => {
  const existing = [
    row("title", "story-1", "approved", true),
    row("description", "story-1", "ai_generated", true),
  ];
  const summary = summarizeCompleteness(required, existing);
  assert.equal(summary.stale, 2);
  assert.equal(summary.approved, 1);
  assert.equal(summary.aiGenerated, 1);
});

test("summarizeCompleteness: counts a failed field", () => {
  const existing = [row("title", "story-1", "failed")];
  const summary = summarizeCompleteness(required, existing);
  assert.equal(summary.failed, 1);
  assert.equal(summary.missing, 3);
});

test("deriveOverallState: a lesson with no translatable fields is trivially APPROVED", () => {
  assert.equal(
    deriveOverallState({ total: 0, approved: 0, aiGenerated: 0, failed: 0, missing: 0, stale: 0 }),
    "APPROVED",
  );
});

test("deriveOverallState: fully approved, nothing stale", () => {
  assert.equal(
    deriveOverallState({ total: 4, approved: 4, aiGenerated: 0, failed: 0, missing: 0, stale: 0 }),
    "APPROVED",
  );
});

test("deriveOverallState: nothing attempted yet is MISSING", () => {
  assert.equal(
    deriveOverallState({ total: 4, approved: 0, aiGenerated: 0, failed: 0, missing: 4, stale: 0 }),
    "MISSING",
  );
});

test("deriveOverallState: a mix of approved and ai_generated is NEEDS_REVIEW", () => {
  assert.equal(
    deriveOverallState({ total: 4, approved: 2, aiGenerated: 2, failed: 0, missing: 0, stale: 0 }),
    "NEEDS_REVIEW",
  );
});

test("deriveOverallState: any stale field wins over an otherwise-complete approved state", () => {
  assert.equal(
    deriveOverallState({ total: 4, approved: 4, aiGenerated: 0, failed: 0, missing: 0, stale: 1 }),
    "STALE",
  );
});

test("deriveOverallState: any failed field takes priority over stale", () => {
  assert.equal(
    deriveOverallState({ total: 4, approved: 2, aiGenerated: 0, failed: 1, missing: 1, stale: 1 }),
    "FAILED",
  );
});
