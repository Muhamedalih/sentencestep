import type { PassageSeed } from "@/data/passages/types";
import { validatePassageSeed } from "@/lib/passages/validate";

/**
 * Reading the passage an admin pastes into Admin -> Passages: JSON in the shape
 * the authored passages have (src/data/passages/types.ts). Everything is checked
 * before anything is written — the shape first (so the content rules never meet
 * a number where text belongs), then every rule in validate.ts — and a problem is
 * said in plain words with the place it is in. Pure, so it is a unit test.
 */

const MAX_PROBLEMS = 12;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const isText = (value: unknown): value is string => typeof value === "string";

function shapeProblems(value: unknown): string[] {
  const problems: string[] = [];
  const text = (v: unknown, where: string) => {
    if (!isText(v)) problems.push(`${where} must be text`);
  };
  const list = (v: unknown, where: string): v is unknown[] => {
    if (!Array.isArray(v)) problems.push(`${where} must be a list`);
    return Array.isArray(v);
  };

  if (!isRecord(value)) return ["The JSON must be one passage: an object with a slug, title, …"];

  for (const key of ["slug", "level", "tone", "icon", "title", "titleAr", "summary", "summaryAr"]) {
    text(value[key], key);
  }
  if (!Number.isInteger(value.order)) problems.push("order must be a whole number");

  if (!isRecord(value.cast)) {
    problems.push("cast must be an object: character name → voice");
  } else {
    for (const [name, voice] of Object.entries(value.cast)) text(voice, `cast.${name}`);
  }

  const checkQuestion = (question: unknown, where: string, withEvidence: boolean) => {
    if (!isRecord(question)) {
      problems.push(`${where} must be an object`);
      return;
    }
    text(question.en, `${where}.en`);
    text(question.ar, `${where}.ar`);
    if (!Number.isInteger(question.answer)) problems.push(`${where}.answer must be a whole number`);
    if (withEvidence && !Number.isInteger(question.evidence)) {
      problems.push(`${where}.evidence must be a whole number`);
    }
    if (list(question.options, `${where}.options`)) {
      question.options.forEach((option, index) => {
        if (!isRecord(option)) return problems.push(`${where}.options[${index}] must be an object`);
        text(option.en, `${where}.options[${index}].en`);
        text(option.ar, `${where}.options[${index}].ar`);
      });
    }
  };

  if (list(value.sections, "sections")) {
    value.sections.forEach((section, sectionIndex) => {
      const part = `sections[${sectionIndex}]`;
      if (!isRecord(section)) return problems.push(`${part} must be an object`);
      text(section.title, `${part}.title`);
      text(section.titleAr, `${part}.titleAr`);
      checkQuestion(section.question, `${part}.question`, true);
      if (!list(section.lines, `${part}.lines`)) return;
      section.lines.forEach((line, lineIndex) => {
        const where = `${part}.lines[${lineIndex}]`;
        if (!isRecord(line)) return problems.push(`${where} must be an object`);
        text(line.en, `${where}.en`);
        text(line.ar, `${where}.ar`);
        if (line.who !== undefined) text(line.who, `${where}.who`);
        if (line.say !== undefined) text(line.say, `${where}.say`);
        const pause = line.pause;
        if (pause === undefined || pause === "none") return;
        const hint = isRecord(pause) ? pause : null;
        const placed = hint && (isText(hint.after) || hint.before === true);
        const length =
          hint?.length === undefined || hint?.length === "short" || hint?.length === "long";
        if (!placed || !length) {
          problems.push(
            `${where}.pause must be "none", { "after": "…" } or { "before": true } (with an optional "length": "short" or "long")`,
          );
        }
      });
    });
  }

  checkQuestion(value.closing, "closing", false);

  if (list(value.words, "words")) {
    value.words.forEach((word, index) => {
      if (!isRecord(word)) return problems.push(`words[${index}] must be an object`);
      text(word.word, `words[${index}].word`);
      text(word.sentence, `words[${index}].sentence`);
      text(word.hintAr, `words[${index}].hintAr`);
    });
  }
  return problems;
}

export interface ParsedPassage {
  /** The passage, ready to write — null whenever there is a problem. */
  seed: PassageSeed | null;
  /** Plain-language problems, at most a dozen; empty = fine. */
  problems: string[];
}

export function parsePassageJson(raw: string): ParsedPassage {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "it could not be read";
    return { seed: null, problems: [`That is not valid JSON: ${reason}`] };
  }

  const shape = shapeProblems(value);
  if (shape.length > 0) return { seed: null, problems: shape.slice(0, MAX_PROBLEMS) };

  const seed = value as PassageSeed;
  const problems = validatePassageSeed(seed);
  return problems.length > 0
    ? { seed: null, problems: problems.slice(0, MAX_PROBLEMS) }
    : { seed, problems: [] };
}
