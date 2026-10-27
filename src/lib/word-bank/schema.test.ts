import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { BANK_LIMITS, BANK_SOURCES } from "@/lib/word-bank/types";
import { MAX_STRENGTH, REVIEW_INTERVAL_DAYS, WORD_OUTCOMES } from "@/lib/word-mastery/schedule";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/20250350000000_learner_words.sql"),
  "utf8",
);

/**
 * The SQL function is the one that actually writes the schedule, and SQL cannot share a literal with
 * the TypeScript. These keep the two from drifting: the same interval array, the same strength
 * ceiling, the same three outcomes and the same "answered early changes nothing" guard as
 * record_word_review, and the same sources and limits as the TypeScript that validates an answer.
 */
test("record_learner_word_review (SQL) uses the same schedule and rules as the word schedule", () => {
  const days = /v_days constant integer\[\] := array\[([\d, ]+)\]/.exec(sql);
  assert.ok(days, "the interval array is declared");
  assert.deepEqual(
    days[1]!.split(",").map((part) => Number(part.trim())),
    [...REVIEW_INTERVAL_DAYS],
  );
  assert.match(sql, new RegExp(`strength between 0 and ${MAX_STRENGTH}`));
  assert.match(sql, new RegExp(`least\\(v_prev_strength \\+ 1, ${MAX_STRENGTH}\\)`));
  assert.match(sql, /p_outcome not in \('clean', 'assisted', 'missed'\)/);
  assert.match(sql, /v_prev_due <= p_today/);
  for (const outcome of WORD_OUTCOMES) assert.ok(sql.includes(`'${outcome}'`));
});

test("a missed word goes back to strength 0 and is due tomorrow; a clean one climbs only when due", () => {
  assert.match(sql, /if p_outcome = 'missed' then\s+v_strength := 0;\s+v_due := p_today \+ 1;/);
  assert.match(sql, /elsif v_found and not \(v_prev_due <= p_today\) then/);
  assert.match(sql, /elsif p_outcome = 'clean' then\s+v_strength := least/);
  assert.match(sql, /v_days\[greatest\(v_strength, 1\)\]/);
});

test("the table and the function accept exactly the sources the TypeScript knows", () => {
  const list = BANK_SOURCES.map((source) => `'${source}'`).join(", ");
  assert.equal(
    sql.split(`in (${list})`).length - 1,
    2,
    "once in the table check and once in the function",
  );
});

test("the table's limits are the ones the TypeScript cuts every text to", () => {
  assert.match(sql, new RegExp(`char_length\\(word\\) between 1 and ${BANK_LIMITS.word}`));
  assert.match(sql, new RegExp(`char_length\\(lesson_id\\) <= ${BANK_LIMITS.lessonId}`));
  assert.match(sql, new RegExp(`char_length\\(lesson_title\\) <= ${BANK_LIMITS.lessonTitle}`));
  assert.match(sql, new RegExp(`char_length\\(ar\\) <= ${BANK_LIMITS.ar}`));
  assert.match(sql, new RegExp(`char_length\\(home_sentence\\) <= ${BANK_LIMITS.homeSentence}`));
  assert.match(sql, new RegExp(`left\\(p_lesson_id, ${BANK_LIMITS.lessonId}\\)`));
  assert.match(sql, new RegExp(`left\\(p_lesson_title, ${BANK_LIMITS.lessonTitle}\\)`));
  assert.match(sql, new RegExp(`left\\(coalesce\\(p_ar, ''\\), ${BANK_LIMITS.ar}\\)`));
  assert.match(sql, new RegExp(`left\\(p_home_sentence, ${BANK_LIMITS.homeSentence}\\)`));
});

test("a learner can only ever touch their own rows, and the function runs as the learner", () => {
  assert.match(sql, /alter table learner_words enable row level security/);
  assert.match(sql, /create policy "Users manage their own learner words" on learner_words/);
  assert.match(sql, /using \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(sql, /with check \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(sql, /security invoker/);
  assert.match(sql, /v_user uuid := auth\.uid\(\)/);
  assert.match(sql, /needs a signed-in learner/);
});

test("the due read has its index, and pasting the file twice is harmless", () => {
  assert.match(
    sql,
    /create index if not exists learner_words_due_idx on learner_words \(user_id, due_on\)/,
  );
  assert.match(sql, /create table if not exists learner_words/);
  assert.match(sql, /drop policy if exists "Users manage their own learner words"/);
  assert.match(sql, /create or replace function public\.record_learner_word_review/);
  assert.match(sql, /primary key \(user_id, word\)/);
});

test("a later answer never overwrites where the word was first met", () => {
  assert.match(sql, /ar = case when lw\.ar = '' then excluded\.ar else lw\.ar end/);
  assert.match(sql, /lesson_id = coalesce\(lw\.lesson_id, excluded\.lesson_id\)/);
  assert.match(sql, /lesson_title = coalesce\(lw\.lesson_title, excluded\.lesson_title\)/);
  assert.match(sql, /home_sentence = coalesce\(lw\.home_sentence, excluded\.home_sentence\)/);
  assert.doesNotMatch(sql, /first_seen_on = excluded\.first_seen_on/);
  assert.doesNotMatch(sql, /\bsource = excluded\.source/);
});
