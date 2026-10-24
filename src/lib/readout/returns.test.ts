import assert from "node:assert/strict";
import test from "node:test";

import {
  activeDaysByUser,
  addDays,
  pct,
  ratio,
  tallyReturns,
  tallyShares,
  utcDay,
} from "@/lib/readout/returns";

test("UTC days: formatting and adding across a month and a year", () => {
  assert.equal(utcDay("2026-10-13T23:59:59Z"), "2026-10-13");
  assert.equal(utcDay(Date.parse("2026-10-14T00:00:00Z")), "2026-10-14");
  assert.equal(addDays("2026-10-31", 1), "2026-11-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-10-14", -14), "2026-09-30");
});

test("shares: a dash when nothing could be judged", () => {
  assert.equal(pct(1, 4), "25.0%");
  assert.equal(pct(0, 0), "-");
  assert.equal(ratio(3, 2), "1.50");
  assert.equal(ratio(3, 0), "-");
});

test("next day, days 1-7 and the 14-day activity are counted only once their days have passed", () => {
  const days = (...list: string[]) => new Set(list);
  const active = new Map([
    ["a", days("2026-10-01", "2026-10-02")], // back the very next day
    ["b", days("2026-10-01", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08")], // back on day 4, active 5 days
    ["c", days("2026-10-01")], // never came back
    ["d", days("2026-10-10")], // signed up 2026-10-10; nothing on 10-11
  ]);
  const signups = [
    { id: "a", day: "2026-10-01" },
    { id: "b", day: "2026-10-01" },
    { id: "c", day: "2026-10-01" },
    { id: "d", day: "2026-10-10" },
    { id: "e", day: "2026-10-11" }, // not in `active` at all, next day is "today": not judged
  ];
  const tally = tallyReturns(signups, (id) => active.get(id), "2026-10-12");
  assert.equal(tally.signups, 5);
  // Next day: a, b, c (10-02 is over), d (10-11 is over); e's next day is today (still running).
  assert.equal(tally.nextDayKnown, 4);
  assert.equal(tally.nextDay, 1);
  // Days 1-7: only the three who signed up on 10-01 (their day 7 is 10-08, over).
  assert.equal(tally.weekKnown, 3);
  assert.equal(tally.week, 2);
  // 14 days: nobody yet (the earliest ends on 10-14).
  assert.equal(tally.fortnightKnown, 0);
  assert.equal(tally.active2, 0);
});

test("active 2+ and 5+ of the 14 days that start on the sign-up day", () => {
  const active = new Map([
    ["x", new Set(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-14"])],
    ["y", new Set(["2026-10-01", "2026-10-15"])], // 10-15 is day 14: outside the window
  ]);
  const tally = tallyReturns(
    [
      { id: "x", day: "2026-10-01" },
      { id: "y", day: "2026-10-01" },
    ],
    (id) => active.get(id),
    "2026-10-20",
  );
  assert.equal(tally.fortnightKnown, 2);
  assert.equal(tally.active2, 1);
  assert.equal(tally.active5, 1);
  assert.equal(tallyShares(tally)["active 5+ of 14 days"], "50.0% (of 2)");
});

test("activity rows are indexed into a set of days per learner", () => {
  const byUser = activeDaysByUser([
    { user_id: "a", day: "2026-10-01" },
    { user_id: "a", day: "2026-10-01" },
    { user_id: "a", day: "2026-10-02" },
    { user_id: "b", day: "2026-10-01" },
  ]);
  assert.equal(byUser.get("a")?.size, 2);
  assert.equal(byUser.get("b")?.size, 1);
});
