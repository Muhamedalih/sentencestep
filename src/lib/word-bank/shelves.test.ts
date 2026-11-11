import assert from "node:assert/strict";
import test from "node:test";

import type { BankWordState } from "@/lib/word-bank/select";
import {
  BANK_ACTIVE_CAP,
  BANK_DAILY_CAP,
  bankDay,
  bankOverview,
  reviewedToday,
  roundSources,
  shelfByWord,
  shelveBank,
} from "@/lib/word-bank/shelves";

const TODAY = "2026-11-11";

function word(name: string, extra: Partial<BankWordState> = {}): BankWordState {
  return {
    word: name,
    strength: 1,
    dueOn: "2026-11-10",
    lastReviewedOn: "2026-11-01",
    source: "story",
    lessonId: "story-121",
    lessonTitle: "Too Slow",
    ar: "",
    homeSentence: null,
    firstSeenOn: "2026-11-01",
    ...extra,
  };
}

/** `count` words first met on consecutive days from 1 October, all due. */
function many(count: number, extra: Partial<BankWordState> = {}): BankWordState[] {
  return Array.from({ length: count }, (_, i) =>
    word(`w${String(i).padStart(2, "0")}`, {
      firstSeenOn: `2026-10-${String(1 + (i % 28)).padStart(2, "0")}`,
      ...extra,
    }),
  );
}

test("the caps: twenty words being learned, five asked in a day", () => {
  assert.equal(BANK_ACTIVE_CAP, 20);
  assert.equal(BANK_DAILY_CAP, 5);
});

test("a stable word (strength 4 or more) stands on its own shelf, whatever its due day", () => {
  const shelves = shelveBank([
    word("a", { strength: 4 }),
    word("b", { strength: 5 }),
    word("c", { strength: 3 }),
  ]);
  assert.deepEqual(
    shelves.stable.map((s) => s.word),
    ["a", "b"],
  );
  assert.deepEqual(
    shelves.active.map((s) => s.word),
    ["c"],
  );
  assert.equal(shelves.waiting.length, 0);
});

test("only twenty words are being learned: the oldest first, the rest wait", () => {
  const states = [
    ...many(20),
    word("late-1", { firstSeenOn: "2026-11-05" }),
    word("late-2", { firstSeenOn: "2026-11-06" }),
    word("late-3", { firstSeenOn: "2026-11-06" }),
  ];
  const shelves = shelveBank(states);
  assert.equal(shelves.active.length, 20);
  assert.deepEqual(
    shelves.waiting.map((s) => s.word),
    ["late-1", "late-2", "late-3"],
  );
  assert.ok(shelves.active.every((s) => s.word.startsWith("w")));
});

test("a waiting word moves up by itself when a word being learned becomes stable", () => {
  const before = [...many(20), word("late-1", { firstSeenOn: "2026-11-05" })];
  assert.equal(shelfByWord(shelveBank(before)).get("late-1"), "waiting");
  const after = before.map((s) => (s.word === "w00" ? { ...s, strength: 4 } : s));
  const shelves = shelfByWord(shelveBank(after));
  assert.equal(shelves.get("w00"), "stable");
  assert.equal(shelves.get("late-1"), "active");
});

test("a word that is being learned never drops back to waiting when new words arrive", () => {
  const first = shelfByWord(shelveBank(many(20)));
  const more = [
    ...many(20),
    ...many(10, { firstSeenOn: TODAY }).map((s) => ({ ...s, word: `n-${s.word}` })),
  ];
  const second = shelfByWord(shelveBank(more));
  for (const [name, shelf] of first) assert.equal(second.get(name), shelf);
});

test("a day asks five words at most, however many are due", () => {
  const day = bankDay(many(20), TODAY);
  assert.equal(day.due.length, 20);
  assert.equal(day.round.length, 5);
  assert.equal(day.left, 5);
});

test("waiting and stable words are never asked", () => {
  const states = [
    ...many(20, { dueOn: "2026-12-01" }),
    word("late", { firstSeenOn: "2026-11-05", dueOn: "2026-11-06" }),
    word("known", { strength: 4, dueOn: "2026-11-02" }),
  ];
  const day = bankDay(states, TODAY);
  assert.deepEqual(day.round, []);
  assert.deepEqual(day.due, []);
});

