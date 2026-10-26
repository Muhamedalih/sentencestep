import { test } from "node:test";
import assert from "node:assert/strict";

import { BLANK_TOKEN } from "@/types/word-lists";

import {
  answerWord,
  blankSentenceFor,
  findWordInSentences,
  isRunFinished,
  startWordsRun,
  stripWordPunctuation,
  storyWordsStepApplies,
  wordMeaning,
  type StoryWordsStepGate,
} from "./story-words";

const gate = (overrides: Partial<StoryWordsStepGate> = {}): StoryWordsStepGate => ({
  mode: "stories",
  vocabularyCount: 3,
  previewMode: false,
  isOpeningLesson: false,
  todayStep: false,
  usesSessionEnd: false,
  ...overrides,
});

test("storyWordsStepApplies: a story with words, in an ordinary run, asks them", () => {
  assert.equal(storyWordsStepApplies(gate()), true);
});

test("storyWordsStepApplies: never for another section, a story without words, or any screen that owns its ending", () => {
  assert.equal(storyWordsStepApplies(gate({ mode: "normal" })), false);
  assert.equal(storyWordsStepApplies(gate({ mode: "conversation" })), false);
  assert.equal(storyWordsStepApplies(gate({ vocabularyCount: 0 })), false);
  assert.equal(storyWordsStepApplies(gate({ previewMode: true })), false);
  assert.equal(storyWordsStepApplies(gate({ isOpeningLesson: true })), false);
  assert.equal(storyWordsStepApplies(gate({ todayStep: true })), false);
  assert.equal(storyWordsStepApplies(gate({ usesSessionEnd: true })), false);
});

test("stripWordPunctuation: takes the marks off both ends and keeps apostrophes inside", () => {
  assert.equal(stripWordPunctuation("rain,"), "rain");
  assert.equal(stripWordPunctuation("“rain”"), "rain");
  assert.equal(stripWordPunctuation("didn't."), "didn't");
  assert.equal(stripWordPunctuation("—"), "");
});

test("wordMeaning: the word in the learner's language when there is one", () => {
  const rain = { id: "1", en: "rain", ar: "مطر", es: "lluvia", tr: "yağmur" };
  assert.equal(wordMeaning(rain, "ar"), "مطر");
  assert.equal(wordMeaning(rain, "es"), "lluvia");
  assert.equal(wordMeaning(rain, "tr"), "yağmur");
  assert.equal(wordMeaning({ ...rain, supportText: " مطرٌ " }, "ar"), "مطرٌ");
});

test("wordMeaning: nothing when the only text left is the English word itself, which would give the answer away", () => {
  const curated = { id: "1", en: "rain", ar: "مطر" };
  assert.equal(wordMeaning(curated, "es"), null);
  assert.equal(wordMeaning(curated, "tr"), null);
  assert.equal(wordMeaning(curated, null), null);
  assert.equal(wordMeaning({ ...curated, supportText: "Rain" }, "es"), null);
  assert.equal(wordMeaning({ ...curated, supportText: "  " }, "ar"), null);
});

const story = [
  { en: "A rainbow stretched across the sky." },
  { en: "Then the Rain, cold and grey, began to fall." },
  { en: "Nobody wanted to wait in the rain." },
];

test("findWordInSentences: the first sentence holding the whole word, in any case, split around it", () => {
  assert.deepEqual(findWordInSentences("rain", story), {
    prefix: "Then the",
    lead: "",
    word: "Rain",
    tail: ",",
    suffix: "cold and grey, began to fall.",
  });
});

test("findWordInSentences: a word inside a longer word does not count", () => {
  assert.equal(findWordInSentences("rain", [{ en: "The rainbow and the train." }]), null);
});

test("findWordInSentences: null when the word is not there, and empty text is fine", () => {
  assert.equal(findWordInSentences("umbrella", story), null);
  assert.equal(findWordInSentences("rain", []), null);
  assert.equal(findWordInSentences("rain", [{ en: "" }]), null);
});

test("findWordInSentences: punctuation glued in front of the word is kept apart from it", () => {
  const found = findWordInSentences("rain", [{ en: 'He said "rain" twice.' }]);
  assert.equal(found?.lead, '"');
  assert.equal(found?.word, "rain");
  assert.equal(found?.tail, '"');
});

