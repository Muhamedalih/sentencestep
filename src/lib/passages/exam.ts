import { FALSE_OPTION, TRUE_OPTION } from "@/data/passages/exams/helpers";
import type { PassageExamSeed } from "@/data/passages/exams/helpers";
import type { PassageSeed } from "@/data/passages/types";
import { checkQuestion } from "@/lib/passages/validate";
import type { PassageQuestion } from "@/lib/passages/types";

/**
 * The full exam of a passage: five new questions about the whole text, asked on
 * one screen after the last part with the complete text beside them. Pure, so
 * the rules below are tests and not something to find on a learner's screen.
 *
 * The questions are authored in the repository (src/data/passages/exams) and
 * read on the server by the passage page, so only the open passage's five
 * questions ever reach a browser, and showing them costs the database nothing.
 */

export const EXAM_QUESTION_COUNT = 5;
export const EXAM_TRUE_FALSE_COUNT = 2;

/** Exam question ids sit beside the parts' own (`<slug>-p1-q1`): `<slug>-x1` … `<slug>-x5`, numbered as authored. */
export function examQuestionIdFor(slug: string, questionNumber: number): string {
  return `${slug}-x${questionNumber}`;
}

/** A true / false question is a question whose two options are exactly "True" and "False". */
export function isTrueFalseQuestion(question: { options: readonly { en: string }[] }): boolean {
  return (
    question.options.length === 2 &&
    question.options[0]?.en === TRUE_OPTION.en &&
    question.options[1]?.en === FALSE_OPTION.en
  );
}

/** A small, stable hash of a string (FNV-1a), the seed of a passage's arrangement. */
function hashOf(text: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** A seeded random number generator (mulberry32): the same seed always gives the same sequence. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other]!, result[index]!];
  }
  return result;
}

/**
 * The exam as a learner meets it. The authored order is rearranged, the same
 * way every time for one passage: the questions are shuffled and the choices of
 * each multiple-choice question are shuffled too (True / False keep their
 * order), so neither where the true / false questions sit nor which choice is
 * right follows a pattern from one passage to the next.
 */
export function arrangedExam(slug: string, exam: PassageExamSeed | undefined): PassageQuestion[] {
  if (!exam || exam.length === 0) return [];
  const random = seededRandom(hashOf(slug));

  const questions = exam.map((question, index) => {
    const base = {
      id: examQuestionIdFor(slug, index + 1),
      prompt: question.en,
      promptAr: question.ar,
      evidence: -1,
    };
    if (isTrueFalseQuestion(question)) {
      return { ...base, options: question.options, answer: question.answer };
    }
    const order = shuffled(
      question.options.map((_, optionIndex) => optionIndex),
      random,
    );
    return {
      ...base,
      options: order.map((optionIndex) => question.options[optionIndex]!),
      answer: order.indexOf(question.answer),
    };
  });

  return shuffled(questions, random);
}

/** What every exam has to be. Returns plain-language problems (empty = valid), like validatePassageSeed. */
export function validatePassageExam(
  seed: PassageSeed,
  exam: PassageExamSeed | undefined,
): string[] {
  const problems: string[] = [];
  const at = (where: string, message: string) => problems.push(`${seed.slug} ${where}: ${message}`);

  if (!exam) {
    at("exam", "the passage has none");
    return problems;
  }
  if (exam.length !== EXAM_QUESTION_COUNT) {
    at("exam", `needs ${EXAM_QUESTION_COUNT} questions, has ${exam.length}`);
  }
  const trueFalse = exam.filter(isTrueFalseQuestion);
  if (trueFalse.length !== EXAM_TRUE_FALSE_COUNT) {
    at("exam", `needs ${EXAM_TRUE_FALSE_COUNT} true / false questions, has ${trueFalse.length}`);
  }

  // New questions only: none may repeat a part's question, the closing one, or another exam question.
  const asked = new Set<string>([
    ...seed.sections.map((section) => section.question.en.trim().toLowerCase()),
    seed.closing.en.trim().toLowerCase(),
  ]);
  const choices = seed.level === "B2" ? 4 : 3;

  exam.forEach((question, index) => {
    const where = `exam question ${index + 1}`;
    checkQuestion(question, where, at);
    const prompt = question.en.trim().toLowerCase();
    if (asked.has(prompt)) at(where, "repeats a question the passage already asks");
    asked.add(prompt);
    if (!isTrueFalseQuestion(question)) {
      if (question.options.length !== choices) {
        at(where, `needs ${choices} choices at ${seed.level}, has ${question.options.length}`);
      }
      if (!/\?$/.test(question.en.trim())) at(where, "a multiple-choice question ends with “?”");
    } else {
      if (!/\.$/.test(question.en.trim()))
        at(where, "a true / false statement ends with a full stop");
      if (
        question.options[0]?.ar !== TRUE_OPTION.ar ||
        question.options[1]?.ar !== FALSE_OPTION.ar
      ) {
        at(where, "true / false options must be the standard pair");
      }
    }
  });

  return problems;
}