test("words already asked today come off the day's five", () => {
  const states = many(20).map((s, i) =>
    i < 3 ? { ...s, lastReviewedOn: TODAY, dueOn: "2026-11-14", strength: 2 } : s,
  );
  assert.equal(reviewedToday(states, TODAY), 3);
  const day = bankDay(states, TODAY);
  assert.equal(day.asked, 3);
  assert.equal(day.left, 2);
  assert.equal(day.round.length, 2);
});

test("after five answers the day is done, even with words still due", () => {
  const states = many(20).map((s, i) =>
    i < 5 ? { ...s, lastReviewedOn: TODAY, dueOn: "2026-11-12", strength: 0 } : s,
  );
  const day = bankDay(states, TODAY);
  assert.equal(day.left, 0);
  assert.deepEqual(day.round, []);
  assert.ok(day.due.length > 0);
});

test("a word met for the first time today was typed in its lesson: it does not use up the day's five", () => {
  const states = [
    ...many(6),
    word("new", { firstSeenOn: TODAY, lastReviewedOn: TODAY, dueOn: "2026-11-12" }),
  ];
  assert.equal(reviewedToday(states, TODAY), 0);
  assert.equal(bankDay(states, TODAY).round.length, 5);
});

test("the round asks the longest waiting first, then the weakest, then by spelling", () => {
  const day = bankDay(
    [
      word("pear", { dueOn: "2026-11-10", strength: 2 }),
      word("apple", { dueOn: "2026-11-10", strength: 2 }),
      word("fig", { dueOn: "2026-11-10", strength: 0 }),
      word("plum", { dueOn: "2026-11-03", strength: 3 }),
    ],
    TODAY,
  );
  assert.deepEqual(
    day.round.map((s) => s.word),
    ["plum", "fig", "apple", "pear"],
  );
});

test("today's words are grouped by the lesson they came from, the biggest group first", () => {
  const sources = roundSources([
    word("a", { lessonTitle: "Too Slow" }),
    word("b", { lessonTitle: "The Quiet Neighbor", source: "passage" }),
    word("c", { lessonTitle: "The Quiet Neighbor", source: "passage" }),
    word("d", { lessonTitle: null, source: "star" }),
  ]);
  assert.deepEqual(sources, [
    { source: "passage", lessonTitle: "The Quiet Neighbor", count: 2 },
    { source: "star", lessonTitle: null, count: 1 },
    { source: "story", lessonTitle: "Too Slow", count: 1 },
  ]);
});

test("the overview counts every shelf and today's round", () => {
  const states = [...many(22), word("known-1", { strength: 4 }), word("known-2", { strength: 5 })];
  const overview = bankOverview(states, TODAY);
  assert.equal(overview.total, 24);
  assert.equal(overview.stable, 2);
  assert.equal(overview.active, 20);
  assert.equal(overview.waiting, 2);
  assert.equal(overview.today.length, 5);
  assert.equal(overview.nextDueOn, null);
});

test("the last review is the last day a word was answered after the day it was met", () => {
  const overview = bankOverview(
    [
      word("a", { firstSeenOn: "2026-11-01", lastReviewedOn: "2026-11-09" }),
      word("b", { firstSeenOn: "2026-11-10", lastReviewedOn: "2026-11-10" }),
    ],
    TODAY,
  );
  assert.equal(overview.lastReviewedOn, "2026-11-09");
  assert.equal(
    bankOverview([word("b", { firstSeenOn: TODAY, lastReviewedOn: TODAY })], TODAY).lastReviewedOn,
    null,
  );
});

test("with nothing left today the next round is named: tomorrow when a due word is over the day's five, else the earliest due day", () => {
  const overCap = many(8).map((s, i) =>
    i < 5 ? { ...s, lastReviewedOn: TODAY, dueOn: "2026-11-14", strength: 2 } : s,
  );
  assert.equal(bankOverview(overCap, TODAY).nextDueOn, "2026-11-12");
  const later = [word("a", { dueOn: "2026-11-15" }), word("b", { dueOn: "2026-11-13" })];
  assert.equal(bankOverview(later, TODAY).nextDueOn, "2026-11-13");
  assert.equal(bankOverview([word("k", { strength: 4 })], TODAY).nextDueOn, null);
});
