import assert from "node:assert/strict";
import test from "node:test";

import { buildReviewItems } from "@/lib/sentence-bank/items";
import type { ReviewItem, SentenceCandidate } from "@/lib/sentence-bank/select";

function pick(id: string, strength: number, en: string): ReviewItem<SentenceCandidate> {
  return {
    sentence: { id, lessonId: `lesson-${id}`, orderIndex: 1, en, completedOn: "2025-06-01" },
    strength,
    reason: strength === 0 ? "spread" : "due",
  };
}

const WEAK = new Set<string>();

test("each sentence is asked in the form its strength calls for, in the selection's order", () => {
  const selection = [
    pick("a", 0, "She bought a red car"),
    pick("b", 2, "He walks to the park daily"),
    pick("c", 4, "They played chess all evening"),
  ];
  const items = buildReviewItems({
    selection,
    prompts: new Map([
      ["a", "اشترت سيارة حمراء"],
      ["b", "يمشي إلى الحديقة يومياً"],
      ["c", "لعبوا الشطرنج طوال المساء"],
    ]),
    clips: new Map([
      ["a", "https://clips/a.mp3"],
      ["b", "https://clips/b.mp3"],
      ["c", "https://clips/c.mp3"],
    ]),
    weakWords: WEAK,
    limit: 3,
  });
  assert.deepEqual(
    items.map((item) => [item.id, item.form, item.strength]),
    [
      ["a", "partial", 0],
      ["b", "audio", 2],
      ["c", "translate", 4],
    ],
  );
  // Only the partial form hides particular words.
  assert.equal(items[0]!.masked.length, 1);
  assert.deepEqual(items[1]!.masked, []);
  assert.deepEqual(items[2]!.masked, []);
  // A clip travels with every item: the meaning-only form offers it after the answer.
  assert.equal(items[2]!.audioUrl, "https://clips/c.mp3");
});

test("a sentence with no stored clip is asked from its meaning, whatever its strength", () => {
  const [item] = buildReviewItems({
    selection: [pick("a", 0, "She bought a red car")],
    prompts: new Map([["a", "اشترت سيارة حمراء"]]),
    clips: new Map(),
    weakWords: WEAK,
    limit: 3,
  });
  assert.equal(item!.form, "translate");
  assert.equal(item!.audioUrl, null);
  assert.deepEqual(item!.masked, []);
});

test("a sentence with no meaning is asked by sound, and one with neither is left for another day", () => {
  const items = buildReviewItems({
    selection: [
      pick("a", 4, "They played chess all evening"),
      pick("b", 0, "She bought a red car"),
      pick("c", 0, "He walks to the park daily"),
    ],
    prompts: new Map([["c", "يمشي إلى الحديقة يومياً"]]),
    clips: new Map([["a", "https://clips/a.mp3"]]),
    weakWords: WEAK,
    limit: 5,
  });
  assert.deepEqual(
    items.map((item) => [item.id, item.form]),
    [
      ["a", "audio"],
      ["c", "translate"],
    ],
  );
});

test("a meaning that is just the English again is no meaning", () => {
  const items = buildReviewItems({
    selection: [pick("a", 4, "They played chess all evening")],
    prompts: new Map([["a", "They played chess all evening"]]),
    clips: new Map(),
    weakWords: WEAK,
    limit: 3,
  });
  assert.deepEqual(items, []);
});

test("only `limit` come back, and the spare ones behind an unaskable sentence take its place", () => {
  const selection = [
    pick("a", 0, "She bought a red car"),
    pick("b", 0, "He walks to the park daily"),
    pick("c", 0, "They played chess all evening"),
    pick("d", 0, "The doctor called last night"),
  ];
  const prompts = new Map([
    ["a", "أ"],
    ["c", "ج"],
    ["d", "د"],
  ]);
  const items = buildReviewItems({
    selection,
    prompts,
    clips: new Map(),
    weakWords: WEAK,
    limit: 2,
  });
  assert.deepEqual(
    items.map((item) => item.id),
    ["a", "c"],
  );
  assert.deepEqual(
    buildReviewItems({ selection, prompts, clips: new Map(), weakWords: WEAK, limit: 0 }),
    [],
  );
});

test("the learner's weak word is the one the partial form hides", () => {
  const [item] = buildReviewItems({
    selection: [pick("a", 0, "The doctor called last night")],
    prompts: new Map(),
    clips: new Map([["a", "https://clips/a.mp3"]]),
    weakWords: new Set(["doctor"]),
    limit: 1,
  });
  assert.equal(item!.form, "partial");
  assert.deepEqual(item!.masked, [1]);
});
