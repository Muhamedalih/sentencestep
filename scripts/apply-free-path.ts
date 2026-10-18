/**
 * Sets which lessons, word lists and passages are free, for the "free path" change:
 *
 *  - Daily Lessons: 4 free lessons per level — the level's First Steps plus the first three
 *    lessons of its curriculum unit (establish, build, build). The unit's closing "integrate"
 *    lesson stays Premium.
 *  - Word Lists: 3 free topic lists per level (the level's first three by order).
 *  - Passages: 2 free per level (A1, A2, B1, B2), and the word lesson that comes with each
 *    free passage is free too, so a free passage never ends at a lock.
 *
 * It also puts Advanced's unit in teaching order: that unit's "establish" lesson
 * (normal-8) sits at the very end of the list (order 40), so the free lessons of that level
 * would otherwise not be the first ones its learners see. Only `is_free` (and, for those
 * three lessons, `order_index`) is written — never a title, a sentence, a clip or a voice.
 *
 * Dry run by default: prints exactly what would change. Pass --apply to write it, then it reads
 * everything back and prints the result per level. Safe to run twice (a row already in the
 * wanted state is left alone). To undo: run it again after editing the lists below, or flip the
 * rows in the admin Content / Word Lists / Passages pages.
 *
 * Run with: npx tsx --env-file=.env.local scripts/apply-free-path.ts [--apply]
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

/** Daily Lessons that must be free (the first three of each level's unit; First Steps and the lessons already free stay as they are). */
const FREE_LESSONS = ["normal-3", "normal-7", "normal-8", "normal-10"];
/** Daily Lessons that must stay Premium: each unit's closing "integrate" lesson. */
const PREMIUM_LESSONS = ["normal-4", "normal-9", "normal-12"];
/**
 * Advanced's unit in teaching order (establish, build, build, integrate). Each move is applied
 * in this order and only when the lesson still has the order it had when this was written,
 * because (mode, order_index) is unique and a collision would fail the write half-way.
 */
const LESSON_ORDER_MOVES: { id: string; from: number; to: number }[] = [
  { id: "normal-10", from: 10, to: 11 },
  { id: "normal-11", from: 9, to: 10 },
  { id: "normal-8", from: 40, to: 9 },
];

/** Word Lists topics that must be free: the first three of each level (Family, already free, is the first of Beginner). */
const FREE_WORD_GROUPS = [
  "family",
  "colors",
  "animals",
  "friendship",
  "travel",
  "health",
  "politics",
  "finance",
  "technology",
];

/** Passages that must be free: the ones already free (kept) and a second one per level. */
const FREE_PASSAGES = [
  "ten-minutes-a-day",
  "my-cat-is-my-boss",
  "the-escape-room",
  "the-quiet-neighbor",
  "reply-all",
  "the-honest-mechanic",
  "the-quiet-hour",
  "twelve-strangers",
];

function fail(message: string): never {
  console.error(`\nStopped, nothing was written: ${message}`);
  process.exit(1);
}

