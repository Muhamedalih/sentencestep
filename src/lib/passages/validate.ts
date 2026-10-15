import type { PassageClosingSeed, PassageSeed, PassageVoiceAlias } from "@/data/passages/types";
import { isPassageIconKey } from "@/lib/passages/icons";
import { problemWithHint } from "@/lib/passages/narration-pauses";
import { containsWholeWord } from "@/lib/passages/text";
import { PASSAGE_LEVELS, PASSAGE_TONES } from "@/lib/passages/types";
import type { PassageLevel } from "@/lib/passages/types";
import { NARRATOR_ROLE, PASSAGE_VOICE_IDS } from "@/lib/passages/voice-aliases";

/**
 * Integrity rules for authored passages — every one of them exists because a
 * broken passage is visible to a learner in a way a broken sentence in a long
 * novel never is: a question whose answer index is off by one marks the right
 * choice wrong, a word that is not in the passage cannot be found in its
 * context, a line with no translation leaves a hole next to the English.
 * Returns plain-language problems (empty = valid) so a failing test or the
 * insert script says exactly which passage, part and line to fix.
 */

const VOICE_ALIASES: readonly PassageVoiceAlias[] = [
  "narrator",
  ...(Object.keys(PASSAGE_VOICE_IDS) as (keyof typeof PASSAGE_VOICE_IDS)[]),
];

const ARABIC_LETTER = /[ء-ي]/;
const BLANK = "___";

/** Passages are read part by part: a part is a handful of lines, a passage a handful of parts. */
export const SECTIONS_PER_PASSAGE = { min: 3, max: 6 } as const;
export const LINES_PER_SECTION = { min: 3, max: 8 } as const;
export const WORDS_PER_PASSAGE = { min: 4, max: 6 } as const;
export const OPTIONS_PER_QUESTION = { min: 2, max: 4 } as const;

/** A line longer than this is almost certainly two thoughts. The limit grows with the level: A1 sentences are short, B1 ones carry a clause more. */
export const MAX_WORDS_PER_LINE_BY_LEVEL: Record<PassageLevel, number> = {
  A1: 22,
  A2: 26,
  B1: 32,
  B2: 38,
};

/** The A1 limit, kept under its old name. */
export const MAX_WORDS_PER_LINE = MAX_WORDS_PER_LINE_BY_LEVEL.A1;

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** What every question has to be, whether it ends a part or closes the passage: worded, translated, 2-4 distinct options and a right answer that is one of them. */
function checkQuestion(
  question: PassageClosingSeed,
  where: string,
  at: (where: string, message: string) => void,
): void {
  if (!question.en.trim()) at(where, "question is empty");
  if (!ARABIC_LETTER.test(question.ar)) at(where, "question has no Arabic translation");
  if (
    question.options.length < OPTIONS_PER_QUESTION.min ||
    question.options.length > OPTIONS_PER_QUESTION.max
  ) {
    at(
      where,
      `question needs ${OPTIONS_PER_QUESTION.min}-${OPTIONS_PER_QUESTION.max} options, has ${question.options.length}`,
    );
  }
  const optionTexts = question.options.map((option) => option.en.trim().toLowerCase());
  if (new Set(optionTexts).size !== optionTexts.length) {
    at(where, "question has duplicate options");
  }
  question.options.forEach((option, optionIndex) => {
    if (!option.en.trim()) at(where, `option ${optionIndex + 1} is empty`);
    if (!ARABIC_LETTER.test(option.ar)) at(where, `option ${optionIndex + 1} has no Arabic`);
  });
  if (
    !Number.isInteger(question.answer) ||
    question.answer < 0 ||
    question.answer >= question.options.length
  ) {
    at(where, `answer ${question.answer} is not one of the ${question.options.length} options`);
  }
}

