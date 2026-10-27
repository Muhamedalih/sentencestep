import assert from "node:assert/strict";
import test from "node:test";

import {
  bucketCounts,
  comeBack,
  depthSummary,
  distribution,
  finishedAnyList,
  groupFunnel,
  learnerUses,
  ledgerStats,
  parseAsOf,
  roundStats,
  startTiming,
  touchedGroup,
  windowUse,
} from "@/lib/readout/words";
import type { LearnerUse, LedgerRow, RoundEventRow, TypedWord } from "@/lib/readout/words";

const at = (iso: string) => Date.parse(iso);

function typed(userId: string, groupId: string, first: string, last = first): TypedWord {
  return { userId, groupId, firstMs: at(first), lastMs: at(last) };
}

/** A learner's use with no day detail, for the figures that only read counts. */
function use(
  groups: Record<string, number>,
  newDays: string[],
  firstIso = "2026-10-01T00:00:00Z",
): LearnerUse {
  const perGroup = new Map(Object.entries(groups));
  return {
    words: [...perGroup.values()].reduce((sum, count) => sum + count, 0),
    perGroup,
    newDays: new Set(newDays),
    eventsByDay: new Map(newDays.map((day) => [day, 1])),
    firstMs: at(firstIso),
  };
}

test("--as-of: a date counts through the end of that UTC day, an instant counts what is before it", () => {
  assert.deepEqual(parseAsOf("2026-10-26"), {
    cutoffMs: at("2026-10-27T00:00:00Z"),
    day: "2026-10-26",
  });
  assert.deepEqual(parseAsOf("2026-10-26T20:00:00Z"), {
    cutoffMs: at("2026-10-26T20:00:00Z"),
    day: "2026-10-26",
  });
  // An instant at midnight sharp is the end of the day before.
  assert.deepEqual(parseAsOf("2026-10-27T00:00:00Z"), {
    cutoffMs: at("2026-10-27T00:00:00Z"),
    day: "2026-10-26",
  });
  assert.deepEqual(parseAsOf("2028-02-29"), {
    cutoffMs: at("2028-03-01T00:00:00Z"),
    day: "2028-02-29",
  });
});

test("--as-of: anything that is not a real date or instant is turned away", () => {
  for (const bad of [
    undefined,
    "",
    "yesterday",
    "2026-02-30",
    "2027-02-29",
    "2026-13-01",
    "2026-10-26 12:00",
    "26-10-2026",
  ]) {
    assert.equal(parseAsOf(bad), null, String(bad));
  }
});

test("a distribution: the mean, the median of an odd and an even count, and the 90th percent by nearest rank", () => {
  assert.equal(distribution([]), null);
  assert.deepEqual(distribution([5]), { n: 1, mean: 5, median: 5, p90: 5 });
  assert.equal(distribution([4, 1, 3, 2])!.median, 2.5);
  assert.equal(distribution([3, 1, 2])!.median, 2);
  const ten = distribution(Array.from({ length: 10 }, (_unused, index) => index + 1))!;
  assert.equal(ten.p90, 10);
  assert.equal(ten.mean, 5.5);
  const twenty = distribution(Array.from({ length: 20 }, (_unused, index) => index + 1))!;
  assert.equal(twenty.p90, 19);
});

test("words per learner fall into the report's ranges", () => {
  const counts = bucketCounts([1, 5, 6, 10, 11, 20, 21, 50, 51, 100, 101, 615]);
  assert.deepEqual(
    counts.map((bucket) => [bucket.label, bucket.count]),
    [
      ["1-5", 2],
      ["6-10", 2],
      ["11-20", 2],
      ["21-50", 2],
      ["51-100", 2],
      ["101+", 2],
    ],
  );
});

