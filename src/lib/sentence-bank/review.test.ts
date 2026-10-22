import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  AUDIO_FORM_FROM_STRENGTH,
  REVIEW_FORMS,
  TRANSLATE_FORM_FROM_STRENGTH,
  outcomeForSentence,
  reviewFormFor,
} from "@/lib/sentence-bank/review";
import { applyOutcome } from "@/lib/word-mastery/schedule";
import type { MasteryState } from "@/lib/word-mastery/schedule";

const TODAY = "2025-06-10";

test("right with no help is clean, right with one help is assisted", () => {
  assert.equal(outcomeForSentence({ exact: true, helps: 0 }), "clean");
  assert.equal(outcomeForSentence({ exact: true, helps: 1 }), "assisted");
});

test("a wrong answer, a second help or giving up is a miss", () => {
  assert.equal(outcomeForSentence({ exact: false, helps: 0 }), "missed");
  assert.equal(outcomeForSentence({ exact: false, helps: 1 }), "missed");
  assert.equal(outcomeForSentence({ exact: true, helps: 2 }), "missed");
  assert.equal(outcomeForSentence({ exact: true, helps: 5 }), "missed");
  // Looking at the answer and typing it out is not remembering it.
  assert.equal(outcomeForSentence({ exact: true, helps: 0, gaveUp: true }), "missed");
  assert.equal(outcomeForSentence({ exact: true, helps: 0, gaveUp: false }), "clean");
  // Nonsense help counts never help a sentence.
  assert.equal(outcomeForSentence({ exact: true, helps: -3 }), "clean");
});

test("a sentence climbs the word ladder: 1 / 3 / 7 / 16 / 30 days, and a miss starts it over", () => {
  let state: MasteryState | undefined;
  let today = TODAY;
  const gaps: number[] = [];
  for (let review = 0; review < 5; review++) {
    const result = applyOutcome(state, outcomeForSentence({ exact: true, helps: 0 }), today);
    gaps.push(Math.round((Date.parse(result.state.dueOn) - Date.parse(today)) / 86_400_000));
    state = result.state;
    today = state.dueOn;
  }
  assert.deepEqual(gaps, [1, 3, 7, 16, 30]);
  assert.equal(state!.strength, 5);

  const forgotten = applyOutcome(state, outcomeForSentence({ exact: false, helps: 0 }), today);
  // Reviews on day 0, 1, 4, 11 and 27 reached the 30-day step, due on day 57 (6 August).
  assert.equal(today, "2025-08-06");
  assert.deepEqual(forgotten.state, { strength: 0, dueOn: "2025-08-07" });
  // One help holds the sentence where it is.
  const held = applyOutcome(
    { strength: 2, dueOn: TODAY },
    outcomeForSentence({ exact: true, helps: 1 }),
    TODAY,
  );
  assert.deepEqual(held.state, { strength: 2, dueOn: "2025-06-13" });
  assert.equal(held.advanced, false);
});

test("weak sentences are asked with the most help, strong ones with the least, all with the text hidden", () => {
  assert.deepEqual([...REVIEW_FORMS], ["partial", "audio", "translate"]);
  assert.equal(AUDIO_FORM_FROM_STRENGTH, 2);
  assert.equal(TRANSLATE_FORM_FROM_STRENGTH, 4);
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5].map((strength) => reviewFormFor(strength, true)),
    ["partial", "partial", "audio", "audio", "translate", "translate"],
  );
  assert.equal(reviewFormFor(-1, true), "partial");
});

test("a sentence with no stored clip is asked from its meaning, whatever its strength", () => {
  for (const strength of [0, 1, 2, 3, 4, 5]) {
    assert.equal(reviewFormFor(strength, false), "translate");
  }
});

/**
 * The SQL function is the one that actually writes the schedule, and SQL cannot share a literal with
 * the TypeScript. These keep the two from drifting: the same interval array, strength ceiling, three
 * outcomes and "reviewed early changes nothing" guard as the word schedule's own function.
 */
const SQL = readFileSync(
  join(process.cwd(), "supabase/migrations/20250347000000_sentence_mastery.sql"),
  "utf8",
);
const WORD_SQL = readFileSync(
  join(process.cwd(), "supabase/migrations/20250323000000_word_mastery.sql"),
  "utf8",
);

test("record_sentence_review (SQL) uses the same schedule and rules as the word schedule", () => {
  for (const rule of [
    /v_days constant integer\[\] := array\[1, 3, 7, 16, 30\]/,
    /strength between 0 and 5/,
    /p_outcome not in \('clean', 'assisted', 'missed'\)/,
    /least\(v_prev_strength \+ 1, 5\)/,
    /v_prev_due <= p_today/,
    /v_due := p_today \+ 1;/,
    /v_days\[greatest\(v_strength, 1\)\]/,
    /v_days\[v_strength\]/,
  ]) {
    assert.match(SQL, rule);
    assert.match(WORD_SQL, rule);
  }
  for (const outcome of ["clean", "assisted", "missed"]) assert.ok(SQL.includes(`'${outcome}'`));
});

test("sentence_mastery keeps only the learner's own rows and is read by learner and day", () => {
  assert.match(SQL, /create table if not exists sentence_mastery/);
  assert.match(SQL, /primary key \(user_id, sentence_id\)/);
  assert.match(SQL, /alter table sentence_mastery enable row level security/);
  assert.match(SQL, /\(select auth\.uid\(\)\) = user_id/);
  assert.match(SQL, /on sentence_mastery \(user_id, due_on\)/);
  // The function trusts only auth.uid() and runs with the caller's rights.
  assert.match(SQL, /security invoker/);
  assert.match(SQL, /v_user uuid := auth\.uid\(\)/);
  assert.doesNotMatch(SQL, /security definer/);
});

test("the migration only adds: nothing existing is altered, dropped, emptied or rewritten", () => {
  // Strip comments, then look at every statement.
  const code = SQL.replace(/--.*$/gm, "");
  assert.doesNotMatch(code, /\bdrop\s+(table|column|function|index|schema)\b/i);
  assert.doesNotMatch(code, /\btruncate\b/i);
  assert.doesNotMatch(code, /\bdelete\s+from\b/i);
  assert.doesNotMatch(code, /\bupdate\s+(?!sentence_mastery)\w+\s+set\b/i);
  for (const match of code.matchAll(/\balter\s+table\s+(\w+)/gi)) {
    assert.equal(match[1], "sentence_mastery");
  }
  for (const match of code.matchAll(/\bdrop\s+policy\s+if\s+exists\s+"[^"]+"\s+on\s+(\w+)/gi)) {
    assert.equal(match[1], "sentence_mastery");
  }
  for (const match of code.matchAll(/\binsert\s+into\s+(\w+)/gi)) {
    assert.equal(match[1], "sentence_mastery");
  }
});
