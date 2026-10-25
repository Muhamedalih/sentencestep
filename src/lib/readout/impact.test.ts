import assert from "node:assert/strict";
import test from "node:test";

import {
  MINUTE_MS,
  WINDOW_MS,
  compareSeries,
  computeImpact,
  mergeBlocks,
  pairLessonEvents,
  proportionZ,
  windowIndex,
  windowPlan,
  windowStart,
} from "@/lib/readout/impact";
import type { ImpactInput, Series } from "@/lib/readout/impact";
import { baghdad, renderImpactReport, windowsPhrase } from "@/lib/readout/impact-report";

const T = Date.parse("2026-10-22T10:22:58.904Z");
const HOUR = 3_600_000;
const DAY = WINDOW_MS;

test("windows start at the change: 0 is the first 24 hours after it, -1 the 24 hours before it", () => {
  assert.equal(windowIndex(T, T), 0);
  assert.equal(windowIndex(T - 1, T), -1);
  assert.equal(windowIndex(T + DAY - 1, T), 0);
  assert.equal(windowIndex(T + DAY, T), 1);
  assert.equal(windowStart(-2, T), T - 2 * DAY);
});

test("window plan: the complete windows after the change count, the running one is set apart", () => {
  const running = windowPlan(T, T + 2.5 * DAY, 12);
  assert.deepEqual(running.beforeKs, [-12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1]);
  assert.deepEqual(running.afterKs, [0, 1]);
  assert.equal(running.partialK, 2);

  const onTheEdge = windowPlan(T, T + 3 * DAY, 3);
  assert.deepEqual(onTheEdge.afterKs, [0, 1, 2]);
  assert.equal(onTheEdge.partialK, null);

  const notYet = windowPlan(T, T - 1, 3);
  assert.deepEqual(notYet.afterKs, []);
  assert.equal(notYet.partialK, null);
});

test("blocks: events under four minutes apart are one stretch, and a lone event counts a minute", () => {
  const m = MINUTE_MS;
  const blocks = mergeBlocks([
    { start: 20 * m, end: 26 * m }, // a six-minute span, given out of order
    { start: 0, end: 0 }, // a lone event
    { start: 3 * m, end: 3 * m }, // three minutes later: the same stretch
  ]);
  assert.deepEqual(blocks, [
    { start: 0, end: 4 * m },
    { start: 20 * m, end: 26 * m },
  ]);
});

test("lessons: a completion is paired with the latest start of the same lesson, within 40 minutes", () => {
  const m = MINUTE_MS;
  const paired = pairLessonEvents([
    { userId: "a", lessonId: "l1", at: 6 * m, type: "complete" },
    { userId: "a", lessonId: "l1", at: 0, type: "start" },
    { userId: "a", lessonId: "l2", at: 10 * m, type: "complete" }, // no start was seen
    { userId: "b", lessonId: "l1", at: 0, type: "start" }, // never finished...
    { userId: "b", lessonId: "l1", at: 90 * m, type: "complete" }, // ...and too long ago to be this sitting
  ]);
  assert.deepEqual(paired.spans, [
    { userId: "a", start: 0, end: 6 * m },
    { userId: "a", start: 10 * m, end: 10 * m },
    { userId: "b", start: 90 * m, end: 90 * m },
  ]);
  assert.deepEqual(paired.openStarts, [{ userId: "b", at: 0 }]);
});

test("two shares: z of the difference, and nothing when it cannot be judged", () => {
  assert.equal(proportionZ(0, 0, 1, 2), null);
  assert.equal(proportionZ(0, 10, 0, 10), null);
  const z = proportionZ(50, 100, 70, 100);
  assert.ok(z !== null && Math.abs(z - 2.887) < 0.01);
});

