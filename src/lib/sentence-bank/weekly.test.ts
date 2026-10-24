import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import type { SentenceCandidate } from "@/lib/sentence-bank/select";
import {
  WEEKLY_CHECK_MIN,
  WEEKLY_CHECK_SIZE,
  WEEKLY_CHECK_SPARES,
  WEEKLY_MAX_PER_LESSON,
  WEEKLY_STORIES_NEEDED,
  buildCheckItems,
  checkFigures,
  daysBetweenISO,
  selectWeeklyCheck,
  weeklyLine,
  weeklyStoryCounts,
} from "@/lib/sentence-bank/weekly";

const TODAY = "2025-06-10";

test("days between two calendar days, however many, either way, across months", () => {
  assert.equal(daysBetweenISO("2025-06-03", "2025-06-10"), 7);
  assert.equal(daysBetweenISO("2025-05-31", "2025-06-01"), 1);
  assert.equal(daysBetweenISO("2025-06-10", "2025-06-10"), 0);
  assert.equal(daysBetweenISO("2025-06-10", "2025-06-03"), -7);
  assert.equal(daysBetweenISO("2024-12-31", "2025-03-01"), 60);
});

test("the check asks eight sentences and opens with three finished general stories", () => {
  assert.equal(WEEKLY_CHECK_SIZE, 8);
  assert.equal(WEEKLY_STORIES_NEEDED, 3);
});

test("the check opens once three stories from earlier days are finished, and no earlier check", () => {
  const ready = { last: null, todayISO: TODAY, stories: 3, storiesTomorrow: 3 };
  assert.deepEqual(weeklyLine(ready), { kind: "due", size: 8, minutes: 4 });
  assert.equal(weeklyLine({ ...ready, stories: 9, storiesTomorrow: 9 })?.kind, "due");
});

test("until then the card is locked and says how many stories are still missing", () => {
  const line = weeklyLine({ last: null, todayISO: TODAY, stories: 1, storiesTomorrow: 1 });
  assert.deepEqual(line, { kind: "locked", have: 1, need: 3, tomorrow: false });
  assert.deepEqual(weeklyLine({ last: null, todayISO: TODAY, stories: 0, storiesTomorrow: 0 }), {
    kind: "locked",
    have: 0,
    need: 3,
    tomorrow: false,
  });
  assert.equal(
    (
      weeklyLine({ last: null, todayISO: TODAY, stories: 2, storiesTomorrow: 2 }) as {
        have: number;
      }
    ).have,
    2,
  );
});

test("a story finished today is asked tomorrow: the locked card says tomorrow will be enough", () => {
  const line = weeklyLine({ last: null, todayISO: TODAY, stories: 2, storiesTomorrow: 3 });
  assert.deepEqual(line, { kind: "locked", have: 2, need: 3, tomorrow: true });
});

test("for the week after a check its result is the line, with the honest figures and no more", () => {
  const last = { checkedOn: "2025-06-07", asked: 8, remembered: 6, written: 48 };
  const line = weeklyLine({ last, todayISO: TODAY, stories: 5, storiesTomorrow: 5 });
  assert.deepEqual(line, { kind: "result", written: 48, asked: 8, remembered: 6, percent: 75 });
  // Even with enough stories to be due, a check taken three days ago is not repeated.
  assert.equal(
    weeklyLine({ last, todayISO: TODAY, stories: 9, storiesTomorrow: 9 })?.kind,
    "result",
  );
  const five = { checkedOn: TODAY, asked: 5, remembered: 3, written: 20 };
  assert.equal(
    (
      weeklyLine({ last: five, todayISO: TODAY, stories: 0, storiesTomorrow: 0 }) as {
        percent: number;
      }
    ).percent,
    60,
  );
});

test("a check that asked fewer than five shows no number", () => {
  const small = { checkedOn: "2025-06-08", asked: WEEKLY_CHECK_MIN - 1, remembered: 4, written: 9 };
  assert.equal(weeklyLine({ last: small, todayISO: TODAY, stories: 0, storiesTomorrow: 0 }), null);
});

test("a week later a ready check takes the place of the old result, and a quiet week is locked again", () => {
  const last = { checkedOn: "2025-06-03", asked: 8, remembered: 5, written: 40 };
  assert.equal(weeklyLine({ last, todayISO: TODAY, stories: 3, storiesTomorrow: 3 })?.kind, "due");
  // A week has passed but there are not enough new stories: the old result is not shown as if it were new.
  assert.deepEqual(weeklyLine({ last, todayISO: TODAY, stories: 1, storiesTomorrow: 1 }), {
    kind: "locked",
    have: 1,
    need: 3,
    tomorrow: false,
  });
  // A date from the future (a clock that moved back) is no result and no card either.
  const future = { checkedOn: "2025-06-12", asked: 8, remembered: 5, written: 40 };
  assert.equal(weeklyLine({ last: future, todayISO: TODAY, stories: 0, storiesTomorrow: 0 }), null);
});

