import assert from "node:assert/strict";
import test from "node:test";

import { rolloutBucket, sanitizeRolloutConfig } from "@/lib/rollouts/config";
import {
  STOP_RULES,
  armOf,
  bankOpening,
  checkStats,
  exposure,
  guardVerdict,
  judgeShare,
  masteryStats,
  visitStats,
  weeklyStates,
} from "@/lib/sentence-bank/readout";
import { TODAY_SENTENCE_SLOT } from "@/lib/today/quests";
import { emptyThreeTaskStats } from "@/lib/today/readout";
import type { QuestRow } from "@/lib/today/readout";

/** Finds an account id that falls in a given group of 100 for a feature. */
function idWithBucket(
  feature: "sentenceBank" | "todaySession",
  wanted: (bucket: number) => boolean,
) {
  for (let n = 0; n < 5000; n++) {
    const id = `learner-${n}`;
    if (wanted(rolloutBucket(id, feature))) return id;
  }
  throw new Error("no id found");
}

const everyoneToday = { feature: "todaySession", mode: "everyone", percent: 100, emails: [] };

test("what the bank is open to is read off the stored settings", () => {
  assert.deepEqual(bankOpening(sanitizeRolloutConfig([])), { kind: "closed", mode: "admin" });
  assert.deepEqual(
    bankOpening(
      sanitizeRolloutConfig([
        { feature: "sentenceBank", mode: "emails", percent: 100, emails: [] },
      ]),
    ),
    { kind: "closed", mode: "emails" },
  );
  assert.deepEqual(
    bankOpening(
      sanitizeRolloutConfig([
        { feature: "sentenceBank", mode: "everyone", percent: 100, emails: [] },
      ]),
    ),
    { kind: "everyone" },
  );
  assert.deepEqual(
    bankOpening(
      sanitizeRolloutConfig([
        { feature: "sentenceBank", mode: "everyone", percent: 20, emails: [] },
      ]),
    ),
    { kind: "share", percent: 20 },
  );
});

test("a share splits Today's learners by the same hash the site uses", () => {
  const config = sanitizeRolloutConfig([
    everyoneToday,
    { feature: "sentenceBank", mode: "everyone", percent: 30, emails: [] },
  ]);
  const inside = idWithBucket("sentenceBank", (bucket) => bucket < 30);
  const outside = idWithBucket("sentenceBank", (bucket) => bucket >= 30);
  assert.equal(armOf(inside, config), "bank");
  assert.equal(armOf(outside, config), "control");
});

test("outside Today's session a learner is in neither arm; with the bank open to all there is no control", () => {
  const todayHalf = sanitizeRolloutConfig([
    { feature: "todaySession", mode: "everyone", percent: 50, emails: [] },
    { feature: "sentenceBank", mode: "everyone", percent: 100, emails: [] },
  ]);
  const without = idWithBucket("todaySession", (bucket) => bucket >= 50);
  const within = idWithBucket("todaySession", (bucket) => bucket < 50);
  assert.equal(armOf(without, todayHalf), null);
  assert.equal(armOf(within, todayHalf), "bank");
  // The bank cannot be open for someone who has no Today's session.
  const bankOnly = sanitizeRolloutConfig([
    { feature: "sentenceBank", mode: "everyone", percent: 100, emails: [] },
  ]);
  assert.equal(armOf("anyone", bankOnly), null);
});

function quest(user: string, slot: number, type: string, done: boolean): QuestRow {
  return {
    user_id: user,
    quest_date: "2026-10-20",
    slot,
    quest_type: type,
    completed_at: done ? "2026-10-20T10:00:00Z" : null,
  };
}

test("exposure counts only the optional test row", () => {
  const stats = exposure([
    quest("a", TODAY_SENTENCE_SLOT, "sentenceReview", true),
    quest("b", TODAY_SENTENCE_SLOT, "sentenceReview", false),
    quest("c", TODAY_SENTENCE_SLOT, "sentenceReview", true),
    quest("a", 10, "passages", true),
    quest("a", TODAY_SENTENCE_SLOT, "lessons", true),
  ]);
  assert.deepEqual(stats, { learners: 3, dealt: 3, completed: 2, learnersCompleted: 2 });
});

test("visits: starts, finishes and the first-go figures of the finished ones", () => {
  const stats = visitStats([
    { user_id: "a", event_name: "SENTENCE_REVIEW_STARTED", event_properties: { count: 3 } },
    { user_id: "a", event_name: "SENTENCE_REVIEW_STARTED", event_properties: { count: 3 } },
    {
      user_id: "a",
      event_name: "SENTENCE_REVIEW_FINISHED",
      event_properties: { count: 3, clean: 2, assisted: 1, missed: 0 },
    },
    { user_id: "b", event_name: "SENTENCE_REVIEW_FINISHED", event_properties: null },
    { user_id: "a", event_name: "SENTENCE_CHECK_STARTED", event_properties: { asked: 10 } },
    { user_id: "a", event_name: "SENTENCE_CHECK_FINISHED", event_properties: { asked: 10 } },
    { user_id: "a", event_name: "SOMETHING_ELSE", event_properties: { count: 99 } },
  ]);
  assert.equal(stats.started, 2);
  assert.equal(stats.finished, 2);
  assert.equal(stats.asked, 3);
  assert.equal(stats.clean, 2);
  assert.equal(stats.assisted, 1);
  assert.equal(stats.checkStarted, 1);
  assert.equal(stats.checkFinished, 1);
});

