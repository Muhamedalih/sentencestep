import { test } from "node:test";
import assert from "node:assert/strict";

import { buildStoryWordQuiz, MAX_QUESTIONS_PER_STORY, QUIZ_OPTION_COUNT } from "./story-word-quiz";
import type { Lesson } from "@/types/content";

function lesson(
  id: string,
  sentences: string[],
  vocabulary: { en: string; ar: string }[],
): Pick<Lesson, "id" | "sentences" | "vocabulary"> {
  return {
    id,
    sentences: sentences.map((en, i) => ({ id: `${id}-s${i + 1}`, en, ar: en })),
    vocabulary: vocabulary.map(({ en, ar }) => ({ id: `${id}-vocab-${en}`, en, ar })),
  };
}

const isVerbLike = (ar: string) => ar.startsWith("ي") && ar.length > 2;

test("buildStoryWordQuiz: one question per target word, with distinct options that include the right gloss", () => {
  const quiz = buildStoryWordQuiz(
    lesson(
      "story-82",
      ["Sam wants to try.", "He may fall down."],
      [
        { en: "fall", ar: "يسقط" },
        { en: "try", ar: "يحاول" },
      ],
    ),
  );

  assert.equal(quiz.length, 2);
  for (const question of quiz) {
    assert.equal(question.options.length, QUIZ_OPTION_COUNT);
    assert.equal(new Set(question.options).size, QUIZ_OPTION_COUNT, "options must all differ");
  }
  // Asked in the order the story reaches them: "try" comes up before "fall".
  assert.deepEqual(
    quiz.map((question) => question.options[question.answerIndex]),
    ["يحاول", "يسقط"],
  );
});

test("buildStoryWordQuiz: a gloss shared with another curated word is never a second right answer", () => {
  // "drops" (story-80) and "fall" (story-82) are both يسقط in the curated catalog.
  const quiz = buildStoryWordQuiz(
    lesson("story-82", ["He may fall."], [{ en: "fall", ar: "يسقط" }]),
  );
  assert.equal(quiz[0]!.options.filter((option) => option === "يسقط").length, 1);
});

test("buildStoryWordQuiz: no wrong answer is a near-synonym of the right one", () => {
  // "homesick" (story-120) is "حنين للوطن" in the curated catalog — it must never sit beside "حنين".
  const [question] = buildStoryWordQuiz(
    lesson("story-120", ["He feels nostalgic."], [{ en: "nostalgic", ar: "حنين" }]),
  );
  const wrong = question!.options.filter((_, index) => index !== question!.answerIndex);
  assert.ok(wrong.every((option) => !option.split(/\s+/).includes("حنين")));
});

test("buildStoryWordQuiz: same input, same quiz", () => {
  const input = lesson("story-99", ["A key opens it."], [{ en: "key", ar: "مفتاح" }]);
  assert.deepEqual(buildStoryWordQuiz(input), buildStoryWordQuiz(input));
});

test("buildStoryWordQuiz: asked after the first sentence that holds the word, matching case and punctuation", () => {
  const quiz = buildStoryWordQuiz(
    lesson(
      "story-83",
      ["The gate is open.", "A dog runs to the Gate!", "The gate closes."],
      [{ en: "gate", ar: "بوابة" }],
    ),
  );
  assert.equal(quiz.length, 1);
  assert.equal(quiz[0]!.sentenceId, "story-83-s1");
});

test("buildStoryWordQuiz: skips words that are not in the story or have no usable gloss, and asks a repeat once", () => {
  const quiz = buildStoryWordQuiz(
    lesson(
      "story-84",
      ["The cake is ready."],
      [
        { en: "cake", ar: "كيكة" },
        { en: "Cake", ar: "كعكة" },
        { en: "oven", ar: "فرن" },
        { en: "ready", ar: "" },
        { en: "the", ar: "the" },
      ],
    ),
  );
  assert.deepEqual(
    quiz.map((question) => question.word),
    ["cake"],
  );
});

test("buildStoryWordQuiz: a verb is offered other verbs, a noun other nouns", () => {
  const [verb] = buildStoryWordQuiz(
    lesson("story-82", ["Sam wants to try."], [{ en: "try", ar: "يحاول" }]),
  );
  const [noun] = buildStoryWordQuiz(
    lesson("story-83", ["The dog sleeps."], [{ en: "dog", ar: "كلب" }]),
  );

  assert.ok(verb!.options.every(isVerbLike), "every option of a verb question is verb-like");
  assert.ok(
    noun!.options.every((option) => !isVerbLike(option)),
    "no option of a noun question is verb-like",
  );
});

test("buildStoryWordQuiz: a story with no vocabulary, or an id outside the curated catalog, still works", () => {
  assert.deepEqual(buildStoryWordQuiz({ id: "story-3", sentences: [], vocabulary: undefined }), []);

  const [question] = buildStoryWordQuiz(
    lesson("3f0c9a52-uuid", ["A balloon can fly."], [{ en: "balloon", ar: "بالون" }]),
  );
  assert.equal(question!.options.length, QUIZ_OPTION_COUNT);
  assert.equal(question!.options[question!.answerIndex], "بالون");
});

test("buildStoryWordQuiz: asks about the best few words at most, in the order they come up in the story", () => {
  const quiz = buildStoryWordQuiz(
    lesson(
      "story-1",
      [
        "A loud bump woke her.",
        "She opened the door.",
        "A woman carried boxes.",
        "Then they talked.",
      ],
      [
        { en: "boxes", ar: "صناديق" },
        { en: "loud", ar: "عالٍ" },
        { en: "woman", ar: "امرأة" },
        { en: "door", ar: "باب" },
        { en: "talked", ar: "تحدثا" },
      ],
    ),
  );

  assert.equal(quiz.length, MAX_QUESTIONS_PER_STORY);
  // The first three of the list (boxes, loud, woman), asked as the story reaches them.
  assert.deepEqual(
    quiz.map((question) => question.word),
    ["loud", "boxes", "woman"],
  );
});
