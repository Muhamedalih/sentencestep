import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import {
  armOf,
  detectableDifference,
  meanDiff,
  meanStats,
  readVerdict,
  shareDiff,
  splitZ,
  summarizeArm,
  wilson,
} from "@/lib/readout/level-test";
import type { TestAccount } from "@/lib/readout/level-test";
import { emptyTally } from "@/lib/readout/returns";
import { isRolloutOpen } from "@/lib/rollouts/config";
import type { RolloutEntry } from "@/lib/rollouts/config";

const near = (actual: number | null | undefined, expected: number, tolerance = 0.0005) =>
  assert.ok(
    typeof actual === "number" && Math.abs(actual - expected) <= tolerance,
    `${actual} is not within ${tolerance} of ${expected}`,
  );

test("an account's arm is exactly what the app decides for it, and the split follows the share", () => {
  const entry: RolloutEntry = { mode: "everyone", percent: 50, emails: [] };
  let inTest = 0;
  const total = 20_000;
  for (let index = 0; index < total; index++) {
    const id = randomUUID();
    const viewer = { isAdmin: false, userId: id, email: null, preview: false };
    const opens = isRolloutOpen(entry, viewer, "levelFloor");
    assert.equal(armOf(id, 50) === "test", opens);
    if (opens) inTest += 1;
  }
  assert.ok(Math.abs(inTest / total - 0.5) < 0.02, `test arm held ${inTest} of ${total}`);
  // The same account stays in the same arm, and a bigger share only ever adds accounts to the test arm.
  const id = randomUUID();
  assert.equal(armOf(id, 30), armOf(id, 30));
  if (armOf(id, 30) === "test") assert.equal(armOf(id, 60), "test");
});

test("Wilson interval: none for an empty arm, centred on half for half", () => {
  assert.equal(wilson(0, 0), null);
  const half = wilson(50, 100)!;
  near(half.low, 0.4038);
  near(half.high, 0.5962);
  const none = wilson(0, 40)!;
  assert.equal(none.low, 0);
  assert.ok(none.high > 0 && none.high < 0.15);
});

test("share difference: Newcombe interval, and an interval around zero for equal arms", () => {
  const gap = shareDiff(60, 100, 40, 100)!;
  near(gap.diff, 0.2);
  near(gap.low, 0.0614);
  near(gap.high, 0.3281);
  const same = shareDiff(0, 50, 0, 50)!;
  near(same.diff, 0);
  near(same.low, -0.0714);
  near(same.high, 0.0714);
  assert.equal(shareDiff(5, 0, 5, 10), null);
  assert.equal(shareDiff(5, 10, 0, 0), null);
});

test("mean difference: Welch interval, and none while an arm has under two values", () => {
  assert.equal(meanStats([]), null);
  assert.deepEqual(meanStats([7]), { n: 1, mean: 7, variance: 0 });
  const gap = meanDiff(meanStats([10, 12, 14]), meanStats([8, 9, 10]))!;
  near(gap.diff, 3);
  near(gap.low, 0.4697);
  near(gap.high, 5.5303);
  assert.equal(meanDiff(meanStats([4]), meanStats([8, 9])), null);
  assert.equal(meanDiff(null, meanStats([8, 9])), null);
});

test("split check: a z near zero for the promised share, large for a lopsided split, none for no share", () => {
  near(splitZ(500, 1000, 50), 0);
  near(splitZ(560, 1000, 50), 3.7947, 0.001);
  near(splitZ(100, 1000, 10)!, 0);
  assert.equal(splitZ(0, 0, 50), null);
  assert.equal(splitZ(10, 20, 100), null);
});

test("the gap a test could see: 1,150 learners per arm around 14% is about 4 points", () => {
  near(detectableDifference(1150, 0.14), 0.0405);
  assert.ok(detectableDifference(700, 0.14)! > detectableDifference(1150, 0.14)!);
  assert.equal(detectableDifference(0, 0.14), null);
  assert.equal(detectableDifference(500, 0), null);
});

