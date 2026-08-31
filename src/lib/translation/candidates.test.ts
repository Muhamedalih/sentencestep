// Deterministic unit tests for findLessonIdsNeedingGeneration — no real
// database. The fake client below implements just the query-builder surface
// this function actually calls (.select/.eq/.lt/.order/.limit, then
// awaited), applied against small in-memory fixture arrays. Every test runs
// for both "es" (an already-enabled locale) and "tr" (newly enabled) to
// prove the candidate-selection logic treats Turkish identically — there is
// no locale-specific branch in candidates.ts to test separately.
//
// This is deliberately narrower than a real integration test (see this
// session's Turkish-onboarding report for the live, isolated-record
// verification of the full eligibility/safety-boundary behavior against the
// real database) — it exists to give this specific selection logic a
// permanent, fast, checked-in regression test, which it previously had none
// of for any locale.

import assert from "node:assert/strict";
import { test } from "node:test";

import { findLessonIdsNeedingGeneration } from "./candidates";

type FixtureTable = "content_translations" | "lessons";
interface Fixtures {
  content_translations: Record<string, unknown>[];
  lessons: Record<string, unknown>[];
}

function makeFakeSupabase(fixtures: Fixtures) {
  return {
    from(table: FixtureTable) {
      const eqFilters: [string, unknown][] = [];
      const ltFilters: [string, number][] = [];
      let limitN: number | undefined;
      let orderCol: string | undefined;
      let orderAscending = true;

      const builder = {
        select() {
          return builder;
        },
        eq(column: string, value: unknown) {
          eqFilters.push([column, value]);
          return builder;
        },
        lt(column: string, value: number) {
          ltFilters.push([column, value]);
          return builder;
        },
        order(column: string, opts?: { ascending?: boolean }) {
          orderCol = column;
          orderAscending = opts?.ascending ?? true;
          return builder;
        },
        limit(n: number) {
          limitN = n;
          return builder;
        },
        then(resolve: (result: { data: Record<string, unknown>[]; error: null }) => void) {
          let rows = [...fixtures[table]];
          for (const [column, value] of eqFilters)
            rows = rows.filter((row) => row[column] === value);
          for (const [column, value] of ltFilters)
            rows = rows.filter((row) => (row[column] as number) < value);
          if (orderCol) {
            const col = orderCol;
            rows.sort((a, b) => {
              const av = a[col] as string;
              const bv = b[col] as string;
              if (av === bv) return 0;
              return orderAscending ? (av < bv ? -1 : 1) : av > bv ? -1 : 1;
            });
          }
          if (limitN !== undefined) rows = rows.slice(0, limitN);
          resolve({ data: rows, error: null });
        },
      };
      return builder;
    },
  } as unknown as Parameters<typeof findLessonIdsNeedingGeneration>[0];
}

for (const locale of ["es", "tr"] as const) {
  test(`findLessonIdsNeedingGeneration (${locale}): a retriable failed field surfaces its parent lesson`, async () => {
    const supabase = makeFakeSupabase({
      content_translations: [
        {
          content_type: "sentence",
          content_id: "story-1-s3",
          locale,
          status: "failed",
          attempts: 2,
        },
      ],
      lessons: [],
    });
    assert.deepEqual(await findLessonIdsNeedingGeneration(supabase, locale, 10), ["story-1"]);
  });

  test(`findLessonIdsNeedingGeneration (${locale}): a failed field at the retry limit is excluded, falling back to published lessons`, async () => {
    const supabase = makeFakeSupabase({
      content_translations: [
        { content_type: "lesson", content_id: "lesson-x", locale, status: "failed", attempts: 5 },
      ],
      lessons: [{ id: "fallback-lesson", status: "published", updated_at: "2025-01-01" }],
    });
    assert.deepEqual(await findLessonIdsNeedingGeneration(supabase, locale, 10), [
      "fallback-lesson",
    ]);
  });

  test(`findLessonIdsNeedingGeneration (${locale}): falls back to the oldest-updated published lesson when nothing has failed`, async () => {
    const supabase = makeFakeSupabase({
      content_translations: [],
      lessons: [
        { id: "newer", status: "published", updated_at: "2025-02-01" },
        { id: "older", status: "published", updated_at: "2025-01-01" },
      ],
    });
    assert.deepEqual(await findLessonIdsNeedingGeneration(supabase, locale, 1), ["older"]);
  });
}

test("findLessonIdsNeedingGeneration: a failed row in one locale never surfaces a lesson only when queried under a different locale", async () => {
  const supabase = makeFakeSupabase({
    content_translations: [
      {
        content_type: "lesson",
        content_id: "es-only-lesson",
        locale: "es",
        status: "failed",
        attempts: 1,
      },
      {
        content_type: "lesson",
        content_id: "tr-only-lesson",
        locale: "tr",
        status: "failed",
        attempts: 1,
      },
    ],
    lessons: [],
  });
  assert.deepEqual(await findLessonIdsNeedingGeneration(supabase, "tr", 10), ["tr-only-lesson"]);
  assert.deepEqual(await findLessonIdsNeedingGeneration(supabase, "es", 10), ["es-only-lesson"]);
});