test("a learner's use stops at the cutoff: later words are not there and a later re-type is not counted", () => {
  const cutoff = at("2026-10-04T00:00:00Z");
  const uses = learnerUses(
    [
      typed("u1", "family", "2026-10-01T10:00:00Z"),
      // typed again two days later: a second event on another day
      typed("u1", "family", "2026-10-01T11:00:00Z", "2026-10-03T09:00:00Z"),
      // typed again on the same day: still one event
      typed("u1", "colors", "2026-10-02T08:00:00Z", "2026-10-02T20:00:00Z"),
      // typed again AFTER the cutoff: that moment is not known to have happened yet
      typed("u1", "family", "2026-10-02T09:00:00Z", "2026-10-06T09:00:00Z"),
      // first typed after the cutoff: not there at all
      typed("u1", "family", "2026-10-04T01:00:00Z"),
      typed("u2", "family", "2026-10-09T01:00:00Z"),
    ],
    cutoff,
  );
  assert.deepEqual([...uses.keys()], ["u1"]);
  const u1 = uses.get("u1")!;
  assert.equal(u1.words, 4);
  assert.deepEqual([...u1.newDays].sort(), ["2026-10-01", "2026-10-02"]);
  assert.deepEqual(Object.fromEntries(u1.perGroup), { family: 3, colors: 1 });
  assert.deepEqual(Object.fromEntries(u1.eventsByDay), {
    "2026-10-01": 2,
    "2026-10-02": 2,
    "2026-10-03": 1,
  });
  assert.equal(u1.firstMs, at("2026-10-01T10:00:00Z"));
});

test("a window counts a word when it was first typed or last typed again inside it, once", () => {
  const cutoff = at("2026-10-10T00:00:00Z");
  const words = [
    typed("a", "family", "2026-10-01T00:00:00Z"), // before the window
    typed("a", "family", "2026-10-01T01:00:00Z", "2026-10-05T00:00:00Z"), // typed again inside
    typed("b", "family", "2026-10-04T00:00:00Z"), // inside
    typed("b", "colors", "2026-10-04T01:00:00Z", "2026-10-12T00:00:00Z"), // first inside, re-typed after the cutoff
    typed("c", "family", "2026-10-11T00:00:00Z"), // after the cutoff
  ];
  const week = windowUse(words, cutoff - 7 * 86_400_000, cutoff);
  assert.equal(week.learners, 2);
  assert.equal(week.words, 3);
  assert.equal(week.perLearner!.mean, 1.5);
  const ever = windowUse(words, null, cutoff);
  assert.equal(ever.learners, 2);
  assert.equal(ever.words, 4);
  assert.equal(windowUse([], null, cutoff).perLearner, null);
});

test("depth: words, days with new words and lists per learner", () => {
  const uses = new Map<string, LearnerUse>([
    ["a", use({ family: 3 }, ["2026-10-01"])],
    ["b", use({ family: 10, colors: 2 }, ["2026-10-01", "2026-10-02"])],
    ["c", use({ family: 25, colors: 25, food: 10 }, ["2026-10-01", "2026-10-02", "2026-10-03"])],
  ]);
  const depth = depthSummary(uses)!;
  assert.equal(depth.learners, 3);
  assert.equal(depth.words.median, 12);
  assert.equal(depth.words.mean, (3 + 12 + 60) / 3);
  assert.deepEqual(
    depth.buckets.map((bucket) => bucket.count),
    [1, 0, 1, 0, 1, 0],
  );
  assert.deepEqual(depth.newDays, { mean: 2, one: 1, twoPlus: 2, threePlus: 1 });
  assert.deepEqual(depth.lists, { mean: 2, one: 1, twoPlus: 2, threePlus: 1 });
  assert.equal(depth.useDay!.n, 6);
  assert.equal(depthSummary(new Map()), null);
});

