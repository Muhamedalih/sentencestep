import assert from "node:assert/strict";
import test from "node:test";

import { MAX_POINTS_PER_WORD } from "@/lib/word-drop/scores";
import {
  BASE_GAP_MS,
  CHALLENGE_EVERY,
  CHALLENGE_POINTS,
  FREEZE_SLOW,
  LEVEL_EVERY,
  fallLeft,
  isChallengeTile,
  levelFor,
  tileScaleFor,
  tileSize,
  SPEED_MAX,
  SPEED_MIN,
  accuracyPercent,
  buildPool,
  createDeck,
  isDroppable,
  pickTarget,
  pointsFor,
  shortMeaning,
  speedAfterCorrect,
  spawnGapMs,
  speedAfterMiss,
  wordsPerMinute,
  type DropWord,
} from "@/lib/word-drop/engine";

function word(en: string): DropWord {
  return { id: en, en, meaning: "م", sentence: null, audioUrl: null };
}

test("only lower-case words of 3 to 10 letters can fall", () => {
  assert.equal(isDroppable("aunt"), true);
  assert.equal(isDroppable("be"), false);
  assert.equal(isDroppable("extraordinary"), false);
  assert.equal(isDroppable("ice cream"), false);
  assert.equal(isDroppable("café"), false);
  assert.equal(isDroppable("Aunt"), false);
});

test("the short meaning stops at the first colon, comma or full stop", () => {
  assert.equal(shortMeaning("العمة أو الخالة: أخت والدك أو والدتك."), "العمة أو الخالة");
  assert.equal(shortMeaning("نافذة، فتحة في الجدار"), "نافذة");
  assert.equal(shortMeaning("  بيت  "), "بيت");
  assert.equal(shortMeaning(": فقط"), ": فقط");
  assert.ok(shortMeaning("كلمة طويلة جدا جدا جدا جدا جدا جدا جدا").endsWith("…"));
});

test("speed rises after a correct word, falls after a miss, and stays between its bounds", () => {
  assert.ok(speedAfterCorrect(1) > 1);
  assert.ok(speedAfterMiss(1) < 1);
  let factor = 1;
  for (let i = 0; i < 100; i += 1) factor = speedAfterCorrect(factor);
  assert.equal(factor, SPEED_MAX);
  for (let i = 0; i < 100; i += 1) factor = speedAfterMiss(factor);
  assert.equal(factor, SPEED_MIN);
});

test("points grow with the combo up to ten words", () => {
  assert.equal(pointsFor(0), 10);
  assert.equal(pointsFor(1), 12);
  assert.equal(pointsFor(10), 30);
  assert.equal(pointsFor(50), 30);
});

test("accuracy and speed", () => {
  assert.equal(accuracyPercent(0, 0), 100);
  assert.equal(accuracyPercent(100, 6), 94);
  assert.equal(accuracyPercent(10, 10), 0);
  assert.equal(wordsPerMinute(300, 120), 30);
  // A very short round is measured over at least 15 seconds.
  assert.equal(wordsPerMinute(10, 2), 8);
});

test("the typed letters lock onto the lowest word that starts with them", () => {
  const falling = [
    { en: "house", y: 10 },
    { en: "horse", y: 120 },
    { en: "water", y: 200 },
  ];
  assert.equal(pickTarget("ho", falling)?.en, "horse");
  assert.equal(pickTarget("hou", falling)?.en, "house");
  assert.equal(pickTarget("x", falling), null);
  assert.equal(pickTarget("", falling), null);
});

test("the deck deals every word before repeating and never the same word twice in a row", () => {
  const pool = ["a", "b", "c", "d"].map((x) => word(x.repeat(3)));
  const deck = createDeck(pool, () => 0.5);
  const first = Array.from({ length: 4 }, () => deck.next().id);
  assert.deepEqual([...first].sort(), pool.map((w) => w.id).sort());
  let previous = deck.next().id;
  for (let i = 0; i < 40; i += 1) {
    const current = deck.next().id;
    assert.notEqual(current, previous);
    previous = current;
  }
});

