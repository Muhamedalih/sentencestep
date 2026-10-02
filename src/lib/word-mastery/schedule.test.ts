import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  HINTS_BEFORE_MISS,
  MAX_STRENGTH,
  REVIEW_INTERVAL_DAYS,
  SESSION_MAX_WORDS,
  addDaysISO,
  applyOutcome,
  classifyWord,
  countsAsMissed,
  dueWordIds,
  intervalDays,
  isDue,
  isISODate,
  isWordOutcome,
  outcomeFor,
  practiceScope,
  practiceVisitKey,
  selectContinueWords,
  summarizeGroupMastery,
  withHint,
  wordStars,
} from "@/lib/word-mastery/schedule";
import type { MasteryState, WordOutcome } from "@/lib/word-mastery/schedule";

const TODAY = "2025-06-10";

function states(entries: Record<string, MasteryState>): Map<string, MasteryState> {
  return new Map(Object.entries(entries));
}

test("the review schedule is 1 / 3 / 7 / 16 / 30 days across strengths 1 to 5", () => {
  assert.deepEqual([...REVIEW_INTERVAL_DAYS], [1, 3, 7, 16, 30]);
  assert.equal(MAX_STRENGTH, 5);
  assert.deepEqual([1, 2, 3, 4, 5].map(intervalDays), [1, 3, 7, 16, 30]);
  // A new or just-missed word (strength 0) comes back tomorrow.
  assert.equal(intervalDays(0), 1);
  // Out-of-range input is clamped, never a crash or an undefined interval.
  assert.equal(intervalDays(-3), 1);
  assert.equal(intervalDays(99), 30);
});

test("dates: validation and calendar arithmetic ignore time zones and daylight saving", () => {
  assert.equal(isISODate("2025-06-10"), true);
  assert.equal(isISODate("2025-02-30"), false);
  assert.equal(isISODate("2025-6-1"), false);
  assert.equal(isISODate(20250610), false);
  assert.equal(addDaysISO("2025-06-10", 1), "2025-06-11");
  assert.equal(addDaysISO("2025-06-30", 1), "2025-07-01");
  assert.equal(addDaysISO("2025-12-31", 1), "2026-01-01");
  assert.equal(addDaysISO("2024-02-28", 1), "2024-02-29");
  assert.equal(addDaysISO("2025-03-09", 30), "2025-04-08");
  assert.equal(addDaysISO("2025-06-10", 0), "2025-06-10");
  assert.throws(() => addDaysISO("tomorrow", 1));
});

test("a new word is due, and so is one whose date has come", () => {
  assert.equal(isDue(undefined, TODAY), true);
  assert.equal(isDue(null, TODAY), true);
  assert.equal(isDue({ strength: 2, dueOn: TODAY }, TODAY), true);
  assert.equal(isDue({ strength: 2, dueOn: "2025-06-09" }, TODAY), true);
  assert.equal(isDue({ strength: 2, dueOn: "2025-06-11" }, TODAY), false);
});

test("a clean first answer on a new word reaches strength 1 and is due tomorrow", () => {
  const result = applyOutcome(undefined, "clean", TODAY);
  assert.deepEqual(result.state, { strength: 1, dueOn: "2025-06-11" });
  assert.equal(result.advanced, true);
  assert.equal(result.scheduled, true);
});

test("clean answers climb the whole ladder when each review happens on its due date", () => {
  let state: MasteryState | undefined;
  let today = TODAY;
  const seen: { strength: number; gap: number }[] = [];
  for (let step = 0; step < 7; step++) {
    const result = applyOutcome(state, "clean", today);
    seen.push({
      strength: result.state.strength,
      gap: Math.round((Date.parse(result.state.dueOn) - Date.parse(today)) / (24 * 60 * 60 * 1000)),
    });
    state = result.state;
    today = state.dueOn;
  }
  assert.deepEqual(seen, [
    { strength: 1, gap: 1 },
    { strength: 2, gap: 3 },
    { strength: 3, gap: 7 },
    { strength: 4, gap: 16 },
    { strength: 5, gap: 30 },
    // Mastered words stay at 5 and are checked again every 30 days.
    { strength: 5, gap: 30 },
    { strength: 5, gap: 30 },
  ]);
});