test("an arm: stored levels, lessons of level 2+ and sentences are counted over days 0-3, and only once day 3 is over", () => {
  const today = "2026-10-20";
  const accounts: TestAccount[] = [
    { id: "a", day: "2026-10-10", startingLevel: 2, levelsDone: [1, 2] },
    { id: "b", day: "2026-10-12", startingLevel: null, levelsDone: [1] },
    // Day 3 of "c" is 21 October: not over, so it counts as stored but is judged on nothing else.
    { id: "c", day: "2026-10-18", startingLevel: 3, levelsDone: [3] },
    // Skipped (0) is not a stored level; day 3 is 19 October, over.
    { id: "d", day: "2026-10-16", startingLevel: 0, levelsDone: [3] },
    // Day 3 is today itself, still running: left out.
    { id: "e", day: "2026-10-17", startingLevel: null, levelsDone: [2] },
  ];
  const typed = new Map<string, Map<string, number>>([
    [
      "a",
      new Map([
        ["2026-10-10", 5],
        ["2026-10-12", 10],
        ["2026-10-14", 100],
      ]),
    ],
    ["d", new Map([["2026-10-19", 7]])],
  ]);
  const summary = summarizeArm(accounts, emptyTally(), (id) => typed.get(id), today);
  assert.equal(summary.accounts, 5);
  assert.equal(summary.storedLevel, 2);
  assert.deepEqual(summary.harder, { known: 3, yes: 2 });
  assert.equal(summary.sentences?.n, 3);
  near(summary.sentences?.mean, (15 + 0 + 7) / 3);
});

test("the verdict waits for the date chosen at the start, for enough learners, and for an interval that leaves zero", () => {
  const base = {
    readDate: "2026-11-10",
    today: "2026-11-12",
    test: { yes: 150, n: 1000 },
    control: { yes: 140, n: 1000 },
  };
  assert.equal(readVerdict({ ...base, readDate: null }).verdict, "no-read-date");
  assert.equal(readVerdict({ ...base, today: "2026-11-01" }).verdict, "before-read-date");
  assert.equal(readVerdict({ ...base, today: "2026-11-10" }).verdict, "no-difference");
  assert.equal(
    readVerdict({ ...base, test: { yes: 20, n: 120 }, control: { yes: 12, n: 120 } }).verdict,
    "too-few",
  );
  assert.equal(readVerdict({ ...base, test: { yes: 0, n: 0 } }).verdict, "too-few");
  assert.equal(readVerdict({ ...base, test: { yes: 200, n: 1000 } }).verdict, "test-higher");
  assert.equal(readVerdict({ ...base, test: { yes: 100, n: 1000 } }).verdict, "test-lower");
  // The figures still come back before the date, for the description; only the verdict is withheld.
  near(readVerdict({ ...base, today: "2026-11-01" }).diff?.diff, 0.01);
});

test("the stop limit is strict, needs enough learners, and may be read before the date", () => {
  const base = {
    readDate: "2026-11-10",
    today: "2026-11-01",
    test: { yes: 80, n: 1000 },
    control: { yes: 140, n: 1000 },
  };
  const early = readVerdict(base);
  assert.equal(early.verdict, "before-read-date");
  assert.equal(early.harm, true);
  // "Lower" at 95% is not yet a stop at 99.7%.
  const mild = readVerdict({ ...base, today: "2026-11-12", test: { yes: 100, n: 1000 } });
  assert.equal(mild.verdict, "test-lower");
  assert.equal(mild.harm, false);
  // A gap in the test arm's favour never trips it; neither does a small arm.
  assert.equal(readVerdict({ ...base, test: { yes: 200, n: 1000 } }).harm, false);
  assert.equal(
    readVerdict({ ...base, test: { yes: 5, n: 120 }, control: { yes: 30, n: 120 } }).harm,
    false,
  );
});
