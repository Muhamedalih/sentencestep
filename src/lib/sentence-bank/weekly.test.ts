import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import type { SentenceCandidate } from "@/lib/sentence-bank/select";
import {
  WEEKLY_CHECK_MIN,
  WEEKLY_CHECK_SIZE,
  WEEKLY_MAX_PER_LESSON,
  buildCheckItems,
  checkFigures,
  daysBetweenISO,
  selectWeeklyCheck,
  weeklyLine,
} from "@/lib/sentence-bank/weekly";

const TODAY = "2025-06-10";

test("days between two calendar days, however many, either way, across months", () => {
  assert.equal(daysBetweenISO("2025-06-03", "2025-06-10"), 7);
  assert.equal(daysBetweenISO("2025-05-31", "2025-06-01"), 1);
  assert.equal(daysBetweenISO("2025-06-10", "2025-06-10"), 0);
  assert.equal(daysBetweenISO("2025-06-10", "2025-06-03"), -7);
  assert.equal(daysBetweenISO("2024-12-31", "2025-03-01"), 60);
});

test("the check is offered after seven days of Today's session, a week of lessons and no earlier check", () => {
  const ready = { last: null, todayISO: TODAY, sessionDays: 7, lessonsThisWeek: 3 };
  assert.deepEqual(weeklyLine(ready), { kind: "due", size: 10, minutes: 4 });
  assert.equal(weeklyLine({ ...ready, sessionDays: 6 }), null);
  assert.equal(weeklyLine({ ...ready, lessonsThisWeek: 2 }), null);
  assert.equal(weeklyLine({ ...ready, sessionDays: 40, lessonsThisWeek: 12 })?.kind, "due");
});

test("for the week after a check its result is the line, with the honest figures and no more", () => {
  const last = { checkedOn: "2025-06-07", asked: 10, remembered: 7, written: 48 };
  const line = weeklyLine({ last, todayISO: TODAY, sessionDays: 3, lessonsThisWeek: 5 });
  assert.deepEqual(line, { kind: "result", written: 48, asked: 10, remembered: 7, percent: 70 });
  // Even with the days and lessons to be due, a check taken three days ago is not repeated.
  assert.equal(
    weeklyLine({ last, todayISO: TODAY, sessionDays: 9, lessonsThisWeek: 9 })?.kind,
    "result",
  );
  const five = { checkedOn: TODAY, asked: 5, remembered: 3, written: 20 };
  assert.equal(
    (
      weeklyLine({ last: five, todayISO: TODAY, sessionDays: 0, lessonsThisWeek: 0 }) as {
        percent: number;
      }
    ).percent,
    60,
  );
});

test("a check that asked fewer than five shows no number", () => {
  const small = { checkedOn: "2025-06-08", asked: WEEKLY_CHECK_MIN - 1, remembered: 4, written: 9 };
  assert.equal(
    weeklyLine({ last: small, todayISO: TODAY, sessionDays: 0, lessonsThisWeek: 0 }),
    null,
  );
});

test("a week later a due check takes the place of the old result, and a quiet week has no line", () => {
  const last = { checkedOn: "2025-06-03", asked: 10, remembered: 8, written: 40 };
  assert.equal(
    weeklyLine({ last, todayISO: TODAY, sessionDays: 7, lessonsThisWeek: 4 })?.kind,
    "due",
  );
  // A week has passed but the learner has not been back enough: the old result is not shown as if it were new.
  assert.equal(weeklyLine({ last, todayISO: TODAY, sessionDays: 2, lessonsThisWeek: 4 }), null);
  // A date from the future (a clock that moved back) is no result either.
  const future = { checkedOn: "2025-06-12", asked: 10, remembered: 8, written: 40 };
  assert.equal(
    weeklyLine({ last: future, todayISO: TODAY, sessionDays: 0, lessonsThisWeek: 0 }),
    null,
  );
});

let counter = 0;
function sentence(
  lessonId: string,
  completedOn: string,
  en = "She bought a red car today",
): SentenceCandidate {
  counter += 1;
  return { id: `${lessonId}-${counter}`, lessonId, orderIndex: counter, en, completedOn };
}

function lesson(lessonId: string, count: number, completedOn: string): SentenceCandidate[] {
  return Array.from({ length: count }, () => sentence(lessonId, completedOn));
}

test("the check asks sentences of the last seven days only, never ones typed today", () => {
  const pool = [
    ...lesson("old", 4, "2025-06-02"), // eight days ago: not this week
    ...lesson("edge", 1, "2025-06-03"), // seven days ago: the week's first day
    ...lesson("recent", 2, "2025-06-09"),
    ...lesson("today", 3, TODAY),
  ];
  const { items, written } = selectWeeklyCheck(pool, TODAY);
  assert.deepEqual(new Set(items.map((item) => item.lessonId)), new Set(["edge", "recent"]));
  assert.equal(items.length, 3);
  assert.equal(written, 3);
});

