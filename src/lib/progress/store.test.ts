import { afterEach, beforeEach, test } from "node:test";
import assert from "node:assert/strict";

import {
  clearProgress,
  readProgress,
  recordCompletion,
  setCountry,
  setStartingLevel,
} from "./store";
import { emptyProgressState } from "./types";

/** Just enough of window.localStorage for store.ts — a plain Map behind the same four calls. */
function installFakeStorage(): Map<string, string> {
  const data = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
  Object.defineProperty(globalThis, "window", { value: { localStorage }, configurable: true });
  return data;
}

beforeEach(() => {
  installFakeStorage();
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
});

test("a copy read before the level was chosen cannot erase it when the country is saved", () => {
  // The first-run steps each call useProgress(), so each holds its own copy, read when the page
  // loaded — before the visitor had chosen anything.
  const levelStepCopy = readProgress();
  const countryStepCopy = readProgress();

  setStartingLevel(levelStepCopy, 2);
  setCountry(countryStepCopy, "iq");

  const saved = readProgress();
  assert.equal(saved.startingLevel, 2);
  assert.equal(saved.country, "iq");
});

test("a copy read before the country was chosen cannot erase it when the level is saved", () => {
  const levelStepCopy = readProgress();
  const countryStepCopy = readProgress();

  setCountry(countryStepCopy, "ma");
  setStartingLevel(levelStepCopy, 3);

  const saved = readProgress();
  assert.equal(saved.startingLevel, 3);
  assert.equal(saved.country, "ma");
});

test("a lesson completed from an older copy keeps the level and country chosen since", () => {
  const lessonCopy = readProgress();
  setStartingLevel(lessonCopy, 2);
  setCountry(readProgress(), "eg");

  recordCompletion(lessonCopy, "normal", "normal-1", 1, 5);

  const saved = readProgress();
  assert.equal(saved.startingLevel, 2);
  assert.equal(saved.country, "eg");
  assert.deepEqual(
    saved.completions.map((entry) => entry.lessonId),
    ["normal-1"],
  );
});

test("a completion saved from an older copy does not drop one saved in between", () => {
  const first = readProgress();
  const second = readProgress();

  recordCompletion(first, "normal", "normal-1", 1, 5);
  recordCompletion(second, "normal", "normal-2", 1, 5);

  const saved = readProgress();
  assert.deepEqual(saved.completions.map((entry) => entry.lessonId).sort(), [
    "normal-1",
    "normal-2",
  ]);
});

test("the returned state carries the merged values, not the stale copy's", () => {
  const stale = readProgress();
  setStartingLevel(stale, 2);

  const next = setCountry(stale, "iq");

  assert.equal(next.startingLevel, 2);
  assert.equal(next.country, "iq");
});

test("with nothing stored the caller's own copy is still the base", () => {
  const next = setStartingLevel({ ...emptyProgressState, xp: 40 }, 1);

  assert.equal(next.xp, 40);
  assert.equal(next.startingLevel, 1);
  assert.equal(readProgress().startingLevel, 1);
});

test("after clearProgress the next write starts from the caller's copy", () => {
  setStartingLevel(readProgress(), 3);
  clearProgress();

  setCountry(readProgress(), "iq");

  const saved = readProgress();
  assert.equal(saved.startingLevel, null);
  assert.equal(saved.country, "iq");
});