async function main() {
  console.log(apply ? "APPLYING changes.\n" : "DRY RUN (nothing is written; pass --apply).\n");

  const [lessonsRes, groupsRes, passagesRes] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, level_id, order_index, is_free, status, title")
      .eq("mode", "normal"),
    supabase.from("word_groups").select("id, level, order_index, is_free, status, title"),
    supabase
      .from("passages")
      .select("id, level, order_index, is_free, status, title, word_group_id"),
  ]);
  if (lessonsRes.error) fail(lessonsRes.error.message);
  if (groupsRes.error) fail(groupsRes.error.message);
  if (passagesRes.error) fail(passagesRes.error.message);
  const lessons = new Map((lessonsRes.data ?? []).map((row) => [row.id, row]));
  const groups = new Map((groupsRes.data ?? []).map((row) => [row.id, row]));
  const passages = new Map((passagesRes.data ?? []).map((row) => [row.id, row]));

  for (const id of [...FREE_LESSONS, ...PREMIUM_LESSONS]) {
    const row = lessons.get(id);
    if (!row || row.status !== "published") fail(`lesson ${id} is not a published Daily Lesson.`);
  }
  for (const id of FREE_WORD_GROUPS) {
    const row = groups.get(id);
    if (!row || row.status !== "published") fail(`word list ${id} is not published.`);
  }
  for (const id of FREE_PASSAGES) {
    const row = passages.get(id);
    if (!row || row.status !== "published") fail(`passage ${id} is not published.`);
  }
  for (const id of PREMIUM_LESSONS) {
    if (lessons.get(id)?.is_free)
      fail(`lesson ${id} is free but is meant to stay Premium; check it.`);
  }

  // The word lesson that comes with each free passage follows its passage.
  const companionGroups = FREE_PASSAGES.map((id) => passages.get(id)?.word_group_id).filter(
    (id): id is string => Boolean(id),
  );
  for (const id of companionGroups) {
    const row = groups.get(id);
    if (!row) fail(`the word lesson ${id} of a free passage does not exist.`);
  }

  type Change = { table: "lessons" | "word_groups" | "passages"; id: string; label: string };
  const changes: Change[] = [];
  for (const id of FREE_LESSONS) {
    if (!lessons.get(id)!.is_free) {
      changes.push({ table: "lessons", id, label: `lesson ${id} "${lessons.get(id)!.title}"` });
    }
  }
  for (const id of [...FREE_WORD_GROUPS, ...companionGroups]) {
    if (
      !groups.get(id)!.is_free &&
      !changes.some((c) => c.table === "word_groups" && c.id === id)
    ) {
      changes.push({
        table: "word_groups",
        id,
        label: `word list ${id} "${groups.get(id)!.title}"`,
      });
    }
  }
  for (const id of FREE_PASSAGES) {
    if (!passages.get(id)!.is_free) {
      changes.push({ table: "passages", id, label: `passage ${id} "${passages.get(id)!.title}"` });
    }
  }
  const orderMoves = LESSON_ORDER_MOVES.filter((move) => {
    const row = lessons.get(move.id);
    return row !== undefined && row.order_index === move.from;
  });
  const orderAlready = LESSON_ORDER_MOVES.filter(
    (move) => lessons.get(move.id)?.order_index === move.to,
  );

  console.log("Becoming free:");
  for (const change of changes) console.log(`  + ${change.label}`);
  if (changes.length === 0) console.log("  (nothing: already as wanted)");
  console.log("\nReordered (Advanced's unit into teaching order):");
  for (const move of orderMoves) console.log(`  ${move.id}: ${move.from} -> ${move.to}`);
  if (orderMoves.length === 0) {
    console.log(
      orderAlready.length === LESSON_ORDER_MOVES.length
        ? "  (nothing: already in order)"
        : "  (skipped: those lessons no longer have the order this expects; check them by hand)",
    );
  }

  if (!apply) {
    console.log("\nDry run only. Run again with --apply to write this.");
    return;
  }

  // Only a row that is still not free is touched, so a change made by hand since the read above is never undone.
  for (const change of changes) {
    const { error } = await supabase
      .from(change.table)
      .update({ is_free: true })
      .eq("id", change.id)
      .eq("is_free", false);
    if (error) fail(`${change.label}: ${error.message}`);
  }
  for (const move of orderMoves) {
    const { error } = await supabase
      .from("lessons")
      .update({ order_index: move.to })
      .eq("id", move.id)
      .eq("mode", "normal")
      .eq("order_index", move.from);
    if (error) fail(`${move.id} order: ${error.message}`);
  }

  // Read it all back and show what a learner now gets, per level.
  const [afterLessons, afterGroups, afterPassages, levels] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, level_id, order_index, is_free")
      .eq("mode", "normal")
      .eq("status", "published")
      .order("order_index"),
    supabase.from("word_groups").select("id, level, is_free").eq("status", "published"),
    supabase.from("passages").select("id, level, is_free").eq("status", "published"),
    supabase.from("levels").select("id, index").eq("mode", "normal"),
  ]);
  for (const res of [afterLessons, afterGroups, afterPassages, levels]) {
    if (res.error) fail(res.error.message);
  }
  const levelIndex = new Map((levels.data ?? []).map((row) => [row.id, row.index]));

  console.log("\nNow free, per level:");
  for (const level of [1, 2, 3]) {
    const freeLessons = (afterLessons.data ?? [])
      .filter((row) => levelIndex.get(row.level_id) === level && row.is_free)
      .map((row) => row.id);
    const freeGroups = (afterGroups.data ?? [])
      .filter((row) => row.level === level && row.is_free)
      .map((row) => row.id);
    console.log(`  Level ${level}: ${freeLessons.length} lessons: ${freeLessons.join(", ")}`);
    console.log(`           ${freeGroups.length} word lists: ${freeGroups.join(", ")}`);
  }
  for (const level of ["A1", "A2", "B1", "B2"]) {
    const free = (afterPassages.data ?? [])
      .filter((row) => row.level === level && row.is_free)
      .map((row) => row.id);
    console.log(`  Passages ${level}: ${free.length}: ${free.join(", ")}`);
  }
  console.log("\nDone.");
}

void main();