test("stories count when finished in the last seven days and before today; today's counts from tomorrow", () => {
  const finished = new Map([
    ["old", "2025-06-02"], // eight days ago: not this week
    ["edge", "2025-06-03"], // seven days ago: the week's first day
    ["recent", "2025-06-09"],
    ["today", TODAY],
  ]);
  // Now: edge and recent. Tomorrow: the oldest day has left the week, today's story has become a memory.
  assert.deepEqual(weeklyStoryCounts(finished, TODAY), { stories: 2, storiesTomorrow: 2 });
  assert.deepEqual(
    weeklyStoryCounts(
      new Map([
        ["a", "2025-06-09"],
        ["b", "2025-06-08"],
        ["today", TODAY],
      ]),
      TODAY,
    ),
    { stories: 2, storiesTomorrow: 3 },
  );
  assert.deepEqual(weeklyStoryCounts(new Map(), TODAY), { stories: 0, storiesTomorrow: 0 });
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

test("eight sentences and a few spares, spread over the week's stories, at most four from one", () => {
  assert.equal(WEEKLY_MAX_PER_LESSON, 4);
  const pool = [
    ...lesson("a", 8, "2025-06-09"),
    ...lesson("b", 8, "2025-06-08"),
    ...lesson("c", 8, "2025-06-06"),
  ];
  const { items } = selectWeeklyCheck(pool, TODAY);
  // The check is the first eight; the spares stand in for a sentence that cannot be asked.
  assert.equal(items.length, WEEKLY_CHECK_SIZE + WEEKLY_CHECK_SPARES);
  const firstEight = items.slice(0, WEEKLY_CHECK_SIZE);
  const perLesson = new Map<string, number>();
  for (const item of firstEight) {
    perLesson.set(item.lessonId, (perLesson.get(item.lessonId) ?? 0) + 1);
  }
  // Three stories share eight sentences as 3 + 3 + 2: every one is in the test.
  assert.deepEqual([...perLesson.values()].sort(), [2, 3, 3]);
  const all = new Map<string, number>();
  for (const item of items) all.set(item.lessonId, (all.get(item.lessonId) ?? 0) + 1);
  assert.ok([...all.values()].every((count) => count <= WEEKLY_MAX_PER_LESSON));
  // One from each story in turn, the newest story first.
  assert.deepEqual(
    items.slice(0, 3).map((item) => item.lessonId),
    ["a", "b", "c"],
  );
});

test("many stories give one sentence from each before a second from any", () => {
  const pool = ["a", "b", "c", "d", "e"].flatMap((id, index) =>
    lesson(id, 6, `2025-06-0${9 - index}`),
  );
  const { items } = selectWeeklyCheck(pool, TODAY);
  assert.deepEqual(
    items.slice(0, 5).map((item) => item.lessonId),
    ["a", "b", "c", "d", "e"],
  );
});

test("a story with few askable sentences is still in the check and the others fill the rest", () => {
  const pool = [
    ...lesson("a", 1, "2025-06-09"),
    ...lesson("b", 10, "2025-06-08"),
    ...lesson("c", 10, "2025-06-06"),
  ];
  const { items } = selectWeeklyCheck(pool, TODAY);
  // One + four + four: eight to ask and a spare, because no story gives more than four.
  assert.equal(items.length, 9);
  assert.equal(items.filter((item) => item.lessonId === "a").length, 1);
});

test("the lines asked of a story vary with the day and are not always its opening ones", () => {
  const pool = lesson("a", 30, "2025-06-01");
  const day = (iso: string) =>
    selectWeeklyCheck(pool, iso)
      .items.map((item) => item.id)
      .join();
  const days = ["2025-06-02", "2025-06-03", "2025-06-04", "2025-06-05"].map(day);
  assert.ok(new Set(days).size > 1);
  // Not just the first lines of the story, which a plain "first in order" pick would always be.
  const opening = pool.slice(0, WEEKLY_MAX_PER_LESSON).map((item) => item.id);
  assert.ok(days.some((ids) => ids !== opening.join()));
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

test("the check is asked exactly like the day's test: heard and typed whole, the meaning kept for after", () => {
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
    // Every question is heard: a sentence with no stored clip is not asked.
    new Map([
      [selected[0]!.id, "https://clips/a.mp3"],
      [selected[1]!.id, "https://clips/b.mp3"],
      [selected[2]!.id, "https://clips/c.mp3"],
    ]),
  );
  assert.deepEqual(
    items.map((item) => [item.id, item.form, item.audioUrl, item.masked, item.source]),
    [
      [selected[0]!.id, "audio", "https://clips/a.mp3", [], "sentence"],
      [selected[1]!.id, "audio", "https://clips/b.mp3", [], "sentence"],
      // No meaning of its own in the learner's language: still asked, just with nothing to show after.
      [selected[2]!.id, "audio", "https://clips/c.mp3", [], "sentence"],
    ],
  );
  assert.equal(items[0]!.prompt, "اشترت سيارة حمراء اليوم");
  assert.equal(items[2]!.prompt, null);
});
