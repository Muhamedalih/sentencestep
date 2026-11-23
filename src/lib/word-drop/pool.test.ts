import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_POOL,
  MAX_ROUND_WORDS,
  buildPersonalPool,
  createDeck,
  findSpot,
  mergePools,
  orderGroupsForLevel,
  pointsForText,
  sentenceForDrop,
  tileSize,
  wordCountOf,
  type DropWord,
  type Placed,
} from "@/lib/word-drop/engine";
import { seededRandom } from "@/lib/word-drop/seed";

function word(en: string): DropWord {
  return { id: en, en, meaning: "م", sentence: null, audioUrl: null };
}

test("a sentence falls only as 3 to 6 plain words, with its punctuation dropped", () => {
  assert.equal(sentenceForDrop("My aunt is a nurse."), "my aunt is a nurse");
  assert.equal(sentenceForDrop("Where is the bank?"), "where is the bank");
  assert.equal(sentenceForDrop("Hello there!"), null);
  assert.equal(sentenceForDrop("It is far, but nice"), "it is far but nice");
  assert.equal(sentenceForDrop("I don't know"), null);
  assert.equal(sentenceForDrop("She has 3 cats"), null);
  assert.equal(sentenceForDrop("One two three four five six seven"), null);
  assert.equal(sentenceForDrop("An extraordinarily comprehensive international agreement"), null);
});

test("a sentence earns the word's points plus six for each extra word", () => {
  assert.equal(wordCountOf("my aunt is kind"), 4);
  assert.equal(wordCountOf("aunt"), 1);
  assert.equal(pointsForText(0, 1), 10);
  assert.equal(pointsForText(3, 4), 16 + 18);
});

test("groups are drawn own level first, then below (nearest first), then above, each by its order", () => {
  const groups = [
    { id: "a3", level: 3, order: 1 },
    { id: "a1", level: 1, order: 2 },
    { id: "b1", level: 1, order: 1 },
    { id: "a2", level: 2, order: 5 },
    { id: "b2", level: 2, order: 3 },
  ];
  assert.deepEqual(
    orderGroupsForLevel(groups, 2).map((g) => g.id),
    ["b2", "a2", "b1", "a1", "a3"],
  );
  assert.deepEqual(
    orderGroupsForLevel(groups, 1).map((g) => g.id),
    ["b1", "a1", "b2", "a2", "a3"],
  );
  // The order does not depend on the order the groups arrive in.
  assert.deepEqual(
    orderGroupsForLevel([...groups].reverse(), 2).map((g) => g.id),
    ["b2", "a2", "b1", "a1", "a3"],
  );
});

test("the learner's own words become a pool of droppable words with a meaning, once each", () => {
  const pool = buildPersonalPool(
    [
      { word: "Aunt", ar: "العمة: أخت الأب", homeSentence: "My aunt is kind." },
      { word: "aunt", ar: "تكرار", homeSentence: null },
      { word: "ice cream", ar: "بوظة", homeSentence: null },
      { word: "tree", ar: "", homeSentence: null },
      { word: "river", ar: "نهر", homeSentence: "She sat by the lake." },
    ],
    new Map([["river", "https://clips.example/river.mp3"]]),
  );
  assert.deepEqual(
    pool.map((entry) => entry.en),
    ["aunt", "river"],
  );
  assert.equal(pool[0]!.id, "bank:aunt");
  assert.equal(pool[0]!.sentence, "My aunt is kind.");
  assert.equal(pool[1]!.sentence, null);
  assert.equal(pool[1]!.audioUrl, "https://clips.example/river.mp3");
});

test("a merged pool puts the learner's words first and leaves out the level's repeats", () => {
  const merged = mergePools([word("river"), word("aunt")], [word("aunt"), word("bank")]);
  assert.deepEqual(
    merged.map((entry) => entry.en),
    ["river", "aunt", "bank"],
  );
  const many = Array.from({ length: 100 }, (_, i) => word(`w${i}xyz`));
  assert.equal(mergePools([], many).length, MAX_POOL);
});

