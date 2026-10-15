import type { PassageSeed } from "@/data/passages/types";
import { questionIdFor } from "@/lib/passages/ids";

/**
 * How an authored passage's questions are stored: the jsonb a part keeps in
 * `passage_sections.questions`, which `parseQuestions` reads back. Pure, so the
 * shape the insert script writes and the shape the reader parses can never
 * drift apart without a test saying so.
 */

export interface StoredQuestion {
  id: string;
  prompt: string;
  prompt_ar: string;
  options: { en: string; ar: string }[];
  answer: number;
  /** The 0-based line of the same part that holds the answer; -1 for "no line to point at". */
  evidence: number;
}

/** A question about the passage as a whole has no line of its own to light up. */
export const NO_EVIDENCE_LINE = -1;

/**
 * The questions kept with one part: its own, and — on the last part only — the
 * passage's closing question, asked right after it as question 2 of 2.
 */
export function storedQuestionsFor(seed: PassageSeed, sectionIndex: number): StoredQuestion[] {
  const section = seed.sections[sectionIndex];
  if (!section) return [];
  const sectionNumber = sectionIndex + 1;

  const questions: StoredQuestion[] = [
    {
      id: questionIdFor(seed.slug, sectionNumber, 1),
      prompt: section.question.en,
      prompt_ar: section.question.ar,
      options: section.question.options,
      answer: section.question.answer,
      evidence: section.question.evidence,
    },
  ];

  if (sectionIndex === seed.sections.length - 1) {
    questions.push({
      id: questionIdFor(seed.slug, sectionNumber, 2),
      prompt: seed.closing.en,
      prompt_ar: seed.closing.ar,
      options: seed.closing.options,
      answer: seed.closing.answer,
      evidence: NO_EVIDENCE_LINE,
    });
  }

  return questions;
}
