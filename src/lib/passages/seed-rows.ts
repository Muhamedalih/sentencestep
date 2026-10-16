import type { PassageSeed } from "@/data/passages/types";
import {
  passageIdFor,
  questionIdFor,
  sectionIdFor,
  sentenceIdFor,
  wordGroupIdFor,
  wordIdFor,
} from "@/lib/passages/ids";
import { PASSAGE_VOICE_IDS } from "@/lib/passages/voice-aliases";

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

// --- The rows of an authored passage ------------------------------------------
// Shared by scripts/insert-passages.ts (which keeps a passage in step with its data) and the
// admin's JSON import (which adds a passage), so the two can never write different shapes.

/** Word Lists' own level scale: 1 = Beginner, 2 = Intermediate, 3 = Advanced. */
export const WORD_LIST_LEVEL: Record<PassageSeed["level"], number> = { A1: 1, A2: 2, B1: 2, B2: 3 };

/** The draft Word Lists group a passage's words become — hidden from learners until its passage is open to them (see syncPassageWordGroups). */
export function wordGroupRowFor(seed: PassageSeed, orderIndex: number, isFree: boolean) {
  return {
    id: wordGroupIdFor(seed.slug),
    level: WORD_LIST_LEVEL[seed.level],
    order_index: orderIndex,
    title: `Words from “${seed.title}”`,
    title_ar: `كلمات من «${seed.titleAr}»`,
    description: `The key words of the passage “${seed.title}”.`,
    description_ar: `الكلمات الأساسية من النص «${seed.titleAr}».`,
    is_free: isFree,
    status: "draft" as const,
  };
}

export function wordRowsFor(seed: PassageSeed) {
  return seed.words.map((word, index) => ({
    id: wordIdFor(seed.slug, word.word),
    group_id: wordGroupIdFor(seed.slug),
    order_index: index + 1,
    target_word: word.word,
    sentence: word.sentence,
    hint_ar: word.hintAr,
  }));
}

/** What a passage's row holds that the data decides. `status` and `is_free` are not here: they are the admin's, set once when the row is created and never overwritten by the data. */
export function passageFieldsFor(seed: PassageSeed) {
  return {
    order_index: seed.order,
    level: seed.level,
    tone: seed.tone,
    icon: seed.icon,
    title: seed.title,
    title_ar: seed.titleAr,
    summary: seed.summary,
    summary_ar: seed.summaryAr,
    word_group_id: wordGroupIdFor(seed.slug),
  };
}

export function sectionRowsFor(seed: PassageSeed) {
  return seed.sections.map((section, sectionIndex) => ({
    id: sectionIdFor(seed.slug, sectionIndex + 1),
    passage_id: passageIdFor(seed.slug),
    order_index: sectionIndex + 1,
    title: section.title,
    title_ar: section.titleAr,
    // The part's own question, and on the last part the passage's closing question after it.
    questions: storedQuestionsFor(seed, sectionIndex),
  }));
}

/** The lines, without their clips (`audio_url` is the caller's to set: the insert script keeps a clip while its line is unchanged). `say` and `pause` are what the narration needs besides the English. */
export function sentenceRowsFor(seed: PassageSeed) {
  return seed.sections.flatMap((section, sectionIndex) =>
    section.lines.map((line, lineIndex) => ({
      id: sentenceIdFor(seed.slug, sectionIndex + 1, lineIndex + 1),
      section_id: sectionIdFor(seed.slug, sectionIndex + 1),
      order_index: lineIndex + 1,
      speaker: line.who ?? null,
      en: line.en,
      ar: line.ar,
      say: line.say?.trim() ? line.say.trim() : null,
      pause: line.pause ?? null,
    })),
  );
}

/** What a stored line holds, as far as the data decides it. */
export interface StoredSentence {
  section_id: string;
  order_index: number;
  speaker: string | null;
  en: string;
  ar: string;
  say: string | null;
  pause: unknown;
}

/** JSON with its keys in a fixed order, so the same value always reads the same (Postgres keeps jsonb keys in its own order). */
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

/**
 * Whether a stored line already says exactly what the data says. A line that does is not
 * written again, so a run of the insert script can never touch the clip an admin narrated
 * (or is narrating) for it: only a new or changed line is ever written, and a changed line
 * loses its clip on purpose. `audio_url` is not compared: it belongs to the admin, never to the data.
 */
export function sentenceIsCurrent(
  stored: StoredSentence | undefined,
  row: ReturnType<typeof sentenceRowsFor>[number],
): boolean {
  return (
    stored !== undefined &&
    stored.section_id === row.section_id &&
    stored.order_index === row.order_index &&
    stored.speaker === row.speaker &&
    stored.en === row.en &&
    stored.ar === row.ar &&
    stored.say === row.say &&
    stableJson(stored.pause) === stableJson(row.pause)
  );
}

/** One voice per character; a character the narrator reads (an email, a sign) has none — "no row" means "the narrator's voice". */
export function speakerVoiceRowsFor(seed: PassageSeed) {
  return Object.entries(seed.cast).flatMap(([speaker, alias]) =>
    alias === "narrator"
      ? []
      : [{ passage_id: passageIdFor(seed.slug), speaker, voice_id: PASSAGE_VOICE_IDS[alias] }],
  );
}
