import assert from "node:assert/strict";
import { test } from "node:test";

import { summarizeStrip } from "./readout";
import { parseStripSource } from "./source";

const at = (day: number, hour = 0) => new Date(Date.UTC(2026, 11, day, hour)).toISOString();
const press = (userId: string | null, day: number) => ({ userId, at: at(day), country: "iq" });

test("only the strip's own word is stored", () => {
  assert.deepEqual(parseStripSource("home_strip"), { src: "home_strip" });
  assert.deepEqual(parseStripSource("anything"), {});
  assert.deepEqual(parseStripSource(undefined), {});
});

test("each person is counted once, with the furthest they got after their first press", () => {
  const readout = summarizeStrip({
    presses: [
      press("paid", 1),
      press("paid", 2),
      press("tried", 1),
      press("back", 1),
      press("gone", 3),
      press(null, 1),
      press("admin", 1),
    ],
    events: [
      { userId: "paid", name: "UPGRADE_CTA_CLICKED", at: at(1, 1), plan: "m3", method: "card" },
      { userId: "tried", name: "UPGRADE_CTA_CLICKED", at: at(1, 1), plan: "m1", method: "egypt" },
      { userId: "back", name: "LESSON_STARTED", at: at(1, 1) },
      // Before the press, and more than a week after it: neither is credited to the strip.
      { userId: "gone", name: "LESSON_STARTED", at: at(2) },
      { userId: "gone", name: "UPGRADE_CTA_CLICKED", at: at(20) },
    ],
    orders: [{ userId: "paid", at: at(1, 2), status: "fulfilled" }],
    staffIds: new Set(["admin"]),
  });

  assert.equal(readout.presses, 6);
  assert.equal(readout.guestPresses, 1);
  assert.equal(readout.staffPresses, 1);
  assert.equal(readout.people.length, 4);
  assert.deepEqual(readout.outcomes, { paid: 1, pay_pressed: 1, practised: 1, nothing: 1 });
  const paid = readout.people.find((person) => person.userId === "paid")!;
  assert.deepEqual([paid.presses, paid.plan, paid.method, paid.country], [2, "m3", "card", "iq"]);
});

test("an order that was never paid counts as pressing pay", () => {
  const readout = summarizeStrip({
    presses: [press("a", 1)],
    events: [],
    orders: [{ userId: "a", at: at(1, 1), status: "pending" }],
    staffIds: new Set(),
  });
  assert.equal(readout.people[0]!.outcome, "pay_pressed");
});