test("a deck deals the priority words first, then the rest, and peek names the next word without taking it", () => {
  const pool = ["aaa", "bbb", "ccc", "ddd", "eee", "fff"].map(word);
  const deck = createDeck(pool, seededRandom("p"), new Set(["ddd", "fff"]));
  const first = deck.peek();
  assert.equal(deck.peek().id, first.id);
  const dealt = Array.from({ length: 6 }, () => deck.next().id);
  assert.equal(dealt[0], first.id);
  assert.deepEqual(new Set(dealt.slice(0, 2)), new Set(["ddd", "fff"]));
  assert.equal(new Set(dealt).size, 6);
  // After the pool runs out it starts again, and the same word never comes twice in a row.
  let previous = dealt[5];
  for (let i = 0; i < 30; i += 1) {
    const next = deck.next().id;
    assert.notEqual(next, previous);
    previous = next;
  }
});

test("two decks with the same seed and the same priority deal the same words", () => {
  const pool = Array.from({ length: 12 }, (_, i) => word(`word${i}`));
  const a = createDeck(pool, seededRandom("x"), new Set(["word3"]));
  const b = createDeck(pool, seededRandom("x"), new Set(["word3"]));
  for (let i = 0; i < 30; i += 1) assert.equal(a.next().id, b.next().id);
});

test("a tile's size fits its text and the field, and a sentence tile is taller", () => {
  const long: DropWord = { ...word("extraordi"), meaning: "كلمة قصيرة" };
  const easy = tileSize("easy", long, 360);
  assert.ok(easy.w >= 96 && easy.w <= 352);
  assert.equal(easy.h, 74);
  const narrow = tileSize("easy", long, 150);
  assert.ok(narrow.w <= 142);
  const sentence = tileSize("sentences", word("my aunt is a nurse"), 360);
  assert.ok(sentence.h > easy.h);
  assert.ok(sentence.w <= 300);
});

test("a new tile is never placed on a tile near the top, and waits when there is no room", () => {
  const rand = seededRandom("spot");
  const tile = { w: 120, h: 74 };
  // Free field: any place inside it.
  const alone = findSpot({ fieldWidth: 360, tile, others: [], rand });
  assert.ok(alone !== null && alone >= 0 && alone <= 240);
  // A tile filling the left 130 px at the top: the new one must sit at 138 or further right.
  const blocker: Placed = { x: 0, y: 0, w: 130, h: 74 };
  for (let i = 0; i < 50; i += 1) {
    const x = findSpot({ fieldWidth: 360, tile, others: [blocker], rand });
    assert.ok(x !== null && x >= 138, `x=${x}`);
  }
  // A tile that has already fallen well clear of the top does not matter.
  const low: Placed = { x: 100, y: 200, w: 200, h: 74 };
  assert.notEqual(findSpot({ fieldWidth: 360, tile, others: [low], rand }), null);
  // A tile spanning the width at the top leaves no room: the game waits.
  const wide: Placed = { x: 0, y: 10, w: 352, h: 74 };
  assert.equal(findSpot({ fieldWidth: 360, tile, others: [wide], rand }), null);
});

test("tiles that start apart on a narrow field never overlap while they fall at one speed", () => {
  const rand = seededRandom("sim");
  const fieldWidth = 300;
  const live: Placed[] = [];
  const speed = 60; // px per second, the same for every tile
  let overlaps = 0;
  let placed = 0;
  for (let t = 0; t < 120 * 20; t += 1) {
    for (const tile of live) tile.y += speed / 20;
    if (t % 15 === 0 && live.length < 4) {
      const size = { w: 96 + Math.floor(rand() * 120), h: 74 };
      const x = findSpot({ fieldWidth, tile: size, others: live, rand });
      if (x !== null) {
        live.push({ x, y: -10, ...size });
        placed += 1;
      }
    }
    for (let i = 0; i < live.length; i += 1) {
      for (let j = i + 1; j < live.length; j += 1) {
        const a = live[i]!;
        const b = live[j]!;
        const across = a.x < b.x + b.w && b.x < a.x + a.w;
        const down = a.y < b.y + b.h && b.y < a.y + a.h;
        if (across && down) overlaps += 1;
      }
    }
    while (live.length > 0 && live[0]!.y > 500) live.shift();
  }
  assert.ok(placed > 20);
  assert.equal(overlaps, 0);
});

test("a round cannot hold more words than the quickest pace allows", () => {
  assert.ok(MAX_ROUND_WORDS >= 45 && MAX_ROUND_WORDS <= 60);
});
