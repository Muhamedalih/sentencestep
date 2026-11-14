import assert from "node:assert/strict";
import test from "node:test";

import { PASSAGE_SEEDS } from "@/data/passages";
import { PASSAGE_EXAMS } from "@/data/passages/exams";
import { q, tf } from "@/data/passages/exams/helpers";
import {
  EXAM_QUESTION_COUNT,
  arrangedExam,
  examQuestionIdFor,
  isTrueFalseQuestion,
  validatePassageExam,
} from "@/lib/passages/exam";

test("every authored passage has a valid full exam: five new questions, two of them true / false", () => {
  const problems = PASSAGE_SEEDS.flatMap((seed) =>
    validatePassageExam(seed, PASSAGE_EXAMS[seed.slug]),
  );
  assert.deepEqual(problems, []);
});

test("no exam belongs to a passage that does not exist", () => {
  const slugs = new Set(PASSAGE_SEEDS.map((seed) => seed.slug));
  assert.deepEqual(
    Object.keys(PASSAGE_EXAMS).filter((slug) => !slugs.has(slug)),
    [],
  );
});

test("the arranged exam keeps every question and its right answer, the same way on every load", () => {
  for (const seed of PASSAGE_SEEDS) {
    const exam = PASSAGE_EXAMS[seed.slug]!;
    const arranged = arrangedExam(seed.slug, exam);
    assert.equal(arranged.length, EXAM_QUESTION_COUNT);
    assert.deepEqual(arranged, arrangedExam(seed.slug, exam));
    exam.forEach((question, index) => {
      const shown = arranged.find((entry) => entry.id === examQuestionIdFor(seed.slug, index + 1));
      assert.ok(shown, `${seed.slug} question ${index + 1} is missing`);
      assert.equal(shown.prompt, question.en);
      assert.equal(shown.options[shown.answer]?.en, question.options[question.answer]?.en);
      assert.equal(shown.options.length, question.options.length);
      assert.equal(shown.evidence, -1);
    });
  }
});

test("the right choice is spread over every position, and true / false keep their order", () => {
  const positions = new Map<number, number>();
  for (const seed of PASSAGE_SEEDS) {
    for (const question of arrangedExam(seed.slug, PASSAGE_EXAMS[seed.slug])) {
      if (isTrueFalseQuestion(question)) {
        assert.deepEqual(
          question.options.map((option) => option.en),
          ["True", "False"],
        );
      } else {
        positions.set(question.answer, (positions.get(question.answer) ?? 0) + 1);
      }
    }
  }
  const counts = [0, 1, 2].map((position) => positions.get(position) ?? 0);
  const total = counts.reduce((sum, count) => sum + count, 0);
  for (const count of counts) assert.ok(count > total / 5, `uneven spread: ${counts.join(", ")}`);
});

test("a passage without an exam has no exam step", () => {
  assert.deepEqual(arrangedExam("nothing-here", undefined), []);
  assert.deepEqual(arrangedExam("nothing-here", []), []);
});

test("validatePassageExam names what is wrong", () => {
  const seed = PASSAGE_SEEDS[0]!;
  assert.match(validatePassageExam(seed, undefined).join("\n"), /has none/);

  const repeated = [
    q(seed.closing.en, "سؤال؟", 0, ["One", "واحد"], ["Two", "اثنان"], ["Three", "ثلاثة"]),
    tf("A statement.", "جملة.", true),
    tf("Another statement.", "جملة أخرى.", false),
    q("A new question?", "سؤال جديد؟", 0, ["One", "واحد"], ["Two", "اثنان"], ["Three", "ثلاثة"]),
  ];
  const problems = validatePassageExam(seed, repeated).join("\n");
  assert.match(problems, /needs 5 questions, has 4/);
  assert.match(problems, /repeats a question the passage already asks/);

  const noTrueFalse = Array.from({ length: 5 }, (_, index) =>
    q(`Question ${index}?`, "سؤال؟", 0, ["One", "واحد"], ["Two", "اثنان"], ["Three", "ثلاثة"]),
  );
  assert.match(validatePassageExam(seed, noTrueFalse).join("\n"), /needs 2 true \/ false/);
});