test("coming back: only learners whose first week is over are judged, by new words on another day", () => {
  const uses = new Map<string, LearnerUse>([
    ["back", use({ family: 5 }, ["2026-10-10", "2026-10-13"], "2026-10-10T08:00:00Z")],
    ["stayed", use({ family: 5 }, ["2026-10-18"], "2026-10-18T23:59:00Z")],
    ["tooNew", use({ family: 5 }, ["2026-10-19", "2026-10-20"], "2026-10-19T00:00:00Z")],
    ["old", use({ family: 5 }, ["2026-10-01"], "2026-10-01T08:00:00Z")],
  ]);
  // As of 26 Oct the 8-day line is 18 Oct: the 18th counts, the 19th (a week ago) is too soon.
  assert.deepEqual(comeBack(uses, "2026-10-26"), { pool: 3, back: 1 });
  assert.deepEqual(comeBack(uses, "2026-10-26", 7), { pool: 4, back: 2 });
  assert.deepEqual(comeBack(new Map(), "2026-10-26"), { pool: 0, back: 0 });
});

test("a list's learners: who touched it, who finished any list, and how far its funnel goes", () => {
  const uses = new Map<string, LearnerUse>([
    ["u1", use({ family: 25, colors: 3 }, ["2026-10-01"])],
    ["u2", use({ family: 12 }, ["2026-10-01"])],
    ["u3", use({ family: 5 }, ["2026-10-01"])],
    ["u4", use({ colors: 20 }, ["2026-10-01"])],
    ["u5", use({ family: 25 }, ["2026-10-01"])],
  ]);
  assert.deepEqual(touchedGroup(uses, "family"), { touched: 4, onlyThis: 3 });
  assert.equal(
    finishedAnyList(
      uses,
      new Map([
        ["family", 25],
        ["colors", 20],
      ]),
    ),
    3,
  );
  // A list with no known size cannot be finished.
  assert.equal(finishedAnyList(uses, new Map()), 0);
  const funnel = groupFunnel(uses, "family", 25);
  assert.equal(funnel.started, 4);
  assert.deepEqual(
    funnel.reached.map((step) => [step.words, step.learners]),
    [
      [1, 4],
      [5, 4],
      [10, 3],
      [15, 2],
      [20, 2],
      [25, 2],
    ],
  );
  assert.equal(funnel.finished, 2);
  assert.equal(funnel.finishedAlsoOther, 1);
  // A short list stops its funnel at its own size.
  assert.deepEqual(
    groupFunnel(uses, "colors", 20).reached.map((step) => step.words),
    [1, 5, 10, 15, 20],
  );
  assert.deepEqual(
    groupFunnel(uses, "colors", 8).reached.map((step) => step.words),
    [1, 5, 8],
  );
});

test("how soon after signing up the first word was typed", () => {
  const uses = new Map<string, LearnerUse>([
    ["quick", use({ family: 1 }, ["2026-10-01"], "2026-10-01T10:30:00Z")],
    ["sameDay", use({ family: 1 }, ["2026-10-01"], "2026-10-01T20:00:00Z")],
    ["late", use({ family: 1 }, ["2026-10-20"], "2026-10-20T10:00:00Z")],
    ["unknown", use({ family: 1 }, ["2026-10-20"], "2026-10-20T10:00:00Z")],
  ]);
  const signedUp = new Map([
    ["quick", at("2026-10-01T10:00:00Z")],
    ["sameDay", at("2026-10-01T10:00:00Z")],
    ["late", at("2026-10-01T10:00:00Z")],
  ]);
  assert.deepEqual(startTiming(uses, signedUp), {
    known: 3,
    within1h: 1,
    within24h: 2,
    after7d: 1,
  });
});

function ledgerRow(over: Partial<LedgerRow>): LedgerRow {
  return {
    user_id: "u1",
    status: "corrected",
    created_at: "2026-10-01T10:00:00Z",
    corrected_at: "2026-10-01T10:02:00Z",
    review_stage: 0,
    next_review_at: null,
    ...over,
  };
}

