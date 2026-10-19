/**
 * Puts the Daily Lessons back to the free set they had before the "free path" experiment
 * (2026-10-19): only the lessons that were already free stay free (normal-1, normal-2, normal-5,
 * normal-6, normal-11 and the three First Steps), and Advanced's unit goes back to the order it had.
 * Word Lists, Passages and Stories are not touched.
 *
 * Only `is_free` and, for three lessons, `order_index` are written — never a title, a sentence, a
 * clip or a voice. Dry run by default: prints exactly what would change. Pass --apply to write it,
 * then it reads everything back. Safe to run twice (a row already in the wanted state is left alone,
 * and a row changed by hand since is never overwritten).
 *
 * Run with: npx tsx --env-file=.env.local scripts/restore-daily-lessons.ts [--apply]
 */
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apply = process.argv.includes("--apply");

if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this.");
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** The Daily Lessons the experiment made free; they go back to Premium. */
const BACK_TO_PREMIUM = ["normal-3", "normal-7", "normal-8", "normal-10"];
/** The Daily Lessons that were free before it and must still be free (checked, never changed). */
const MUST_STAY_FREE = [
  "normal-1",
  "normal-2",
  "normal-5",
  "normal-6",
  "normal-11",
  "onboarding-beginner",
  "onboarding-intermediate",
  "onboarding-advanced",
];
/**
 * Advanced's unit back to its old order. Each move is applied in this order and only while the
 * lesson still has the order the experiment gave it, because (mode, order_index) is unique and a
 * collision would fail the write half-way: normal-8 leaves slot 9 first, normal-11 takes it, and
 * normal-10 takes the slot normal-11 left.
 */
const ORDER_MOVES: { id: string; from: number; to: number }[] = [
  { id: "normal-8", from: 9, to: 40 },
  { id: "normal-11", from: 10, to: 9 },
  { id: "normal-10", from: 11, to: 10 },
];

function fail(message: string): never {
  console.error(`\nStopped, nothing was written: ${message}`);
  process.exit(1);
}

async function main() {
  console.log(apply ? "APPLYING changes.\n" : "DRY RUN (nothing is written; pass --apply).\n");

  const { data, error } = await supabase
    .from("lessons")
    .select("id, order_index, is_free, status, title")
    .eq("mode", "normal");
  if (error) fail(error.message);
  const lessons = new Map((data ?? []).map((row) => [row.id, row]));

  for (const id of [...BACK_TO_PREMIUM, ...MUST_STAY_FREE]) {
    const row = lessons.get(id);
    if (!row || row.status !== "published") fail(`lesson ${id} is not a published Daily Lesson.`);
  }
  for (const id of MUST_STAY_FREE) {
    if (!lessons.get(id)!.is_free)
      fail(`lesson ${id} should be free but is not; check it by hand.`);
  }

  const locks = BACK_TO_PREMIUM.filter((id) => lessons.get(id)!.is_free);
  const moves = ORDER_MOVES.filter((move) => lessons.get(move.id)!.order_index === move.from);
  const moved = ORDER_MOVES.filter((move) => lessons.get(move.id)!.order_index === move.to);

  console.log("Going back to Premium:");
  for (const id of locks) console.log(`  - ${id} "${lessons.get(id)!.title}"`);
  if (locks.length === 0) console.log("  (nothing: already as wanted)");
  console.log("\nBack to their old order:");
  for (const move of moves) console.log(`  ${move.id}: ${move.from} -> ${move.to}`);
  if (moves.length === 0) {
    console.log(
      moved.length === ORDER_MOVES.length
        ? "  (nothing: already in the old order)"
        : "  (skipped: those lessons no longer have the order this expects; check them by hand)",
    );
  }

  if (!apply) {
    console.log("\nDry run only. Run again with --apply to write this.");
    return;
  }

  // Only a row that is still free is touched, so a change made by hand since the read above is never undone.
  for (const id of locks) {
    const { error: lockError } = await supabase
      .from("lessons")
      .update({ is_free: false })
      .eq("id", id)
      .eq("mode", "normal")
      .eq("is_free", true);
    if (lockError) fail(`${id}: ${lockError.message}`);
  }
  for (const move of moves) {
    const { error: moveError } = await supabase
      .from("lessons")
      .update({ order_index: move.to })
      .eq("id", move.id)
      .eq("mode", "normal")
      .eq("order_index", move.from);
    if (moveError) fail(`${move.id} order: ${moveError.message}`);
  }

  const { data: after, error: readError } = await supabase
    .from("lessons")
    .select("id, order_index, is_free")
    .eq("mode", "normal")
    .eq("status", "published")
    .eq("is_free", true)
    .order("order_index");
  if (readError) fail(readError.message);
  console.log("\nNow free Daily Lessons:");
  for (const row of after ?? []) console.log(`  ${row.id} (order ${row.order_index})`);
  console.log("\nDone.");
}

void main();
