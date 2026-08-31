import type { LessonTranslationOutput } from "@/lib/translation/provider";

/** What a valid response must match — derived from the actual source lesson at generation time, never assumed. */
export interface ExpectedLessonShape {
  hasDescription: boolean;
  /** In lesson order — the real, deterministic sentence ids (see saveLesson's sentenceId helper), never trusted from the model. */
  sentenceIds: string[];
  /**
   * The exact English vocabulary words/phrases requested per sentence, in
   * order — keyed by sentence id, same source as what was actually sent to
   * the provider (see TranslatableField's `words` in generate.ts). A
   * sentence with no entry here, or an empty array, must come back with an
   * empty `words` array; this is never guessed from the response itself.
   */
  sentenceWords: Map<string, string[]>;
}

export type LessonTranslationValidation =
  { valid: true; value: LessonTranslationOutput } | { valid: false; errors: string[] };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Structural validation of raw AI tool output before anything is written to
 * the database — see the Phase 3 spec's hard rule: "never partially write a
 * malformed lesson-level AI response." Every check here is deliberately
 * strict (reject-on-doubt, not best-effort-coerce): a translation pipeline
 * writing plausible-looking garbage into content_translations is worse than
 * one that fails loudly and leaves the field exactly as it was.
 *
 * Sentence identity is checked three ways, not one: every expected id
 * present exactly once (no missing, no duplicates), no unexpected ids, and
 * the same order as the source — the model never gets to invent, drop, or
 * reorder a sentence id; only its own translated text is ever trusted.
 */
export function validateLessonTranslationOutput(
  output: unknown,
  expected: ExpectedLessonShape,
): LessonTranslationValidation {
  const errors: string[] = [];

  if (!isPlainObject(output)) {
    return { valid: false, errors: ["Response was not a JSON object."] };
  }

  const title = output.title;
  if (typeof title !== "string" || title.trim().length === 0) {
    errors.push("Missing or empty title.");
  }

  const description = output.description;
  if (expected.hasDescription) {
    if (typeof description !== "string" || description.trim().length === 0) {
      errors.push(
        "Source lesson has a description, but the translation's description is missing or empty.",
      );
    }
  } else if (description !== null) {
    errors.push("Source lesson has no description, but the translation returned a non-null one.");
  }

  const sentences = output.sentences;
  const wordsById = new Map<string, { en: string; text: string }[]>();
  if (!Array.isArray(sentences)) {
    errors.push("Missing sentences array.");
  } else {
    if (sentences.length !== expected.sentenceIds.length) {
      errors.push(`Expected ${expected.sentenceIds.length} sentences, got ${sentences.length}.`);
    }

    const seenIds = new Set<string>();
    const textById = new Map<string, string>();
    let orderMatches = sentences.length === expected.sentenceIds.length;

    sentences.forEach((entry, index) => {
      if (!isPlainObject(entry) || typeof entry.id !== "string" || typeof entry.text !== "string") {
        errors.push(`Sentence at index ${index} is malformed.`);
        orderMatches = false;
        return;
      }
      if (seenIds.has(entry.id)) {
        errors.push(`Duplicate sentence id "${entry.id}" in response.`);
      }
      seenIds.add(entry.id);
      if (entry.text.trim().length === 0) {
        errors.push(`Sentence "${entry.id}" has an empty translation.`);
      }
      textById.set(entry.id, entry.text);

      const expectedWords = expected.sentenceWords.get(entry.id) ?? [];
      const words = entry.words;
      if (!Array.isArray(words)) {
        errors.push(`Sentence "${entry.id}" is missing its words array.`);
      } else if (words.length !== expectedWords.length) {
        errors.push(
          `Sentence "${entry.id}": expected ${expectedWords.length} word translation(s), got ${words.length}.`,
        );
      } else {
        const validWords: { en: string; text: string }[] = [];
        words.forEach((w, wIndex) => {
          if (!isPlainObject(w) || typeof w.en !== "string" || typeof w.text !== "string") {
            errors.push(`Sentence "${entry.id}": word entry at index ${wIndex} is malformed.`);
            return;
          }
          if (w.en !== expectedWords[wIndex]) {
            errors.push(
              `Sentence "${entry.id}": word entry at index ${wIndex} echoes "${w.en}", expected "${expectedWords[wIndex]}".`,
            );
            return;
          }
          if (w.text.trim().length === 0) {
            errors.push(`Sentence "${entry.id}": word translation for "${w.en}" is empty.`);
            return;
          }
          validWords.push({ en: w.en, text: w.text.trim() });
        });
        wordsById.set(entry.id, validWords);
      }

      if (orderMatches && expected.sentenceIds[index] !== entry.id) {
        orderMatches = false;
      }
    });

    const expectedIdSet = new Set(expected.sentenceIds);
    const missingIds = expected.sentenceIds.filter((id) => !seenIds.has(id));
    const unexpectedIds = [...seenIds].filter((id) => !expectedIdSet.has(id));
    if (missingIds.length > 0) {
      errors.push(`Missing translations for sentence id(s): ${missingIds.join(", ")}.`);
    }
    if (unexpectedIds.length > 0) {
      errors.push(
        `Unexpected sentence id(s) not in the source lesson: ${unexpectedIds.join(", ")}.`,
      );
    }
    if (!orderMatches && missingIds.length === 0 && unexpectedIds.length === 0) {
      errors.push("Sentence order does not match the source lesson's order.");
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  return {
    valid: true,
    value: {
      title: (title as string).trim(),
      description: expected.hasDescription ? (description as string).trim() : null,
      sentences: (sentences as { id: string; text: string }[]).map((s) => ({
        id: s.id,
        text: s.text.trim(),
        words: wordsById.get(s.id) ?? [],
      })),
    },
  };
}