test("blankSentenceFor: one blank where the word was, with the punctuation around it kept", () => {
  assert.equal(
    blankSentenceFor("rain", story),
    `Then the ${BLANK_TOKEN}, cold and grey, began to fall.`,
  );
  assert.equal(
    blankSentenceFor("rain", [{ en: "Nobody wanted to wait in the rain." }]),
    `Nobody wanted to wait in the ${BLANK_TOKEN}.`,
  );
  assert.equal(blankSentenceFor("rain", [{ en: "Rain fell." }]), `${BLANK_TOKEN} fell.`);
  assert.equal(blankSentenceFor("rain", [{ en: "Rain." }]), `${BLANK_TOKEN}.`);
});

test("blankSentenceFor: exactly one blank, even when the word comes up twice in the sentence", () => {
  const blanked = blankSentenceFor("rain", [{ en: "The rain, only rain." }])!;
  assert.equal(blanked.split(BLANK_TOKEN).length - 1, 1);
});

test("blankSentenceFor: null when the word is not in the story", () => {
  assert.equal(blankSentenceFor("umbrella", story), null);
});

test("startWordsRun: the words in order, once each, nothing answered yet", () => {
  const run = startWordsRun(["a", "b", "c", "a"]);
  assert.deepEqual(run.queue, ["a", "b", "c"]);
  assert.deepEqual(run.missed, []);
  assert.deepEqual(run.outcomes, {});
  assert.equal(run.asked, 0);
  assert.equal(isRunFinished(run), false);
  assert.equal(isRunFinished(startWordsRun([])), true);
});

test("answerWord: every word typed right the first time ends as first", () => {
  let run = startWordsRun(["a", "b"]);
  run = answerWord(run, true);
  assert.deepEqual(run.queue, ["b"]);
  assert.deepEqual(run.outcomes, { a: "first" });
  run = answerWord(run, true);
  assert.equal(isRunFinished(run), true);
  assert.deepEqual(run.outcomes, { a: "first", b: "first" });
  assert.equal(run.asked, 2);
});

test("answerWord: a miss sends the word to the back, and typing it right later ends as retried", () => {
  let run = startWordsRun(["a", "b", "c"]);
  run = answerWord(run, false);
  assert.deepEqual(run.queue, ["b", "c", "a"]);
  assert.deepEqual(run.missed, ["a"]);
  assert.deepEqual(run.outcomes, {});
  run = answerWord(run, true);
  run = answerWord(run, true);
  assert.deepEqual(run.queue, ["a"]);
  run = answerWord(run, true);
  assert.equal(isRunFinished(run), true);
  assert.deepEqual(run.outcomes, { b: "first", c: "first", a: "retried" });
  assert.equal(run.asked, 4);
});

test("answerWord: a word missed again and again stays in the run until it is typed right, and is counted once as missed", () => {
  let run = startWordsRun(["a"]);
  run = answerWord(run, false);
  run = answerWord(run, false);
  run = answerWord(run, false);
  assert.deepEqual(run.queue, ["a"]);
  assert.deepEqual(run.missed, ["a"]);
  assert.equal(run.asked, 3);
  assert.equal(isRunFinished(run), false);
  run = answerWord(run, true);
  assert.deepEqual(run.outcomes, { a: "retried" });
  assert.equal(isRunFinished(run), true);
});

test("answerWord: the same word asked twice in a row is told apart by the answer count", () => {
  const first = startWordsRun(["a"]);
  const second = answerWord(first, false);
  assert.equal(second.queue[0], first.queue[0]);
  assert.notEqual(second.asked, first.asked);
});

test("answerWord: an empty run is left as it is, and a run is never changed in place", () => {
  const empty = startWordsRun([]);
  assert.equal(answerWord(empty, true), empty);
  assert.equal(answerWord(empty, false), empty);

  const run = startWordsRun(["a", "b"]);
  const snapshot = JSON.stringify(run);
  answerWord(run, false);
  answerWord(run, true);
  assert.equal(JSON.stringify(run), snapshot);
});
