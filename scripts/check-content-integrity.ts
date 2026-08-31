/**
 * Read-only production-content sanity check against the real, connected
 * Supabase project. Not part of the running app, and not wired into `npm
 * test` — it needs live service-role credentials (NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY), which aren't safe to assume are present in
 * every environment this repo runs in (a plain CI checkout, a contributor's
 * machine without a linked project), so it's a manual, on-demand harness
 * instead of an automated test.
 *
 * Checks things the database schema's own constraints *don't* already
 * guarantee: most orphan/duplicate cases are structurally impossible here
 * (foreign keys, `unique(mode, order_index)`, `unique(lesson_id,
 * order_index)` — see the migrations) — but nothing in the schema enforces
 * the admin CMS's own sentence-count standard
 * (REQUIRED_SENTENCE_COUNT in src/lib/admin/validation.ts) against content
 * that reached the database by some other path (the one-time seed
 * migration, direct SQL), and nothing prevents a *published* lesson from
 * having zero sentences if a save was ever interrupted before this repo's
 * admin/content-actions.ts fix that reverts it to draft in that case.
 *
 * Run with: npx tsx scripts/check-content-integrity.ts
 */
import { createClient } from "@supabase/supabase-js";

import { MIN_STORY_SENTENCE_COUNT, REQUIRED_SENTENCE_COUNT } from "../src/lib/admin/validation";
import type { Database } from "../src/types/database";
import type { LearningMode } from "../src/types/content";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g. from .env.local) before running this.",
  );
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let problems = 0;

function report(message: string): void {
  problems += 1;
  console.error(`✗ ${message}`);
}

// The PostgREST endpoint behind supabase-js caps a single unpaginated
// select at its configured db-max-rows (1000 by default) — silently, with
// no error, just a truncated result. The sentences table crossed that
// threshold as the library grew, which was making this checker miscount
// (and falsely flag as broken) whichever lessons' rows landed past row
// 1000. Paginating in fixed-size pages is the fix; PAGE_SIZE is comfortably
// under any reasonable db-max-rows setting.
const PAGE_SIZE = 500;

async function fetchAllSentences(): Promise<{ id: string; lesson_id: string }[]> {
  const all: { id: string; lesson_id: string }[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("sentences")
      .select("id, lesson_id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    all.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

async function main() {
  const [{ data: lessons, error: lessonsError }, sentences] = await Promise.all([
    supabase.from("lessons").select("id, mode, title, status, is_free"),
    fetchAllSentences(),
  ]);

  if (lessonsError) throw lessonsError;

  const sentenceCountByLesson = new Map<string, number>();
  for (const sentence of sentences) {
    sentenceCountByLesson.set(
      sentence.lesson_id,
      (sentenceCountByLesson.get(sentence.lesson_id) ?? 0) + 1,
    );
  }

  for (const lesson of lessons ?? []) {
    const count = sentenceCountByLesson.get(lesson.id) ?? 0;
    const mode = lesson.mode as LearningMode;

    if (count === 0 && lesson.status === "published") {
      report(
        `"${lesson.title}" (${lesson.id}) is published with zero sentences — learners would see a broken, empty lesson.`,
      );
      continue;
    }

    // Stories deliberately don't hold to an exact count (see
    // MIN_STORY_SENTENCE_COUNT's doc comment) — only the structural floor
    // applies. Normal lessons and conversations keep the exact-count rule.
    if (mode === "stories") {
      if (count < MIN_STORY_SENTENCE_COUNT) {
        report(
          `"${lesson.title}" (${lesson.id}, mode "stories") has ${count} sentence(s), expected at least ${MIN_STORY_SENTENCE_COUNT}.`,
        );
      }
    } else {
      const required = REQUIRED_SENTENCE_COUNT[mode];
      if (count !== required) {
        report(
          `"${lesson.title}" (${lesson.id}, mode "${mode}") has ${count} sentence(s), expected exactly ${required}.`,
        );
      }
    }
  }

  if (problems === 0) {
    console.log(`✓ ${lessons?.length ?? 0} lessons checked, all consistent.`);
  } else {
    console.error(`\n${problems} problem(s) found.`);
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error("check-content-integrity failed:", error);
  process.exit(1);
});