function scenario(): ImpactInput {
  const longAgo = T - 30 * DAY;
  const at = (k: number, hours: number) => T + k * DAY + hours * HOUR;
  const one = (userId: string, time: number) => ({ userId, start: time, end: time });
  return {
    originMs: T,
    nowMs: T + 2.5 * DAY,
    dataStartMs: T - 11 * DAY,
    beforeWindows: 3,
    learners: [
      { id: "a", createdAt: longAgo },
      { id: "b", createdAt: longAgo },
      { id: "c", createdAt: longAgo },
      { id: "e", createdAt: at(1, 1) }, // signs up inside window 1
    ],
    moments: [
      one("a", at(-1, 12)),
      one("b", at(-1, 12)),
      one("c", at(-1, 12)),
      { userId: "a", start: at(0, 1), end: at(0, 1) + 10 * MINUTE_MS }, // a ten-minute lesson
      one("b", at(0, 1)),
      one("a", at(1, 2)),
      one("e", at(1, 2)),
    ],
    presence: [],
    locks: [
      { userId: "a", at: at(-1, 13), kind: "lesson" },
      { userId: "b", at: at(-1, 13), kind: "story" },
      { userId: "a", at: at(0, 2), kind: "lesson" },
      { userId: null, at: at(0, 2), kind: "lesson" }, // a visitor: counted apart
    ],
    upgradeViews: [
      { userId: "a", at: at(-1, 14) },
      { userId: null, at: at(0, 3) },
    ],
    payPresses: [{ userId: "a", at: at(-1, 14) }],
    units: [{ userId: "a", at: at(0, 1), kind: "lesson" }],
    orders: [{ userId: "a", provider: "wayl", createdAt: at(-1, 14), paidAt: at(-1, 15) }],
    tasks: [
      { userId: "a", kind: "old", slot: 0, createdAt: at(-1, 12), done: true },
      { userId: "a", kind: "old", slot: 1, createdAt: at(-1, 12), done: false },
      { userId: "b", kind: "old", slot: 0, createdAt: at(-1, 12), done: false },
      { userId: "a", kind: "today", slot: 10, createdAt: at(0, 1), done: true },
      { userId: "a", kind: "today", slot: 11, createdAt: at(0, 1), done: true },
      { userId: "a", kind: "today", slot: 12, createdAt: at(0, 1), done: true },
      { userId: "b", kind: "today", slot: 10, createdAt: at(0, 1), done: false },
      { userId: "b", kind: "today", slot: 11, createdAt: at(0, 1), done: false },
      { userId: "b", kind: "today", slot: 12, createdAt: at(0, 1), done: false },
    ],
    finishedToday: [{ userId: "a", at: at(0, 2) }],
  };
}

function cell(result: ReturnType<typeof computeImpact>, id: string, k: number) {
  const found = result.series.get(id)?.cells.get(k);
  assert.ok(found, `${id} has no cell for window ${k}`);
  return found;
}

test("series: who was active, who was locked, and the tasks, window by window", () => {
  const result = computeImpact(scenario());
  assert.deepEqual(result.plan.afterKs, [0, 1]);

  assert.equal(cell(result, "active.all", -1).num, 3);
  assert.equal(cell(result, "active.all", 0).num, 2);
  assert.equal(cell(result, "active.returning", 1).num, 1);
  assert.equal(cell(result, "active.new", 1).num, 1);

  // Locks: a and b met one before the change (2 of 3 active), only a after it (1 of 2); the visitor is counted apart.
  assert.deepEqual([cell(result, "lock.all", -1).num, cell(result, "lock.all", -1).den], [2, 3]);
  assert.deepEqual([cell(result, "lock.all", 0).num, cell(result, "lock.all", 0).den], [1, 2]);
  assert.equal(cell(result, "lock.kind.story", -1).num, 1);
  assert.equal(cell(result, "visitors.locks", 0).num, 1);
  assert.equal(cell(result, "visitors.upgrade", 0).num, 1);
  assert.equal(cell(result, "upgrade.all", 0).num, 0);
  assert.deepEqual(
    [cell(result, "upgrade.perLock", -1).num, cell(result, "upgrade.perLock", -1).den],
    [1, 2],
  );
  assert.equal(cell(result, "press.all", -1).num, 1);

  // Orders: created and paid in window -1.
  assert.equal(cell(result, "orders.created", -1).num, 1);
  assert.equal(cell(result, "orders.created.wayl", -1).num, 1);
  assert.equal(cell(result, "orders.paid", -1).num, 1);

  // Tasks: before, a finished 1 of her 2 random tasks; after, a finished all 3 of Today's, b none.
  assert.deepEqual([cell(result, "tasks.one", -1).num, cell(result, "tasks.one", -1).den], [1, 2]);
  assert.equal(cell(result, "tasks.all", -1).num, 0);
  assert.deepEqual([cell(result, "tasks.all", 0).num, cell(result, "tasks.all", 0).den], [1, 2]);
  assert.deepEqual(
    [cell(result, "tasks.today.slot10", 0).num, cell(result, "tasks.today.slot10", 0).den],
    [1, 2],
  );
  assert.equal(cell(result, "today.finished", 0).num, 1);
});

