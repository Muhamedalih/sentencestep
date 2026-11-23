import assert from "node:assert/strict";
import test from "node:test";

import { createDeck, type DropWord } from "@/lib/word-drop/engine";
import { parseDailyScore, isPlausibleDay } from "@/lib/word-drop/scores";
import {
  dailySeed,
  friendSeed,
  hashSeed,
  newToken,
  parseSeed,
  seededRandom,
  utcDay,
} from "@/lib/word-drop/seed";

const NOON = new Date("2026-11-23T12:00:00Z");

test("a seed names its kind, key, level and mode, and anything else is refused", () => {
  assert.deepEqual(parseSeed(dailySeed("2026-11-23", 2)), {
    raw: "d.2026-11-23.2.m",
    kind: "daily",
    key: "2026-11-23",
    level: 2,
    mode: "mid",
  });
  const friend = parseSeed(friendSeed("k7x2p9qa", 1, "easy"));
  assert.equal(friend?.kind, "friend");
  assert.equal(friend?.mode, "easy");
  for (const bad of [
    null,
    7,
    "",
    "x.k7x2p9qa.1.e",
    "c.ab.1.e",
    "c.k7x2p9qa.4.e",
    "c.k7x2p9qa.1.h",
    "d.notaday.1.m",
    "c.K7X2P9QA.1.e",
  ]) {
    assert.equal(parseSeed(bad), null, String(bad));
  }
});

test("a new token is eight base-36 characters and fits a seed", () => {
  const token = newToken();
  assert.match(token, /^[a-z0-9]{8}$/);
  assert.ok(parseSeed(friendSeed(token, 3, "mid")));
});

test("the same seed always gives the same numbers, another seed gives others", () => {
  const a = seededRandom("d.2026-11-23.1.m");
  const b = seededRandom("d.2026-11-23.1.m");
  const c = seededRandom("d.2026-11-24.1.m");
  const first = Array.from({ length: 5 }, () => a());
  assert.deepEqual(
    first,
    Array.from({ length: 5 }, () => b()),
  );
  assert.notDeepEqual(
    first,
    Array.from({ length: 5 }, () => c()),
  );
  for (const value of first) assert.ok(value >= 0 && value < 1);
  assert.notEqual(hashSeed("a"), hashSeed("b"));
});

test("two decks dealt from the same seed give the same order", () => {
  const pool: DropWord[] = ["aunt", "uncle", "cousin", "niece", "nephew", "father"].map((en) => ({
    id: en,
    en,
    meaning: "م",
    sentence: null,
    audioUrl: null,
  }));
  const order = (seed: string) => {
    const deck = createDeck(pool, seededRandom(seed));
    return Array.from({ length: 12 }, () => deck.next().id);
  };
  assert.deepEqual(order("c.k7x2p9qa.1.e"), order("c.k7x2p9qa.1.e"));
});

test("the UTC day of a moment", () => {
  assert.equal(utcDay(new Date("2026-11-23T23:59:59Z")), "2026-11-23");
  assert.equal(utcDay(new Date("2026-11-24T00:00:00Z")), "2026-11-24");
});

test("a score is accepted only for today's day, within one day, and only if it is possible", () => {
  assert.equal(isPlausibleDay("2026-11-23", NOON), true);
  assert.equal(isPlausibleDay("2026-11-22", NOON), true);
  assert.equal(isPlausibleDay("2026-11-24", NOON), true);
  assert.equal(isPlausibleDay("2026-11-20", NOON), false);
  assert.equal(isPlausibleDay("nope", NOON), false);

  const good = { day: "2026-11-23", level: 2, score: 340, accuracy: 94, wpm: 28, words: 21 };
  assert.deepEqual(parseDailyScore(good, NOON), good);
  for (const bad of [
    { ...good, score: 100000 },
    { ...good, score: 31 * 21 },
    { ...good, words: 0 },
    { ...good, accuracy: 101 },
    { ...good, wpm: 301 },
    { ...good, level: 4 },
    { ...good, score: 1.5 },
    { ...good, day: "2026-10-01" },
    null,
    "x",
  ]) {
    assert.equal(parseDailyScore(bad, NOON), null);
  }
  assert.deepEqual(
    parseDailyScore(
      { day: "2026-11-23", level: 1, score: 0, accuracy: 100, wpm: 0, words: 0 },
      NOON,
    ),
    { day: "2026-11-23", level: 1, score: 0, accuracy: 100, wpm: 0, words: 0 },
  );
});
