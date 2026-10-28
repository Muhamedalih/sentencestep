import { test } from "node:test";
import assert from "node:assert/strict";

import type { LessonUnit } from "@/types/content";

import { levelCodeOf } from "../levels";
import { countDone, pathStations, splitAroundCurrent } from "./path-model";

function lesson(id: string, isFree: boolean): LessonUnit {
  return { id, isFree } as unknown as LessonUnit;
}

const level = [
  lesson("first", true),
  lesson("second", true),
  lesson("third", true),
  lesson("fourth", false),
  lesson("fifth", false),
];

test("pathStations: finished, current, locked and open, in the order given", () => {
  const stations = pathStations(level, ["first"], "second", false);
  assert.deepEqual(
    stations.map((station) => [station.lesson.id, station.state]),
    [
      ["first", "done"],
      ["second", "current"],
      ["third", "open"],
      ["fourth", "locked"],
      ["fifth", "locked"],
    ],
  );
});

test("pathStations: a subscriber sees no locks", () => {
  const stations = pathStations(level, [], "first", true);
  assert.equal(
    stations.some((station) => station.state === "locked"),
    false,
  );
});

test("pathStations: a finished lesson stays finished even when it is past the free ones", () => {
  const stations = pathStations(level, ["fourth"], "first", false);
  assert.equal(stations[3]?.state, "done");
});

test("splitAroundCurrent: the current station sits between what was done and what is next", () => {
  const stations = pathStations(level, ["first"], "second", false);
  const parts = splitAroundCurrent(stations);
  assert.deepEqual(
    parts.before.map((station) => station.lesson.id),
    ["first"],
  );
  assert.equal(parts.current?.lesson.id, "second");
  assert.deepEqual(
    parts.after.map((station) => station.lesson.id),
    ["third", "fourth", "fifth"],
  );
});

test("splitAroundCurrent: with no current station everything is before it", () => {
  const stations = pathStations(level, ["first", "second", "third"], undefined, false);
  const parts = splitAroundCurrent(stations);
  assert.equal(parts.current, undefined);
  assert.equal(parts.before.length, 5);
  assert.equal(parts.after.length, 0);
});

test("countDone counts finished stations only", () => {
  const stations = pathStations(level, ["first", "fourth", "unknown"], "second", false);
  assert.equal(countDone(stations), 2);
});

test("levelCodeOf: the short CEFR code of a course level", () => {
  assert.equal(levelCodeOf("Beginner A1"), "A1");
  assert.equal(levelCodeOf("Beginner — A1"), "A1");
  assert.equal(levelCodeOf("Intermediate A2-B1"), "A2–B1");
  assert.equal(levelCodeOf("Level 7"), "Level 7");
});
