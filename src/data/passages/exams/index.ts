import { A1_EXAMS } from "@/data/passages/exams/a1";
import { A2_EXAMS } from "@/data/passages/exams/a2";
import { B1_EXAMS } from "@/data/passages/exams/b1";
import { B2_EXAMS } from "@/data/passages/exams/b2";
import type { PassageExamSeed } from "@/data/passages/exams/helpers";

/** Every authored full exam, by passage slug. A passage without one simply has no exam step. */
export const PASSAGE_EXAMS: Record<string, PassageExamSeed> = {
  ...A1_EXAMS,
  ...A2_EXAMS,
  ...B1_EXAMS,
  ...B2_EXAMS,
};

export type { PassageExamQuestionSeed, PassageExamSeed } from "@/data/passages/exams/helpers";