test("a missed word comes back within a few words", () => {
  const pool = ["aaa", "bbb", "ccc", "ddd", "eee", "fff", "ggg", "hhh"].map(word);
  const deck = createDeck(pool, () => 0.3);
  const missed = deck.next();
  deck.requeue(missed, 2);
  const next = [deck.next().id, deck.next().id, deck.next().id];
  assert.ok(next.includes(missed.id));
});

test("an empty pool is refused", () => {
  assert.throws(() => createDeck([]));
});

test("the pool keeps droppable words once each, with their short meaning, sentence and clip", () => {
  const clips = new Map([["aunt", "https://clips.example/aunt.mp3"]]);
  const pool = buildPool(
    [
      { id: "1", targetWord: "aunt", hintAr: "العمة: أخت والدك", sentence: "My ___ is kind" },
      { id: "2", targetWord: "Aunt", hintAr: "العمة", sentence: "Again" },
      { id: "3", targetWord: "ice cream", hintAr: "بوظة", sentence: "x" },
      { id: "4", targetWord: "uncle", hintAr: "", sentence: "x" },
      {
        id: "5",
        targetWord: "cousin",
        hintAr: "ابن العم",
        supportHint: "primo: hijo del tío",
        sentence: "x",
      },
    ],
    clips,
  );
  assert.deepEqual(
    pool.map((w) => w.en),
    ["aunt", "cousin"],
  );
  assert.equal(pool[0]!.meaning, "العمة");
  assert.equal(pool[0]!.sentence, "My aunt is kind");
  assert.equal(pool[0]!.audioUrl, "https://clips.example/aunt.mp3");
  assert.equal(pool[1]!.meaning, "primo");
  assert.equal(pool[1]!.audioUrl, null);
});

test("the pace stays humane: a new word every 4.8 s at the start, never faster than every 2.7 s, and the top speed takes the whole round to reach", () => {
  assert.equal(spawnGapMs(1), BASE_GAP_MS);
  assert.equal(BASE_GAP_MS, 4800);
  assert.ok(spawnGapMs(SPEED_MAX) > 2600);
  let factor = 1;
  let words = 0;
  while (factor < SPEED_MAX) {
    factor = speedAfterCorrect(factor);
    words += 1;
  }
  assert.ok(words >= 35);
  // One miss costs several words of progress.
  assert.ok(speedAfterCorrect(speedAfterMiss(1)) < 1);
});

test("a challenge word pays the server's ceiling and sentences have none", () => {
  assert.equal(CHALLENGE_POINTS, MAX_POINTS_PER_WORD);
  assert.equal(isChallengeTile("easy", CHALLENGE_EVERY - 1), true);
  assert.equal(isChallengeTile("easy", 0), false);
  assert.equal(isChallengeTile("mid", 2 * CHALLENGE_EVERY - 1), true);
  assert.equal(isChallengeTile("sentences", CHALLENGE_EVERY - 1), false);
  // The challenge never pays more than a plain word at the top of a combo.
  assert.equal(pointsFor(99), CHALLENGE_POINTS);
});

test("the level rises every LEVEL_EVERY correct words and a freeze only slows", () => {
  assert.equal(levelFor(0), 1);
  assert.equal(levelFor(LEVEL_EVERY - 1), 1);
  assert.equal(levelFor(LEVEL_EVERY), 2);
  assert.equal(levelFor(3 * LEVEL_EVERY), 4);
  assert.ok(FREEZE_SLOW > 0 && FREEZE_SLOW < 1);
});

test("tiles grow on a laptop-wide field and the bar of a word reads how much fall was left", () => {
  assert.equal(tileScaleFor(360), 1);
  assert.ok(tileScaleFor(800) > 1);
  const phone = tileSize("easy", word("balance"), 800);
  const wide = tileSize("easy", word("balance"), 800, tileScaleFor(800));
  assert.ok(wide.w > phone.w && wide.h > phone.h && wide.font > phone.font);
  assert.equal(fallLeft(100, 0, 400), 0.75);
  assert.equal(fallLeft(400, 0, 400), 0);
  assert.equal(fallLeft(10, 0, 0), 0);
});
