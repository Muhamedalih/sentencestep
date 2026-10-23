import assert from "node:assert/strict";
import test from "node:test";

import {
  LINES_READ_PER_LESSON,
  interleaveToday,
  poolForToday,
  questionsReadyToday,
} from "@/lib/sentence-bank/today-exam";
import type { TodayLine } from "@/lib/sentence-bank/today-exam";

const DAY = "2025-06-10";

function line(
  id: string,
  lessonId: string,
  source: TodayLine["source"],
  orderIndex: number,
  en = `This is the sentence number ${id} today`,
): TodayLine {
  return { id, lessonId, source, orderIndex, en };
}

/** Ten lines of one lesson, each long enough to be asked. */
function lesson(lessonId: string, source: TodayLine["source"], count = 10): TodayLine[] {
  return Array.from({ length: count }, (_unused, position) =>
    line(`${lessonId}-l${position}`, lessonId, source, position),
  );
}

test("a line of fewer than four words is not worth a question", () => {
  const pool = poolForToday(
    [
      line("a", "story", "story", 0, "Hi, Tom!"),
      line("b", "story", "story", 1, "Yes, I did."),
      line("c", "story", "story", 2, "She bought a red car"),
    ],
    DAY,
  );
  assert.deepEqual(
    pool.map((entry) => entry.id),
    ["c"],
  );
});

test("each line is read once, and a line a passage repeats word for word is one question", () => {
  const pool = poolForToday(
    [
      line("a", "passage", "passage", 0, "Did you eat yet today"),
      line("a", "passage", "passage", 0, "Did you eat yet today"),
      line("b", "passage", "passage", 1, "did you  eat yet today"),
      line("c", "passage", "passage", 2, "No, I was too busy"),
    ],
    DAY,
  );
  assert.deepEqual(pool.map((entry) => entry.id).sort(), ["a", "c"]);
});

test("a lesson gives its first few lines in the day's own order, not always its opening ones", () => {
  const lines = lesson("story", "story");
  const pool = poolForToday(lines, DAY);
  assert.equal(pool.length, LINES_READ_PER_LESSON);
  assert.notDeepEqual(
    pool.map((entry) => entry.orderIndex),
    [0, 1, 2, 3, 4, 5],
  );
});

test("the same day gives the same lines whatever order they arrive in, and another day another pick", () => {
  const lines = [...lesson("story", "story"), ...lesson("passage", "passage")];
  const reversed = [...lines].reverse();
  const ids = (entries: TodayLine[]) => entries.map((entry) => entry.id);
  assert.deepEqual(ids(poolForToday(lines, DAY)), ids(poolForToday(reversed, DAY)));
  assert.notDeepEqual(ids(poolForToday(lines, DAY)), ids(poolForToday(lines, "2025-06-11")));
});

test("nothing passed in is changed", () => {
  const lines = lesson("story", "story");
  const before = JSON.stringify(lines);
  poolForToday(lines, DAY);
  assert.equal(JSON.stringify(lines), before);
});

test("the passage and the story are asked in turn, the passage first", () => {
  const passage = lesson("passage", "passage", 4);
  const story = lesson("story", "story", 4);
  const mixed = interleaveToday([...story, ...passage]);
  assert.deepEqual(
    mixed.map((entry) => entry.id),
    ["passage-l0", "story-l0", "passage-l1", "story-l1", "passage-l2", "story-l2"],
  );
});

test("a lesson alone gives its own lines, three at most", () => {
  const mixed = interleaveToday(lesson("story", "story", 6));
  assert.deepEqual(
    mixed.map((entry) => entry.id),
    ["story-l0", "story-l1", "story-l2"],
  );
});

test("a lesson that has fewer lines gives them and the other carries on", () => {
  const mixed = interleaveToday([
    ...lesson("passage", "passage", 1),
    ...lesson("story", "story", 4),
  ]);
  assert.deepEqual(
    mixed.map((entry) => entry.id),
    ["passage-l0", "story-l0", "story-l1", "story-l2"],
  );
});

test("several lessons of one kind take their turns too, by id", () => {
  const mixed = interleaveToday([
    ...lesson("story-b", "story", 2),
    ...lesson("story-a", "story", 2),
    ...lesson("passage", "passage", 2),
  ]);
  assert.deepEqual(
    mixed.map((entry) => entry.id),
    ["passage-l0", "story-a-l0", "story-b-l0", "passage-l1", "story-a-l1", "story-b-l1"],
  );
});

test("the lines a story gives are counted for the day's row, capped at three a lesson", () => {
  assert.equal(questionsReadyToday([], DAY), 0);
  assert.equal(questionsReadyToday(lesson("story", "story"), DAY), 3);
  assert.equal(
    questionsReadyToday([...lesson("story", "story"), ...lesson("passage", "passage")], DAY),
    6,
  );
  // Lines too short to ask are not ready.
  assert.equal(questionsReadyToday([line("a", "story", "story", 0, "Hi, Tom!")], DAY), 0);
});
