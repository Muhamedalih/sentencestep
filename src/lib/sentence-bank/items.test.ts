import assert from "node:assert/strict";
import test from "node:test";

import { buildTodayItems } from "@/lib/sentence-bank/items";
import type { TodayLine } from "@/lib/sentence-bank/today-exam";

function line(id: string, en: string, source: TodayLine["source"] = "story"): TodayLine {
  return { id, lessonId: `lesson-${source}`, source, orderIndex: 1, en };
}

test("every line is asked heard and typed whole, from its clip, whatever it is", () => {
  const items = buildTodayItems({
    lines: [line("a", "She bought a red car"), line("b", "He walks to the park daily", "passage")],
    prompts: new Map([["a", "اشترت سيارة حمراء"]]),
    clips: new Map([
      ["a", "https://clips/a.mp3"],
      ["b", "https://clips/b.mp3"],
    ]),
  });
  assert.deepEqual(
    items.map((item) => [item.id, item.form, item.reason, item.strength]),
    [
      ["a", "audio", "today", 0],
      ["b", "audio", "today", 0],
    ],
  );
  // Never the fill-in-a-word form: nothing is hidden, the whole sentence is typed.
  assert.deepEqual(
    items.map((item) => item.masked),
    [[], []],
  );
  assert.equal(items[0]!.audioUrl, "https://clips/a.mp3");
});

test("a story's sentence reaches the schedule, a passage line only counts for the day", () => {
  const items = buildTodayItems({
    lines: [line("a", "She bought a red car"), line("b", "He walks to the park daily", "passage")],
    prompts: new Map(),
    clips: new Map([
      ["a", "https://clips/a.mp3"],
      ["b", "https://clips/b.mp3"],
    ]),
  });
  assert.deepEqual(
    items.map((item) => [item.id, item.source]),
    [
      ["a", "sentence"],
      ["b", "passage"],
    ],
  );
});

test("a line with no stored clip is not asked at all: the test always has its sound", () => {
  const items = buildTodayItems({
    lines: [
      line("a", "She bought a red car"),
      line("b", "They played chess all evening"),
      line("c", "He walks to the park daily", "passage"),
    ],
    prompts: new Map([
      ["a", "اشترت سيارة حمراء"],
      ["b", "لعبوا الشطرنج طوال المساء"],
    ]),
    clips: new Map([["c", "https://clips/c.mp3"]]),
  });
  assert.deepEqual(
    items.map((item) => item.id),
    ["c"],
  );
});

test("the meaning travels with the line when there is one, and a meaning that is just the English again is none", () => {
  const items = buildTodayItems({
    lines: [
      line("a", "She bought a red car"),
      line("b", "They played chess all evening"),
      line("c", "He walks to the park daily"),
    ],
    prompts: new Map([
      ["a", "اشترت سيارة حمراء"],
      ["b", "They played chess all evening"],
    ]),
    clips: new Map([
      ["a", "https://clips/a.mp3"],
      ["b", "https://clips/b.mp3"],
      ["c", "https://clips/c.mp3"],
    ]),
  });
  assert.deepEqual(
    items.map((item) => item.prompt),
    ["اشترت سيارة حمراء", null, null],
  );
});

test("the lines keep the order they came in", () => {
  const items = buildTodayItems({
    lines: [line("z", "She bought a red car"), line("m", "He walks to the park daily")],
    prompts: new Map(),
    clips: new Map([
      ["z", "https://clips/z.mp3"],
      ["m", "https://clips/m.mp3"],
    ]),
  });
  assert.deepEqual(
    items.map((item) => item.id),
    ["z", "m"],
  );
});
