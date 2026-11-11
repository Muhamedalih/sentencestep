import assert from "node:assert/strict";
import test from "node:test";

import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import {
  CORE_LEVELS,
  CORE_SETS,
  CORE_SET_SIZE,
  coreProgress,
  coreSet,
  coreSetStates,
} from "@/lib/word-bank/core-sets";
import { CORE_WORDS } from "@/lib/word-bank/core-words";
import { blankWord } from "@/lib/word-bank/round";

test("the list has no repeated word and every entry is complete", () => {
  assert.equal(new Set(CORE_WORDS.map((w) => w.word)).size, CORE_WORDS.length);
  for (const entry of CORE_WORDS) {
    assert.equal(entry.word, entry.word.toLowerCase());
    assert.ok(entry.ar.trim().length > 0, `${entry.word} has a meaning`);
    assert.ok(/[؀-ۿ]/.test(entry.ar), `${entry.word} has an Arabic meaning`);
    assert.ok(entry.home.trim().length > 0, `${entry.word} has a home sentence`);
  }
});

test("every word can be tracked and survives the bank normalisation unchanged", () => {
  for (const { word } of CORE_WORDS) {
    assert.ok(word.length >= 2 && word.length <= 60);
    assert.ok(isTrackableWord(word), `${word} is trackable`);
    assert.equal(normalizeMistakeWord(word), word);
  }
});

test("every home sentence holds its word exactly once as a whole word, so it can be asked with a blank", () => {
  for (const { word, home } of CORE_WORDS) {
    assert.notEqual(blankWord(home, word), null, `${word}: ${home}`);
  }
});

test("no two words share a home sentence", () => {
  assert.equal(new Set(CORE_WORDS.map((w) => w.home)).size, CORE_WORDS.length);
});

test("the words fall into sets of eight, the last one holding what is left", () => {
  assert.equal(CORE_SETS.length, Math.ceil(CORE_WORDS.length / CORE_SET_SIZE));
  for (const set of CORE_SETS.slice(0, -1)) assert.equal(set.words.length, CORE_SET_SIZE);
  assert.equal(
    CORE_SETS.reduce((sum, set) => sum + set.words.length, 0),
    CORE_WORDS.length,
  );
  assert.deepEqual(CORE_SETS[0]!.words[0], CORE_WORDS[0]);
  assert.equal(coreSet(1), CORE_SETS[0]);
  assert.equal(coreSet(0), undefined);
  assert.equal(coreSet(CORE_SETS.length + 1), undefined);
  assert.equal(coreSet(2.5), undefined);
});

test("three levels in order, about a third each; the first set of each level is free and no other is", () => {
  const levels = CORE_SETS.map((set) => set.level);
  assert.deepEqual([...levels].sort(), levels);
  for (const level of CORE_LEVELS) assert.ok(levels.filter((l) => l === level).length >= 10);
  const free = CORE_SETS.filter((set) => set.free);
  assert.deepEqual(
    free.map((set) => set.level),
    [...CORE_LEVELS],
  );
  for (const set of free) {
    const before = CORE_SETS[set.n - 2];
    assert.ok(!before || before.level !== set.level, "a free set opens its level");
  }
});

test("progress counts a core word as in the bank whichever way it got there, and names the set to carry on with", () => {
  const first = CORE_SETS[0]!.words.map((w) => ({ word: w.word }));
  const some = CORE_SETS[1]!.words.slice(0, 3).map((w) => ({ word: w.word }));
  const progress = coreProgress([...first, ...some, { word: "notacoreword" }]);
  assert.equal(progress.inBank, CORE_SET_SIZE + 3);
  assert.equal(progress.total, CORE_WORDS.length);
  assert.equal(progress.sets[0]!.inBank, CORE_SET_SIZE);
  assert.equal(progress.sets[1]!.inBank, 3);
  assert.equal(progress.currentN, 2);
  assert.equal(coreProgress([]).currentN, 1);
  assert.equal(coreProgress(CORE_WORDS.map((w) => ({ word: w.word }))).currentN, null);
});

test("a set's words are handed to the round builder as new words filed under the set", () => {
  const states = coreSetStates(CORE_SETS[2]!, "2026-11-12");
  assert.equal(states.length, CORE_SET_SIZE);
  for (const [index, state] of states.entries()) {
    const word = CORE_SETS[2]!.words[index]!;
    assert.equal(state.word, word.word);
    assert.equal(state.strength, 0);
    assert.equal(state.source, "core");
    assert.equal(state.lessonId, "core-3");
    assert.equal(state.lessonTitle, "Core words 3");
    assert.equal(state.ar, word.ar);
    assert.equal(state.homeSentence, word.home);
    assert.equal(state.firstSeenOn, "2026-11-12");
  }
});
