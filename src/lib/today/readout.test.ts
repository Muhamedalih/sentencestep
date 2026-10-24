import assert from "node:assert/strict";
import test from "node:test";

import {
  TODAY_SLOTS,
  countByDay,
  splitSignups,
  threeTaskStats,
  threeTaskStatsByDay,
} from "@/lib/today/readout";
import type { QuestRow } from "@/lib/today/readout";

const DONE = "2026-10-20T10:00:00Z";

function row(user: string, date: string, slot: number, done: boolean): QuestRow {
  return {
    user_id: user,
    quest_date: date,
    slot,
    quest_type: "x",
    completed_at: done ? DONE : null,
  };
}

test("Today's three tasks sit in slots 10, 11 and 12", () => {
  assert.deepEqual(TODAY_SLOTS, [10, 11, 12]);
});

test("a learner-day counts as all done only when all three tasks were dealt and finished", () => {
  const stats = threeTaskStats([
    row("a", "2026-10-20", 10, true),
    row("a", "2026-10-20", 11, true),
    row("a", "2026-10-20", 12, true),
    row("b", "2026-10-20", 10, true),
    row("b", "2026-10-20", 11, true),
    row("b", "2026-10-20", 12, false),
    row("c", "2026-10-20", 10, true), // only one dealt: not a full day
    row("a", "2026-10-20", 13, true), // the sentence bank's slot is not one of the three
    row("a", "2026-10-20", 3, true), // a random quest of the old kind
  ]);
  assert.equal(stats.userDays, 2);
  assert.equal(stats.allDone, 1);
  assert.equal(stats.learners, 2);
  assert.deepEqual(stats.bySlot[10], { dealt: 3, completed: 3 });
  assert.deepEqual(stats.bySlot[12], { dealt: 2, completed: 1 });
});

test("the same figures per quest date", () => {
  const byDay = threeTaskStatsByDay([
    row("a", "2026-10-20", 10, true),
    row("a", "2026-10-20", 11, true),
    row("a", "2026-10-20", 12, true),
    row("a", "2026-10-21", 10, false),
    row("a", "2026-10-21", 11, false),
    row("a", "2026-10-21", 12, false),
  ]);
  assert.equal(byDay.get("2026-10-20")?.allDone, 1);
  assert.equal(byDay.get("2026-10-21")?.allDone, 0);
  assert.equal(byDay.get("2026-10-21")?.userDays, 1);
});

test("sign-ups are split into whole days before and after the day of the change", () => {
  const signups = [
    { id: "old", day: "2026-09-01" },
    { id: "b1", day: "2026-10-10" },
    { id: "b2", day: "2026-10-19" },
    { id: "live", day: "2026-10-20" },
    { id: "a1", day: "2026-10-21" },
  ];
  const split = splitSignups(signups, Date.parse("2026-10-20T14:30:00Z"), 14);
  assert.equal(split.liveDay, "2026-10-20");
  assert.deepEqual(
    split.before.map((s) => s.id),
    ["b1", "b2"],
  );
  assert.deepEqual(
    split.after.map((s) => s.id),
    ["a1"],
  );
});

test("dates are counted per day", () => {
  const counts = countByDay(["2026-10-01", "2026-10-01", "2026-10-02"]);
  assert.equal(counts.get("2026-10-01"), 2);
  assert.equal(counts.get("2026-10-02"), 1);
  assert.equal(counts.get("2026-10-03"), undefined);
});
