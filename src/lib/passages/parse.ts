import type { PassageQuestion } from "@/lib/passages/types";

/**
 * Reading what is stored as jsonb back into typed values — pure, so it is a
 * unit test and not something to discover on a learner's screen.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Reads a part's questions out of its jsonb column defensively: the column is
 * authored by a script today and could be edited by hand tomorrow, and one
 * malformed question must drop out of the part rather than take the whole
 * passage down. `evidence` of -1 means "no line to point at".
 */
export function parseQuestions(raw: unknown): PassageQuestion[] {
  if (!Array.isArray(raw)) return [];
  const questions: PassageQuestion[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const options = (Array.isArray(item.options) ? item.options : [])
      .filter(isRecord)
      .map((option) => ({ en: asString(option.en), ar: asString(option.ar) }));
    const answer = Number(item.answer);
    const evidence = Number(item.evidence);
    const id = asString(item.id);
    const prompt = asString(item.prompt);
    if (!id || !prompt || options.length < 2) continue;
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) continue;
    questions.push({
      id,
      prompt,
      promptAr: asString(item.prompt_ar),
      options,
      answer,
      evidence: Number.isInteger(evidence) ? evidence : -1,
    });
  }
  return questions;
}
