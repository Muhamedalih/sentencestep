import assert from "node:assert/strict";
import test from "node:test";

import type { SentenceCandidate } from "@/lib/sentence-bank/select";
import { selectWeeklyCheck } from "@/lib/sentence-bank/weekly";
import { targetSentenceIds, weeklyFocusIds } from "@/lib/sentence-bank/weekly-targets";

const TODAY = "2025-06-10";

function story(lessonId: string, lines: string[], completedOn = "2025-06-08"): SentenceCandidate[] {
  return lines.map((en, orderIndex) => ({
    id: `${lessonId}-${orderIndex}`,
    lessonId,
    orderIndex,
    en,
    completedOn,
  }));
}

const BALLOON = story("story-79", [
  "Mia holds a red balloon",
  "The wind pulls it up",
  "Oh no, it begins to fly",
  "The balloon is high above the park",
  "Mia waves goodbye with a smile",
]);

test("a target word gives the first sentence that holds it, in story order", () => {
  assert.deepEqual(targetSentenceIds(["balloon", "fly"], BALLOON), ["story-79-0", "story-79-2"]);
});

test("words are found as the text spells them: capitals and punctuation round them do not matter", () => {
  const lines = story("s", ["She will Fly, soon, over the sea", "What a big blue Balloon!"]);
  assert.deepEqual(targetSentenceIds(["fly"], lines), ["s-0"]);
  assert.deepEqual(targetSentenceIds(["BALLOON"], lines), ["s-1"]);
});

test("two words in one sentence need one question, and a word is never found inside another word", () => {
  const lines = story("s", ["The rain makes everyone wait", "We wait for the bus again"]);
  assert.deepEqual(targetSentenceIds(["rain", "wait"], lines), ["s-0"]);
  // "air" is not "fair" or "chair": whole words only.
  assert.deepEqual(targetSentenceIds(["air"], story("s", ["A fair chair stood there today"])), []);
});

test("a sentence too short to be asked is skipped for a later one that holds the word", () => {
  const lines = story("s", ["Rain!", "Rain fell on the old roof"]);
  assert.deepEqual(targetSentenceIds(["rain"], lines), ["s-1"]);
});

test("a word that is nowhere to be found, or only in a short line, gives nothing", () => {
  assert.deepEqual(targetSentenceIds(["umbrella"], BALLOON), []);
  assert.deepEqual(targetSentenceIds(["rain"], story("s", ["Rain!"])), []);
  assert.deepEqual(targetSentenceIds([], BALLOON), []);
});

test("the same lines in any order give the same sentences", () => {
  assert.deepEqual(
    targetSentenceIds(["balloon", "fly"], [...BALLOON].reverse()),
    targetSentenceIds(["balloon", "fly"], BALLOON),
  );
});

test("each story gives its target-word sentences, and a story with none on record gives all of its own", () => {
  const plain = story("story-1", ["He walks to the old park", "She plays with a red ball"]);
  const focus = weeklyFocusIds([...BALLOON, ...plain], new Map([["story-79", ["balloon", "fly"]]]));
  assert.deepEqual([...focus].sort(), ["story-1-0", "story-1-1", "story-79-0", "story-79-2"]);
});

test("a story whose words cannot be found falls back to all its sentences instead of dropping out", () => {
  const focus = weeklyFocusIds(BALLOON, new Map([["story-79", ["umbrella"]]]));
  assert.equal(focus.size, BALLOON.length);
});

test("the week asks only the target-word sentences, one story after another, and never pads", () => {
  const rain = story("story-81", [
    "The rain starts to fall",
    "Tom has no umbrella today",
    "He decides to wait under a tree",
    "A bus stops near the tree",
  ]);
  const phone = story("story-80", [
    "Sam checks his phone again",
    "It drops from his hand",
    "The screen is broken now",
  ]);
  const pool = [...BALLOON, ...rain, ...phone];
  const targets = new Map([
    ["story-79", ["balloon", "fly"]],
    ["story-80", ["phone", "drops"]],
    ["story-81", ["rain", "wait"]],
  ]);
  const { items, written } = selectWeeklyCheck(pool, TODAY, weeklyFocusIds(pool, targets));
  // Six target words, six sentences: nothing else of the stories is asked, and nothing is added to reach eight.
  assert.equal(items.length, 6);
  assert.equal(written, pool.length);
  const asked = new Set(items.map((item) => item.id));
  assert.deepEqual([...asked].sort(), [
    "story-79-0",
    "story-79-2",
    "story-80-0",
    "story-80-1",
    "story-81-0",
    "story-81-2",
  ]);
});

test("more target sentences than the check holds are spread over the stories", () => {
  const stories = ["a", "b", "c", "d"].map((id, index) =>
    story(
      `story-${id}`,
      [
        `One day ${id} finds a lost kite`,
        `Then ${id} runs along the beach`,
        `At last ${id} sits down to rest`,
      ],
      `2025-06-0${8 - index}`,
    ),
  );
  const pool = stories.flat();
  const targets = new Map(
    ["a", "b", "c", "d"].map((id) => [`story-${id}`, ["kite", "beach", "rest"]] as const),
  );
  const { items } = selectWeeklyCheck(pool, TODAY, weeklyFocusIds(pool, targets));
  // 4 stories × 3 sentences = 12 candidates: eight asked plus spares, every story in the first round.
  assert.equal(items.length, 11);
  assert.deepEqual(
    items.slice(0, 4).map((item) => item.lessonId),
    ["story-a", "story-b", "story-c", "story-d"],
  );
});