test("a miss always sends the word back to 0 and due tomorrow, whatever its strength", () => {
  for (const strength of [0, 1, 3, 5]) {
    const result = applyOutcome({ strength, dueOn: "2025-07-01" }, "missed", TODAY);
    assert.deepEqual(result.state, { strength: 0, dueOn: "2025-06-11" });
    assert.equal(result.advanced, false);
    assert.equal(result.scheduled, true);
  }
  // Even a word that was not due yet: bad news is always recorded.
  const early = applyOutcome({ strength: 4, dueOn: "2025-06-20" }, "missed", TODAY);
  assert.deepEqual(early.state, { strength: 0, dueOn: "2025-06-11" });
});

test("an assisted answer (hint, no miss) holds the strength and comes back after the same interval", () => {
  const held = applyOutcome({ strength: 3, dueOn: TODAY }, "assisted", TODAY);
  assert.deepEqual(held.state, { strength: 3, dueOn: "2025-06-17" });
  assert.equal(held.advanced, false);
  assert.equal(held.scheduled, true);

  // On a brand-new word it stays at 0 and returns tomorrow.
  const fresh = applyOutcome(undefined, "assisted", TODAY);
  assert.deepEqual(fresh.state, { strength: 0, dueOn: "2025-06-11" });
  assert.equal(fresh.advanced, false);
});

test("practicing a word before it is due leaves its schedule exactly as it was", () => {
  const before: MasteryState = { strength: 2, dueOn: "2025-06-13" };
  for (const outcome of ["clean", "assisted"] as const) {
    const result = applyOutcome(before, outcome, TODAY);
    assert.deepEqual(result.state, before);
    assert.equal(result.advanced, false);
    assert.equal(result.scheduled, false);
  }
  // The input is never mutated.
  assert.deepEqual(before, { strength: 2, dueOn: "2025-06-13" });
});

test("repeating a group over and over in one day cannot walk a word up the ladder", () => {
  let state = applyOutcome(undefined, "clean", TODAY).state;
  for (let round = 0; round < 6; round++) state = applyOutcome(state, "clean", TODAY).state;
  assert.deepEqual(state, { strength: 1, dueOn: "2025-06-11" });
});

test("outcomes and stars follow the same three steps: clean, one hint, miss", () => {
  assert.equal(outcomeFor({ missed: false, hints: 0 }), "clean");
  assert.equal(outcomeFor({ missed: false, hints: 1 }), "assisted");
  assert.equal(outcomeFor({ missed: true, hints: 0 }), "missed");
  assert.equal(outcomeFor({ missed: true, hints: 1 }), "missed");

  assert.equal(wordStars({ missed: false, hints: 0 }), 3);
  assert.equal(wordStars({ missed: false, hints: 1 }), 2);
  assert.equal(wordStars({ missed: true, hints: 0 }), 1);
  assert.equal(wordStars({ missed: true, hints: 1 }), 1);
});

test("the second hint counts as a miss: one star, back to the start", () => {
  assert.equal(HINTS_BEFORE_MISS, 2);
  for (const hints of [2, 3, 7]) {
    const attempt = { missed: false, hints };
    assert.equal(countsAsMissed(attempt), true);
    assert.equal(outcomeFor(attempt), "missed");
    assert.equal(wordStars(attempt), 1);
  }
  assert.equal(countsAsMissed({ missed: false, hints: 1 }), false);
});

test("withHint: each hint costs a star down to one, and exactly one hint tips the word into a miss", () => {
  let attempt = { missed: false, hints: 0 };
  const stars: number[] = [wordStars(attempt)];
  const lapses: boolean[] = [];
  for (let index = 0; index < 4; index++) {
    const step = withHint(attempt);
    attempt = step.attempt;
    lapses.push(step.lapsed);
    stars.push(wordStars(attempt));
  }
  // 3 stars, then 2 after the first hint, then 1 from the second on (never lower).
  assert.deepEqual(stars, [3, 2, 1, 1, 1]);
  // Only the second hint is "the one that makes it a miss" (reported once, to the schedule).
  assert.deepEqual(lapses, [false, true, false, false]);
  assert.equal(attempt.missed, true);
  assert.equal(attempt.hints, 4);
});

test("withHint: a word that was already missed is not reported as missed again by its hints", () => {
  const first = withHint({ missed: true, hints: 0 });
  assert.equal(first.lapsed, false);
  assert.deepEqual(first.attempt, { missed: true, hints: 1 });
  assert.equal(withHint(first.attempt).lapsed, false);
});

test("withHint never mutates what it is given", () => {
  const before = { missed: false, hints: 1 };
  withHint(before);
  assert.deepEqual(before, { missed: false, hints: 1 });
});