export function validatePassageSeed(seed: PassageSeed): string[] {
  const problems: string[] = [];
  const at = (where: string, message: string) => problems.push(`${seed.slug} ${where}: ${message}`);

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(seed.slug)) at("", "slug must be lowercase kebab-case");
  if (!Number.isInteger(seed.order) || seed.order < 1) at("", "order must be a positive integer");
  if (!PASSAGE_LEVELS.includes(seed.level)) at("", `unknown level "${seed.level}"`);
  if (!PASSAGE_TONES.includes(seed.tone)) at("", `unknown tone "${seed.tone}"`);
  if (!isPassageIconKey(seed.icon)) at("", `unknown icon "${seed.icon}"`);
  for (const field of ["title", "titleAr", "summary", "summaryAr"] as const) {
    if (!seed[field].trim()) at("", `${field} is empty`);
  }
  if (!ARABIC_LETTER.test(seed.titleAr)) at("", "titleAr has no Arabic letters");
  if (!ARABIC_LETTER.test(seed.summaryAr)) at("", "summaryAr has no Arabic letters");

  const castNames = Object.keys(seed.cast);
  for (const [name, voice] of Object.entries(seed.cast)) {
    if (!name.trim()) at("cast", "a character has an empty name");
    // "narrator" is where the voice that reads the story is kept (passage_speaker_voices): no character can be called that.
    if (name.trim().toLowerCase() === NARRATOR_ROLE) {
      at("cast", `a character can't be called "${NARRATOR_ROLE}" — that name is the narrator's`);
    }
    if (!VOICE_ALIASES.includes(voice)) at("cast", `${name}: unknown voice "${voice}"`);
  }
  // One voice reads the story and every character has a voice of their own: two characters never share one. (A "narrator" entry — an email, a sign — is read by the narrator on purpose.)
  const voiceOwner = new Map<string, string>();
  for (const [name, voice] of Object.entries(seed.cast)) {
    if (voice === "narrator") continue;
    const owner = voiceOwner.get(voice);
    if (owner)
      at(
        "cast",
        `${name} and ${owner} share the voice "${voice}" — each character needs their own`,
      );
    voiceOwner.set(voice, name);
  }

  const { sections } = seed;
  if (sections.length < SECTIONS_PER_PASSAGE.min || sections.length > SECTIONS_PER_PASSAGE.max) {
    at(
      "",
      `needs ${SECTIONS_PER_PASSAGE.min}-${SECTIONS_PER_PASSAGE.max} parts, has ${sections.length}`,
    );
  }

  const usedSpeakers = new Set<string>();
  const allEnglish: string[] = [];

  sections.forEach((section, sectionIndex) => {
    const part = `part ${sectionIndex + 1}`;
    if (!section.title.trim()) at(part, "title is empty");
    if (!ARABIC_LETTER.test(section.titleAr)) at(part, "titleAr has no Arabic letters");

    if (
      section.lines.length < LINES_PER_SECTION.min ||
      section.lines.length > LINES_PER_SECTION.max
    ) {
      at(
        part,
        `needs ${LINES_PER_SECTION.min}-${LINES_PER_SECTION.max} lines, has ${section.lines.length}`,
      );
    }

    section.lines.forEach((line, lineIndex) => {
      const where = `${part} line ${lineIndex + 1}`;
      if (!line.en.trim()) at(where, "English is empty");
      if (!ARABIC_LETTER.test(line.ar)) at(where, "Arabic translation has no Arabic letters");
      const maxWords = MAX_WORDS_PER_LINE_BY_LEVEL[seed.level] ?? MAX_WORDS_PER_LINE;
      if (wordCount(line.en) > maxWords) {
        at(
          where,
          `is ${wordCount(line.en)} words long (max ${maxWords} at ${seed.level}) — split it`,
        );
      }
      if (line.who !== undefined) {
        usedSpeakers.add(line.who);
        if (!castNames.includes(line.who)) at(where, `speaker "${line.who}" is not in the cast`);
      }
      if (line.pause !== undefined) {
        const problem = problemWithHint(line.en, line.pause);
        if (problem) at(where, problem);
        if (line.say?.trim())
          at(where, "has a pause hint and its own say — the hint would be ignored");
      }
      allEnglish.push(line.en);
    });

    const { question } = section;
    checkQuestion(question, part, at);
    if (
      !Number.isInteger(question.evidence) ||
      question.evidence < 0 ||
      question.evidence >= section.lines.length
    ) {
      at(part, `evidence ${question.evidence} is not one of the ${section.lines.length} lines`);
    }
  });

  // The closing question: one, about the passage as a whole, so it points at no line of its own.
  const { closing } = seed;
  if (!closing) {
    at("closing question", "the passage has none");
  } else {
    checkQuestion(closing, "closing question", at);
    const asked = new Set(sections.map((section) => section.question.en.trim().toLowerCase()));
    if (asked.has(closing.en.trim().toLowerCase())) {
      at("closing question", "repeats the question of one of the parts");
    }
  }

  for (const name of castNames) {
    if (!usedSpeakers.has(name)) at("cast", `${name} never speaks`);
  }

  const { words } = seed;
  if (words.length < WORDS_PER_PASSAGE.min || words.length > WORDS_PER_PASSAGE.max) {
    at("words", `needs ${WORDS_PER_PASSAGE.min}-${WORDS_PER_PASSAGE.max}, has ${words.length}`);
  }
  const seenWords = new Set<string>();
  for (const entry of words) {
    const where = `word "${entry.word}"`;
    if (!/^[a-z]+$/.test(entry.word)) at(where, "must be a single lowercase word");
    if (seenWords.has(entry.word)) at(where, "is listed twice");
    seenWords.add(entry.word);
    if (!allEnglish.some((line) => containsWholeWord(line, entry.word))) {
      at(where, "does not appear in the passage");
    }
    const blanks = entry.sentence.split(BLANK).length - 1;
    if (blanks !== 1) {
      at(where, `sentence must have exactly one ${BLANK}, has ${blanks}`);
    } else {
      const filled = entry.sentence.replace(BLANK, entry.word).toLowerCase();
      if (!allEnglish.some((line) => line.toLowerCase().includes(filled))) {
        at(where, "sentence is not a piece of one of the passage's own lines");
      }
    }
    if (!ARABIC_LETTER.test(entry.hintAr)) at(where, "hintAr has no Arabic letters");
    if (!entry.hintAr.trim().endsWith(".")) at(where, "hintAr should end with a full stop");
  }

  return problems;
}

/** Cross-passage rules: unique slugs, unique order within a level, and no word taught twice. */
export function validatePassageSet(seeds: readonly PassageSeed[]): string[] {
  const problems: string[] = [];

  const slugs = new Set<string>();
  const orders = new Set<string>();
  const wordOwner = new Map<string, string>();

  for (const seed of seeds) {
    if (slugs.has(seed.slug)) problems.push(`${seed.slug}: slug is used by two passages`);
    slugs.add(seed.slug);

    const orderKey = `${seed.level}:${seed.order}`;
    if (orders.has(orderKey)) {
      problems.push(`${seed.slug}: order ${seed.order} is taken in level ${seed.level}`);
    }
    orders.add(orderKey);

    for (const entry of seed.words) {
      const owner = wordOwner.get(entry.word);
      if (owner && owner !== seed.slug) {
        problems.push(`${seed.slug}: word "${entry.word}" is already taught by ${owner}`);
      }
      wordOwner.set(entry.word, seed.slug);
    }

    problems.push(...validatePassageSeed(seed));
  }

  return problems;
}
