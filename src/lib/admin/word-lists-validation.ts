import { BLANK_TOKEN } from "@/types/word-lists";

// Pure, no I/O — safe to unit test and safe to reuse for client-side UX
// hints, but word-lists-actions.ts always re-validates server-side before
// writing. Client-side validation only improves UX; it is never the only
// check. Mirrors library-validation.ts's shape.
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type WordGroupStatus = "draft" | "published" | "archived";

export interface WordGroupInput {
  /** Present when editing; absent when creating. */
  id?: string;
  level: number;
  orderIndex: number;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  isFree: boolean;
  status: WordGroupStatus;
}

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_TARGET_WORD_LENGTH = 50;
const MAX_SENTENCE_LENGTH = 500;
const MAX_HINT_LENGTH = 200;

export function validateWordGroupInput(input: WordGroupInput): ValidationResult {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push("Title is required.");
  if (input.title && input.title.trim().length > MAX_TITLE_LENGTH)
    errors.push(`Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  if (!input.titleAr?.trim()) errors.push("Arabic title is required.");
  if (input.titleAr && input.titleAr.trim().length > MAX_TITLE_LENGTH)
    errors.push(`Arabic title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  for (const [label, value] of [
    ["Description", input.description],
    ["Arabic description", input.descriptionAr],
  ] as const) {
    if (value && value.trim().length > MAX_DESCRIPTION_LENGTH)
      errors.push(`${label} must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
  }
  if (!Number.isInteger(input.level) || input.level < 1 || input.level > 3) {
    errors.push("Level must be 1 (Beginner), 2 (Intermediate), or 3 (Advanced).");
  }
  if (!Number.isInteger(input.orderIndex) || input.orderIndex < 0) {
    errors.push("Order must be a whole number, 0 or greater.");
  }
  return { valid: errors.length === 0, errors };
}

export interface VocabularyWordInput {
  /** Present for an existing word being edited; absent for one the admin just added and hasn't saved yet. */
  id?: string;
  targetWord: string;
  sentence: string;
  hintAr: string;
}

const ARABIC_CHAR_RE = /[؀-ۿ]/;

/**
 * The same content invariants src/data/word-lists/seed-content.test.ts
 * checks for the static seed — applied here to admin-authored content too,
 * since a violation of any of these breaks the actual practice screen (a
 * missing/duplicated blank, or a hint that leaks the answer) rather than
 * just looking wrong in a table.
 */
export function validateVocabularyWordInput(input: VocabularyWordInput): string[] {
  const errors: string[] = [];
  const targetWord = input.targetWord?.trim() ?? "";
  const sentence = input.sentence?.trim() ?? "";
  const hintAr = input.hintAr?.trim() ?? "";

  if (!targetWord) {
    errors.push("Target word is required.");
  } else if (/\s/.test(targetWord)) {
    errors.push(`"${targetWord}": target word must be a single word, no spaces.`);
  } else if (targetWord.length > MAX_TARGET_WORD_LENGTH) {
    errors.push(
      `"${targetWord}": target word must be ${MAX_TARGET_WORD_LENGTH} characters or fewer.`,
    );
  }

  if (!sentence) {
    errors.push("Sentence is required.");
  } else {
    if (sentence.length > MAX_SENTENCE_LENGTH) {
      errors.push(`Sentence must be ${MAX_SENTENCE_LENGTH} characters or fewer.`);
    }
    const blankCount = sentence.split(BLANK_TOKEN).length - 1;
    if (blankCount !== 1) {
      errors.push(
        `"${sentence}": sentence must contain the blank (${BLANK_TOKEN}) exactly once, found ${blankCount}.`,
      );
    }
    if (targetWord) {
      const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`\\b${escaped}\\b`, "i").test(sentence)) {
        errors.push(`"${targetWord}" appears in its own sentence — the answer must stay hidden.`);
      }
    }
  }

  if (!hintAr) {
    errors.push(`"${targetWord || "word"}": Arabic hint is required.`);
  } else if (!ARABIC_CHAR_RE.test(hintAr)) {
    errors.push(`"${targetWord || "word"}": the hint doesn't look like Arabic text.`);
  } else if (hintAr.length > MAX_HINT_LENGTH) {
    errors.push(
      `"${targetWord || "word"}": Arabic hint must be ${MAX_HINT_LENGTH} characters or fewer.`,
    );
  }

  return errors;
}

/**
 * Validates a whole group's word list together (not just word-by-word) —
 * duplicate target words or sentences only make sense to catch across the
 * set, the same "no duplicate target words or sentences within a group"
 * rule the static seed's own tests enforce.
 */
export function validateWordGroupWords(words: VocabularyWordInput[]): ValidationResult {
  const errors: string[] = [];
  for (const word of words) errors.push(...validateVocabularyWordInput(word));

  const targets = words.map((w) => w.targetWord.trim().toLowerCase()).filter(Boolean);
  const duplicateTargets = targets.filter((word, index) => targets.indexOf(word) !== index);
  for (const word of new Set(duplicateTargets))
    errors.push(`"${word}" is used as a target word more than once.`);

  const sentences = words.map((w) => w.sentence.trim()).filter(Boolean);
  const duplicateSentences = sentences.filter(
    (sentence, index) => sentences.indexOf(sentence) !== index,
  );
  if (duplicateSentences.length > 0)
    errors.push("The same sentence is used for more than one word.");

  return { valid: errors.length === 0, errors };
}