test("time: a block's minutes are measured, and only returning learners enter the returning average", () => {
  const result = computeImpact(scenario());
  // Window 0: a spent ten minutes, b one lone event (one minute).
  const minutes = cell(result, "time.minutes.returning", 0);
  assert.equal(minutes.num, 11);
  assert.equal(minutes.den, 2);
  assert.deepEqual(
    [cell(result, "time.ge10.returning", 0).num, cell(result, "time.ge10.returning", 0).den],
    [1, 2],
  );
  // Window 1: e is new, so the returning average holds only a's lone minute.
  assert.equal(cell(result, "time.minutes.returning", 1).den, 1);
  assert.equal(cell(result, "time.minutes.new", 1).den, 1);
});

test("return: of those active in the window before, how many are active again", () => {
  const result = computeImpact(scenario());
  // Window -1 had a, b, c; a and b came back in window 0.
  assert.deepEqual(
    [cell(result, "return.next.all", 0).num, cell(result, "return.next.all", 0).den],
    [2, 3],
  );
  // Window 0 had a, b; only a came back in window 1.
  assert.deepEqual(
    [cell(result, "return.next.all", 1).num, cell(result, "return.next.all", 1).den],
    [1, 2],
  );
  // Veterans (a, b, c) who studied in the week before window 1: a came back, b and c did not.
  assert.deepEqual([cell(result, "return.r7", 1).num, cell(result, "return.r7", 1).den], [1, 3]);
});

test("new sign-ups: those whose hours all fall before the change, against those who signed up after it", () => {
  const input: ImpactInput = {
    originMs: T,
    nowMs: T + 6 * DAY,
    dataStartMs: T - 20 * DAY,
    beforeWindows: 6,
    learners: [
      { id: "b1", createdAt: T - 4 * DAY + 1 * HOUR },
      { id: "b2", createdAt: T - 4 * DAY + 2 * HOUR },
      { id: "b3", createdAt: T - 4 * DAY + 3 * HOUR },
      { id: "t1", createdAt: T - 1 * DAY + 1 * HOUR }, // judged partly after the change: left out
      { id: "a1", createdAt: T + 1 * HOUR },
    ],
    moments: [
      { userId: "b1", start: T - 4 * DAY + 2 * HOUR, end: T - 4 * DAY + 2 * HOUR },
      { userId: "b1", start: T - 4 * DAY + 30 * HOUR, end: T - 4 * DAY + 30 * HOUR },
      { userId: "b2", start: T - 4 * DAY + 3 * HOUR, end: T - 4 * DAY + 3 * HOUR },
      { userId: "a1", start: T + 2 * HOUR, end: T + 2 * HOUR },
      { userId: "a1", start: T + 27 * HOUR, end: T + 27 * HOUR },
    ],
    presence: [],
    locks: [],
    upgradeViews: [],
    payPresses: [],
    units: [],
    orders: [],
    tasks: [],
    finishedToday: [],
  };
  const { nextDay } = computeImpact(input).cohorts;
  assert.deepEqual(nextDay.before, {
    signups: 3,
    studiedFirstDay: 2,
    back: 1,
    studiedBack: 1,
    restBack: 0,
  });
  assert.deepEqual(nextDay.after, {
    signups: 1,
    studiedFirstDay: 1,
    back: 1,
    studiedBack: 1,
    restBack: 0,
  });
  assert.equal(nextDay.rows.find((row) => row.k === -1)?.group, "transition");
  assert.ok(nextDay.z !== null && Math.abs(nextDay.z - 1.1547) < 0.01);
});