test("ten sentences, spread over the week's lessons, at most three from one", () => {
  assert.equal(WEEKLY_CHECK_SIZE, 10);
  assert.equal(WEEKLY_MAX_PER_LESSON, 3);
  const pool = [
    ...lesson("a", 8, "2025-06-09"),
    ...lesson("b", 8, "2025-06-08"),
    ...lesson("c", 8, "2025-06-06"),
    ...lesson("d", 8, "2025-06-05"),
  ];
  const { items } = selectWeeklyCheck(pool, TODAY);
  assert.equal(items.length, 10);
  const perLesson = new Map<string, number>();
  for (const item of items) perLesson.set(item.lessonId, (perLesson.get(item.lessonId) ?? 0) + 1);
  assert.ok([...perLesson.values()].every((count) => count <= 3));
  // One from each lesson in turn, the newest lesson first.
  assert.deepEqual(
    items.slice(0, 4).map((item) => item.lessonId),
    ["a", "b", "c", "d"],
  );
});

test("short sentences are never asked but are still part of what was written", () => {
  const pool = [
    sentence("a", "2025-06-09", "Hi, Tom!"),
    sentence("a", "2025-06-09", "I like tea"),
    sentence("a", "2025-06-09", "She bought a red car"),
  ];
  const { items, written } = selectWeeklyCheck(pool, TODAY);
  assert.equal(items.length, 1);
  assert.equal(written, 3);
});

test("the same sentences in any order give the same check, a sentence listed twice counts once", () => {
  const pool = [
    ...lesson("a", 5, "2025-06-09"),
    ...lesson("b", 5, "2025-06-07"),
    ...lesson("c", 5, "2025-06-05"),
  ];
  const ids = (list: SentenceCandidate[]) =>
    selectWeeklyCheck(list, TODAY).items.map((item) => item.id);
  assert.deepEqual(ids(pool), ids([...pool].reverse()));
  const doubled = selectWeeklyCheck([...pool, { ...pool[0]! }], TODAY);
  assert.equal(doubled.written, 15);
});

test("a week with too little to ask gives fewer than five, which the caller does not offer", () => {
  const { items } = selectWeeklyCheck(lesson("a", 2, "2025-06-09"), TODAY);
  assert.ok(items.length < WEEKLY_CHECK_MIN);
  assert.deepEqual(selectWeeklyCheck([], TODAY), { items: [], written: 0 });
});

test("the figures of a check are what was typed right with no help, out of what was asked", () => {
  assert.deepEqual(
    checkFigures([
      { outcome: "clean" },
      { outcome: "assisted" },
      { outcome: "missed" },
      { outcome: "clean" },
    ]),
    { asked: 4, remembered: 2 },
  );
  assert.deepEqual(checkFigures([]), { asked: 0, remembered: 0 });
});

const SQL = readFileSync(
  join(process.cwd(), "supabase/migrations/20250348000000_sentence_checks.sql"),
  "utf8",
);

test("sentence_checks keeps one row per learner and day, to its owner only", () => {
  assert.match(SQL, /create table if not exists sentence_checks/);
  assert.match(SQL, /primary key \(user_id, checked_on\)/);
  assert.match(SQL, /check \(remembered <= asked\)/);
  assert.match(SQL, /alter table sentence_checks enable row level security/);
  assert.match(SQL, /\(select auth\.uid\(\)\) = user_id/);
});

test("the checks migration only adds: nothing existing is altered, dropped or rewritten", () => {
  const code = SQL.replace(/--.*$/gm, "");
  assert.doesNotMatch(code, /\bdrop\s+(table|column|function|index|schema)\b/i);
  assert.doesNotMatch(code, /\b(truncate|delete\s+from|update\s+\w+\s+set)\b/i);
  for (const match of code.matchAll(/\balter\s+table\s+(\w+)/gi)) {
    assert.equal(match[1], "sentence_checks");
  }
  for (const match of code.matchAll(/\bdrop\s+policy\s+if\s+exists\s+"[^"]+"\s+on\s+(\w+)/gi)) {
    assert.equal(match[1], "sentence_checks");
  }
  for (const match of code.matchAll(/\binsert\s+into\s+(\w+)/gi)) {
    assert.equal(match[1], "sentence_checks");
  }
});

test("the check asks every sentence from its meaning, in order, and leaves out one that has none or has no clip", () => {
  const selected = [
    sentence("a", "2025-06-09", "She bought a red car today"),
    sentence("b", "2025-06-08", "He walks to the park daily"),
    sentence("c", "2025-06-07", "They played chess all evening"),
    sentence("d", "2025-06-06", "The doctor called last night"),
  ];
  const items = buildCheckItems(
    selected,
    new Map([
      [selected[0]!.id, "اشترت سيارة حمراء اليوم"],
      [selected[2]!.id, "They played chess all evening"], // the English again is no meaning
      [selected[1]!.id, "يمشي إلى الحديقة يومياً"],
      [selected[3]!.id, "اتصل الطبيب ليلة أمس"],
    ]),
    // The sound plays after the answer, in the lesson's voice: a sentence with no stored clip is not asked.
    new Map([
      [selected[0]!.id, "https://clips/a.mp3"],
      [selected[1]!.id, "https://clips/b.mp3"],
      [selected[2]!.id, "https://clips/c.mp3"],
    ]),
  );
  assert.deepEqual(
    items.map((item) => [item.id, item.form, item.audioUrl, item.masked]),
    [
      [selected[0]!.id, "translate", "https://clips/a.mp3", []],
      [selected[1]!.id, "translate", "https://clips/b.mp3", []],
    ],
  );
  assert.equal(items[0]!.prompt, "اشترت سيارة حمراء اليوم");
});