test("isWordOutcome only accepts the three outcomes", () => {
  for (const outcome of ["clean", "assisted", "missed"]) assert.equal(isWordOutcome(outcome), true);
  for (const bad of ["recovered", "", "CLEAN", null, undefined, 1]) {
    assert.equal(isWordOutcome(bad), false);
  }
});

test("classifyWord: new, due, scheduled", () => {
  assert.equal(classifyWord(undefined, TODAY), "new");
  assert.equal(classifyWord({ strength: 1, dueOn: TODAY }, TODAY), "due");
  assert.equal(classifyWord({ strength: 1, dueOn: "2025-06-09" }, TODAY), "due");
  assert.equal(classifyWord({ strength: 1, dueOn: "2025-06-11" }, TODAY), "scheduled");
});

const group = ["a", "b", "c", "d", "e", "f", "g", "h"].map((id, index) => ({ id, order: index }));

test("Continue starts at the first words that are not locked in, not at word 1", () => {
  // a, b and c were learned yesterday and are scheduled for later; d onward is untouched.
  const pick = selectContinueWords(
    group,
    states({
      a: { strength: 2, dueOn: "2025-06-13" },
      b: { strength: 1, dueOn: "2025-06-11" },
      c: { strength: 3, dueOn: "2025-06-17" },
    }),
    TODAY,
  );
  assert.deepEqual(
    pick.words.map((word) => word.id),
    ["d", "e", "f", "g", "h"],
  );
  assert.equal(pick.newCount, 5);
  assert.equal(pick.dueCount, 0);
  assert.equal(pick.scheduledCount, 3);
});

test("Continue asks due words first (weakest first), then new words in the group's own order", () => {
  const pick = selectContinueWords(
    group,
    states({
      a: { strength: 3, dueOn: "2025-06-09" },
      b: { strength: 0, dueOn: "2025-06-10" },
      c: { strength: 1, dueOn: "2025-06-08" },
      d: { strength: 1, dueOn: "2025-06-09" },
      e: { strength: 4, dueOn: "2025-06-30" },
    }),
    TODAY,
  );
  // strength 0 (b), then strength 1 longest overdue first (c before d), then strength 3 (a); then new f, g, h.
  assert.deepEqual(
    pick.words.map((word) => word.id),
    ["b", "c", "d", "a", "f", "g", "h"],
  );
  assert.equal(pick.dueCount, 4);
  assert.equal(pick.newCount, 3);
  assert.equal(pick.scheduledCount, 1);
});

test("Continue is capped so one visit stays short, keeping the due words ahead of the new ones", () => {
  const many = Array.from({ length: 40 }, (_, index) => ({ id: `w${index}`, order: index }));
  const dueMap = new Map<string, MasteryState>([
    ["w30", { strength: 2, dueOn: "2025-06-01" }],
    ["w31", { strength: 2, dueOn: "2025-06-02" }],
  ]);
  const pick = selectContinueWords(many, dueMap, TODAY);
  assert.equal(pick.words.length, SESSION_MAX_WORDS);
  assert.deepEqual(
    pick.words.slice(0, 3).map((word) => word.id),
    ["w30", "w31", "w0"],
  );
  assert.equal(pick.dueCount, 2);
  assert.equal(pick.newCount, SESSION_MAX_WORDS - 2);
  assert.equal(selectContinueWords(many, dueMap, TODAY, 5).words.length, 5);
  assert.equal(selectContinueWords(many, dueMap, TODAY, 0).words.length, 0);
});

test("Continue has nothing to ask when every word is scheduled for a later day", () => {
  const pick = selectContinueWords(
    group.slice(0, 2),
    states({
      a: { strength: 2, dueOn: "2025-06-13" },
      b: { strength: 2, dueOn: "2025-06-14" },
    }),
    TODAY,
  );
  assert.deepEqual(pick.words, []);
  assert.equal(pick.scheduledCount, 2);
});