function seriesOf(
  kind: Series["kind"],
  before: readonly (readonly [number, number])[],
  after: readonly (readonly [number, number])[],
): Series {
  const cells = new Map<number, { num: number; den: number; sumSq: number }>();
  before.forEach(([num, den], i) => cells.set(i - before.length, { num, den, sumSq: 0 }));
  after.forEach(([num, den], i) => cells.set(i, { num, den, sumSq: 0 }));
  return { kind, cells };
}

const BEFORE_KS = Array.from({ length: 12 }, (_, i) => i - 12);

test("verdict: a fall that every window after shows, against steady windows before, is clear", () => {
  const before = [175, 180, 190, 170, 200, 185, 195, 160, 150, 175, 180, 188].map(
    (n) => [n, 500] as const,
  );
  const series = seriesOf("ratio", before, [
    [110, 500],
    [105, 500],
    [115, 500],
  ]);
  const comparison = compareSeries(series, BEFORE_KS, [0, 1, 2]);
  assert.equal(comparison?.verdict, "down");
  assert.equal(comparison?.position, "below");
  assert.ok(comparison?.consistent);
});

test("verdict: values inside the usual swing are no difference, and one window is too early", () => {
  const before = [175, 180, 190, 170, 200, 185, 195, 160, 150, 175, 180, 188].map(
    (n) => [n, 500] as const,
  );
  const inside = seriesOf("ratio", before, [
    [180, 500],
    [170, 500],
    [190, 500],
  ]);
  assert.equal(compareSeries(inside, BEFORE_KS, [0, 1, 2])?.verdict, "flat");
  const one = seriesOf("ratio", before, [[100, 500]]);
  assert.equal(compareSeries(one, BEFORE_KS, [0])?.verdict, "early");
});

test("verdict: a drop that was already there in the last windows before is only a lean", () => {
  const before = [200, 200, 200, 200, 200, 200, 200, 200, 110, 112, 108, 110].map(
    (n) => [n, 500] as const,
  );
  const series = seriesOf("ratio", before, [
    [100, 500],
    [105, 500],
    [100, 500],
  ]);
  const comparison = compareSeries(series, BEFORE_KS, [0, 1, 2]);
  assert.equal(comparison?.position, "below");
  assert.equal(comparison?.consistent, false);
  assert.equal(comparison?.verdict, "maybeDown");
});

test("the report: Arabic text with the go-live time in Baghdad time and no gaps shown as NaN", () => {
  const result = computeImpact(scenario());
  const markdown = renderImpactReport(result, {
    feature: { mode: "everyone", percent: 100, source: "audit log" },
    otherChanges: [{ atMs: T - DAY, text: "تغيير للاختبار" }],
    notes: ["ملاحظة للاختبار"],
  });
  assert.match(markdown, /مفتوحة لكل المتعلمين المسجَّلين/);
  assert.match(markdown, /2026-10-22 13:22/);
  assert.match(markdown, /## 7\. هل يحاول الاشتراك أكثر؟/);
  assert.match(markdown, /تغيير للاختبار/);
  assert.match(markdown, /ملاحظة للاختبار/);
  assert.ok(!markdown.includes("NaN") && !markdown.includes("undefined"));
});

test("the report: dates in Baghdad time and Arabic counts of windows", () => {
  assert.equal(baghdad(T), "2026-10-22 13:22");
  assert.equal(windowsPhrase(1), "نافذة واحدة");
  assert.equal(windowsPhrase(2), "نافذتان");
  assert.equal(windowsPhrase(3), "3 نوافذ");
  assert.equal(windowsPhrase(10), "10 نوافذ");
  assert.equal(windowsPhrase(12), "12 نافذة");
});