test("the weak-word ledger: corrected share, minutes to correct, open words and their age", () => {
  const cutoff = at("2026-10-27T00:00:00Z");
  const stats = ledgerStats(
    [
      ledgerRow({}), // corrected after 2 minutes
      ledgerRow({ user_id: "u2", corrected_at: "2026-10-01T10:00:30Z" }), // 0.5 minutes
      ledgerRow({ user_id: "u2", corrected_at: "2026-10-01T10:10:00Z" }), // 10 minutes
      ledgerRow({ status: "corrected", corrected_at: null }), // corrected, no time recorded
      ledgerRow({
        status: "active",
        user_id: "u3",
        created_at: "2026-10-20T00:00:00Z",
        corrected_at: null,
      }), // open, 7 days
      ledgerRow({
        status: "active",
        user_id: "u4",
        created_at: "2026-10-26T12:00:00Z",
        corrected_at: null,
      }), // open, half a day
      ledgerRow({
        status: "active",
        user_id: "u3",
        created_at: "2026-10-10T00:00:00Z",
        corrected_at: null,
      }), // open, 17 days
      ledgerRow({ user_id: "u5", created_at: "2026-10-27T00:00:01Z" }), // after the cutoff: not there
    ],
    cutoff,
  );
  assert.equal(stats.words, 7);
  assert.equal(stats.learners, 4);
  assert.equal(stats.corrected, 4);
  assert.equal(stats.open, 3);
  assert.equal(stats.openLearners, 2);
  assert.equal(stats.medianMinutesToCorrect, 2);
  assert.equal(stats.scheduled, 0);
  assert.equal(stats.openMedianAgeDays, 7);
  assert.equal(stats.openOlderThan3Days, 2);
});

test("a word on the review schedule is counted, by stage or by a next review", () => {
  const cutoff = at("2026-10-27T00:00:00Z");
  const stats = ledgerStats(
    [
      ledgerRow({ review_stage: 1 }),
      ledgerRow({ next_review_at: "2026-10-30T00:00:00Z" }),
      ledgerRow({}),
    ],
    cutoff,
  );
  assert.equal(stats.scheduled, 2);
  assert.equal(ledgerStats([], cutoff).medianMinutesToCorrect, null);
  assert.equal(ledgerStats([], cutoff).openMedianAgeDays, null);
});

test("the round events per source: guests count, an admin or editor testing does not", () => {
  const learners = new Set(["l1", "l2"]);
  const isLearner = (id: string) => learners.has(id);
  const events: RoundEventRow[] = [
    {
      user_id: "l1",
      event_name: "WORDS_ROUND_STARTED",
      event_properties: { source: "list", count: 25 },
    },
    {
      user_id: "l1",
      event_name: "WORDS_ROUND_FINISHED",
      event_properties: { source: "list", count: 25, clean: 20, assisted: 0, missed: 5 },
    },
    {
      user_id: "l2",
      event_name: "WORDS_ROUND_STARTED",
      event_properties: { source: "list", count: 10 },
    },
    {
      user_id: null,
      event_name: "WORDS_ROUND_STARTED",
      event_properties: { source: "list", count: 25 },
    },
    {
      user_id: "l1",
      event_name: "WORDS_ROUND_STARTED",
      event_properties: { source: "list", count: 25 },
    },
    {
      user_id: "admin",
      event_name: "WORDS_ROUND_STARTED",
      event_properties: { source: "today", count: 5 },
    },
    {
      user_id: "l2",
      event_name: "WORDS_ROUND_STARTED",
      event_properties: { source: "today", count: 5 },
    },
    {
      user_id: "l2",
      event_name: "WORDS_ROUND_FINISHED",
      event_properties: { source: "today", count: 5, clean: 3, assisted: 1, missed: 1 },
    },
    { user_id: "l1", event_name: "LESSON_STARTED", event_properties: { source: "list" } },
    { user_id: "l1", event_name: "WORDS_ROUND_STARTED", event_properties: { count: 5 } },
  ];
  const stats = roundStats(events, isLearner);
  assert.deepEqual(stats, [
    {
      source: "list",
      started: 4,
      finished: 1,
      asked: 25,
      clean: 20,
      assisted: 0,
      missed: 5,
      learners: 2,
      guestStarts: 1,
    },
    {
      source: "today",
      started: 1,
      finished: 1,
      asked: 5,
      clean: 3,
      assisted: 1,
      missed: 1,
      learners: 1,
      guestStarts: 0,
    },
  ]);
  assert.deepEqual(roundStats([], isLearner), []);
});