test("weekly checks: a number is only counted for a check that asked enough", () => {
  const stats = checkStats([
    { user_id: "a", asked: 10, remembered: 7, written: 40 },
    { user_id: "a", asked: 4, remembered: 4, written: 9 }, // too short to show a number
    { user_id: "b", asked: 8, remembered: 2, written: 30 },
  ]);
  assert.deepEqual(stats, { learners: 2, checks: 3, counted: 2, asked: 18, remembered: 9 });
});

test("sentences at strength 2 or more: learners, total and the median among them", () => {
  assert.deepEqual(masteryStats([]), { learners: 0, total: 0, median: 0 });
  assert.deepEqual(masteryStats(["a", "a", "a", "b"]), { learners: 2, total: 4, median: 2 });
  assert.deepEqual(masteryStats(["a", "a", "a", "b", "c"]), { learners: 3, total: 5, median: 1 });
});

test("a share is judged only with enough rows, and 'below' when under the line", () => {
  assert.equal(judgeShare(5, 10, STOP_RULES.finishShare), "too few");
  assert.equal(judgeShare(12, 30, STOP_RULES.finishShare), "ok");
  assert.equal(judgeShare(11, 30, STOP_RULES.finishShare), "below");
  assert.equal(judgeShare(15, 30, STOP_RULES.accuracy), "ok");
});

function stats(learners: number, userDays: number, allDone: number) {
  return { ...emptyThreeTaskStats(), learners, userDays, allDone };
}

test("the guard waits for 500 learners an arm, then flags a bank arm 2+ points behind", () => {
  assert.equal(guardVerdict(stats(0, 0, 0), stats(600, 1000, 500)).status, "too few");
  assert.equal(guardVerdict(stats(100, 200, 100), stats(600, 1000, 500)).status, "too few");
  // 48% vs 50%: exactly 2 points behind is still fine, 3 is not.
  assert.equal(guardVerdict(stats(600, 1000, 480), stats(600, 1000, 500)).status, "ok");
  const behind = guardVerdict(stats(600, 1000, 470), stats(600, 1000, 500));
  assert.equal(behind.status, "below");
  assert.equal(Math.round(behind.gapPoints ?? 0), -3);
  assert.equal(guardVerdict(stats(600, 1000, 520), stats(600, 1000, 500)).status, "ok");
});

// --- the weekly card's states, as of now ---

const TODAY = "2026-11-10";

const done = (user: string, lesson: string, day: string) => ({
  user_id: user,
  lesson_id: lesson,
  completed_at: `${day}T09:00:00+00:00`,
});
const check = (user: string, day: string, asked: number) => ({
  user_id: user,
  checked_on: day,
  asked,
  remembered: Math.min(asked, 3),
  written: 20,
});

test("weekly card states: locked, opens tomorrow, ready, result, no line", () => {
  const stats = weeklyStates({
    learners: new Set(["ready", "tomorrow", "some", "nothing", "old", "result", "short", "again"]),
    completions: [
      // three stories finished on earlier days: the test is open
      done("ready", "st1", "2026-11-08"),
      done("ready", "st2", "2026-11-09"),
      done("ready", "st3", "2026-11-07"),
      // two on earlier days and the third finished today: it counts from tomorrow
      done("tomorrow", "st1", "2026-11-08"),
      done("tomorrow", "st2", "2026-11-09"),
      done("tomorrow", "st3", TODAY),
      // one story from earlier: one of three
      done("some", "st1", "2026-11-08"),
      // a story from before the week counts for nothing
      done("old", "st1", "2026-11-01"),
      // checked three days ago: the result shows, whatever was finished since
      done("result", "st1", "2026-11-09"),
      // checked yesterday but the check asked fewer than five: no line at all
      done("short", "st1", "2026-11-05"),
      // checked ten days ago, and three stories finished since: ready again
      done("again", "st1", "2026-11-08"),
      done("again", "st2", "2026-11-09"),
      done("again", "st3", "2026-11-05"),
    ],
    checks: [
      check("result", "2026-11-07", 8),
      check("short", "2026-11-09", 4),
      check("again", "2026-10-31", 8),
    ],
    todayISO: TODAY,
  });
  assert.deepEqual(stats, {
    learners: 8,
    locked: 4, // tomorrow, some, nothing, old
    lockedNothingYet: 2, // nothing, old
    lockedOpensTomorrow: 1, // tomorrow
    lockedMedianHave: 0.5, // have = 2 (tomorrow), 1 (some), 0 (nothing), 0 (old) -> median of 0, 0, 1, 2
    ready: 2, // ready, again
    resultShown: 1, // result
    noLine: 1, // short
  });
});

test("weekly card states: a lesson finished twice keeps its first day, and nobody is nobody", () => {
  const empty = weeklyStates({
    learners: new Set(),
    completions: [],
    checks: [],
    todayISO: TODAY,
  });
  assert.equal(empty.learners, 0);
  assert.equal(empty.lockedMedianHave, null);

  const once = weeklyStates({
    learners: new Set(["a"]),
    completions: [
      done("a", "st1", TODAY),
      done("a", "st1", "2026-11-08"),
      done("a", "st2", "2026-11-08"),
      done("a", "st3", "2026-11-08"),
    ],
    checks: [],
    todayISO: TODAY,
  });
  // st1 counts from 11-08 (the earlier finish), so all three stories count today.
  assert.equal(once.ready, 1);
});

test("weekly card states: the latest check decides, not the first one read", () => {
  const stats = weeklyStates({
    learners: new Set(["a"]),
    completions: [],
    checks: [check("a", "2026-11-09", 8), check("a", "2026-10-20", 8)],
    todayISO: TODAY,
  });
  assert.equal(stats.resultShown, 1);
});