test("a Continue list shrinks with every answer, so a running visit cannot follow it", () => {
  // The practice page is rendered again after every answer and works Continue out
  // afresh. Answering a word schedules it for a later day, which takes it out of
  // the list: positions in the new list are not positions in the one the visit
  // opened with. A screen that read them off the new list asked "c" where it
  // should have asked "b", and never asked the words it jumped over — which is
  // why the practice keeps the list it opened with (see practiceVisitKey).
  const opened = selectContinueWords(group, new Map(), TODAY).words.map((word) => word.id);
  assert.deepEqual(opened, ["a", "b", "c", "d", "e", "f", "g", "h"]);

  const schedule = new Map<string, MasteryState>();
  const asked: string[] = [];
  for (const [position, id] of opened.entries()) {
    const fresh = selectContinueWords(group, schedule, TODAY).words.map((word) => word.id);
    // One word fewer than the visit started with for every answer given so far.
    assert.equal(fresh.length, opened.length - position);
    if (position > 0) assert.notEqual(fresh[position], opened[position]);
    asked.push(id);
    schedule.set(id, applyOutcome(schedule.get(id), "clean", TODAY).state);
  }
  assert.deepEqual(asked, opened);
  // Everything answered: the page's next render finds nothing left to ask.
  assert.deepEqual(selectContinueWords(group, schedule, TODAY).words, []);
});

test("a practice visit is Continue unless the URL asks for scope=all, and its key tells visits apart", () => {
  assert.equal(practiceScope("all"), "all");
  for (const raw of [undefined, null, "", "continue", "ALL", "everything"]) {
    assert.equal(practiceScope(raw), "continue");
  }

  // The same visit keeps its key across the page being rendered again…
  assert.equal(practiceVisitKey("family", "continue"), practiceVisitKey("family", "continue"));
  // …and another scope or another group is a different visit that starts fresh.
  assert.notEqual(practiceVisitKey("family", "continue"), practiceVisitKey("family", "all"));
  assert.notEqual(practiceVisitKey("family", "continue"), practiceVisitKey("travel", "continue"));
  assert.notEqual(practiceVisitKey("family", "all"), practiceVisitKey("travel", "all"));
});

test("summarizeGroupMastery counts new, due and strong words and a percent that moves with every step", () => {
  const ids = ["a", "b", "c", "d"];
  assert.deepEqual(summarizeGroupMastery(ids, new Map(), TODAY), {
    total: 4,
    newCount: 4,
    dueCount: 0,
    strongCount: 0,
    percent: 0,
  });

  const summary = summarizeGroupMastery(
    ids,
    states({
      a: { strength: 5, dueOn: "2025-07-10" },
      b: { strength: 4, dueOn: "2025-06-10" },
      c: { strength: 1, dueOn: "2025-06-11" },
    }),
    TODAY,
  );
  assert.equal(summary.newCount, 1);
  assert.equal(summary.dueCount, 1);
  assert.equal(summary.strongCount, 2);
  // (5 + 4 + 1 + 0) of a possible 20.
  assert.equal(summary.percent, 50);

  assert.equal(summarizeGroupMastery([], new Map(), TODAY).percent, 0);
  const full = summarizeGroupMastery(
    ids,
    new Map(ids.map((id) => [id, { strength: 5, dueOn: "2025-07-10" }])),
    TODAY,
  );
  assert.equal(full.percent, 100);
});

test("dueWordIds lists what is due today, weakest then longest overdue first", () => {
  assert.deepEqual(
    dueWordIds(
      states({
        a: { strength: 3, dueOn: "2025-06-09" },
        b: { strength: 0, dueOn: "2025-06-10" },
        c: { strength: 1, dueOn: "2025-06-08" },
        d: { strength: 1, dueOn: "2025-06-09" },
        e: { strength: 5, dueOn: "2025-07-10" },
      }),
      TODAY,
    ),
    ["b", "c", "d", "a"],
  );
  assert.deepEqual(dueWordIds(new Map(), TODAY), []);
});

/**
 * The SQL function is the one that actually writes the schedule, and SQL cannot
 * share a literal with this file. These keep the two from drifting: the same
 * interval array, the same strength ceiling, the same three outcomes, and the
 * same "early review changes nothing" guard must appear in the migration.
 */
test("record_word_review (SQL) uses the same schedule and rules as this module", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20250323000000_word_mastery.sql"),
    "utf8",
  );
  assert.match(sql, /v_days constant integer\[\] := array\[1, 3, 7, 16, 30\]/);
  assert.match(sql, /strength between 0 and 5/);
  assert.match(sql, /p_outcome not in \('clean', 'assisted', 'missed'\)/);
  assert.match(sql, /least\(v_prev_strength \+ 1, 5\)/);
  assert.match(sql, /v_prev_due <= p_today/);
  const outcomes: WordOutcome[] = ["clean", "assisted", "missed"];
  for (const outcome of outcomes) assert.ok(sql.includes(`'${outcome}'`));
});
