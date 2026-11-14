import type { PassageClosingSeed } from "@/data/passages/types";

/**
 * The full exam of a passage: five questions about the whole text, asked on one
 * screen after the last part, with the complete text beside them. Three are
 * multiple choice and two are true / false. None repeats a part's own question
 * or the closing one (src/lib/passages/exam.ts checks all of this as a test).
 */
export type PassageExamQuestionSeed = PassageClosingSeed;
export type PassageExamSeed = PassageExamQuestionSeed[];

export const TRUE_OPTION = { en: "True", ar: "صح" } as const;
export const FALSE_OPTION = { en: "False", ar: "خطأ" } as const;

/** A multiple-choice question: the prompt in both languages, the index of the right option, then the options as [English, Arabic]. */
export function q(
  en: string,
  ar: string,
  answer: number,
  ...options: [en: string, ar: string][]
): PassageExamQuestionSeed {
  return {
    en,
    ar,
    answer,
    options: options.map(([optionEn, optionAr]) => ({ en: optionEn, ar: optionAr })),
  };
}

/** A true / false question: a statement about the passage, and whether it is true. */
export function tf(en: string, ar: string, truth: boolean): PassageExamQuestionSeed {
  return { en, ar, answer: truth ? 0 : 1, options: [{ ...TRUE_OPTION }, { ...FALSE_OPTION }] };
}
