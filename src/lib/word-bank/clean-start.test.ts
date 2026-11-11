import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { BANK_CLEAN_START_STRENGTH } from "@/lib/word-bank/shelves";
import { MAX_STRENGTH, REVIEW_INTERVAL_DAYS, STRONG_STRENGTH } from "@/lib/word-mastery/schedule";

const dir = join(process.cwd(), "supabase/migrations");
const first = readFileSync(join(dir, "20250350000000_learner_words.sql"), "utf8");
const second = readFileSync(join(dir, "20250357000000_learner_words_clean_start.sql"), "utf8");

/** The function's text in a migration, from its `create or replace` to the closing `$$;`. */
function functionOf(sql: string): string {
  const start = sql.indexOf("create or replace function public.record_learner_word_review");
  const end = sql.indexOf("$$;", start);
  assert.ok(start >= 0 && end > start, "the function is in the file");
  return sql.slice(start, end);
}

const CLEAN_BEFORE = "v_strength := least(v_prev_strength + 1, 5);";
const CLEAN_AFTER = `v_strength := least(v_prev_strength + (case when v_found then 1 else ${BANK_CLEAN_START_STRENGTH} end), ${MAX_STRENGTH});`;

test("the second migration replaces the function and changes one statement only: the clean step", () => {
  const before = functionOf(first);
  const after = functionOf(second);
  assert.ok(before.includes(CLEAN_BEFORE));
  assert.ok(after.includes(CLEAN_AFTER));
  const strip = (text: string) =>
    text
      .replace(/\r/g, "")
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
  assert.equal(strip(after), strip(before.replace(CLEAN_BEFORE, CLEAN_AFTER)));
});

test("a word typed right the first time starts two steps up: two reviews to stable instead of three", () => {
  assert.equal(BANK_CLEAN_START_STRENGTH, 2);
  assert.equal(STRONG_STRENGTH - BANK_CLEAN_START_STRENGTH, 2);
  // Its first review comes after the interval of the strength it starts at (3 days).
  assert.equal(REVIEW_INTERVAL_DAYS[BANK_CLEAN_START_STRENGTH - 1], 3);
});

test("the file only replaces the function: no table, column, policy or row is touched", () => {
  assert.doesNotMatch(
    second,
    /\b(create table|alter table|drop |create policy|insert into (?!learner_words as lw)|update learner_words|delete from)\b/i,
  );
  assert.match(second, /^begin;/m);
  assert.match(second, /^commit;/m);
  assert.match(second, /security invoker/);
});
