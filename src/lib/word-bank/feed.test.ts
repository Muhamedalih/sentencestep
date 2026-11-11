import assert from "node:assert/strict";
import test from "node:test";

import { storyBankAnswers } from "@/lib/word-bank/feed";
import { parseBankWordInput } from "@/lib/word-bank/types";

const story = {
  lessonId: "story-139",
  title: "Too Slow",
  vocabulary: [
    { id: "story-139-vocab-hurry", en: "hurry", ar: "يستعجل" },
    { id: "story-139-vocab-late", en: "late", ar: "متأخر" },
    { id: "story-139-vocab-bus", en: "bus", ar: "bus" },
  ],
  sentences: [{ en: "We have to hurry, Sam." }, { en: "I am late again." }],
};

test("each finished target word is one answer: first try = clean, after a miss = missed", () => {
  const answers = storyBankAnswers({
    ...story,
    outcomes: { "story-139-vocab-hurry": "first", "story-139-vocab-late": "retried" },
    locale: "ar",
  });
  assert.deepEqual(answers, [
    {
      word: "hurry",
      outcome: "clean",
      source: "story",
      lessonId: "story-139",
      lessonTitle: "Too Slow",
      ar: "يستعجل",
      homeSentence: "We have to hurry, Sam.",
    },
    {
      word: "late",
      outcome: "missed",
      source: "story",
      lessonId: "story-139",
      lessonTitle: "Too Slow",
      ar: "متأخر",
      homeSentence: "I am late again.",
    },
  ]);
});

test("a word the learner has not finished is left out", () => {
  assert.deepEqual(storyBankAnswers({ ...story, outcomes: {}, locale: "ar" }), []);
});

test("a meaning that is only the English word again, and a word in no sentence, are recorded without them", () => {
  const [answer] = storyBankAnswers({
    ...story,
    outcomes: { "story-139-vocab-bus": "first" },
    locale: "ar",
  });
  assert.equal(answer?.ar, undefined);
  assert.equal(answer?.homeSentence, undefined);
});

test("every answer passes the Server Action's own validation once the day is added", () => {
  const answers = storyBankAnswers({
    ...story,
    outcomes: { "story-139-vocab-hurry": "first", "story-139-vocab-late": "retried" },
    locale: "ar",
  });
  for (const answer of answers) {
    const parsed = parseBankWordInput({ ...answer, todayISO: "2026-11-11" });
    assert.equal(parsed?.word, answer.word);
    assert.equal(parsed?.source, "story");
  }
});
