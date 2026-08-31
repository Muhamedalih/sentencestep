// Pure, no I/O — mirrors src/lib/admin/validation.ts's split (client-side UX
// hint here, library-actions.ts always re-validates server-side before
// writing).

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface CategoryInput {
  /** Present when editing; absent when creating. */
  id?: string;
  name: string;
  description?: string;
  orderIndex: number;
}

export function validateCategoryInput(input: CategoryInput): ValidationResult {
  const errors: string[] = [];
  if (!input.name?.trim()) errors.push("Name is required.");
  if (input.name && input.name.trim().length > 80)
    errors.push("Name must be 80 characters or fewer.");
  if (!Number.isInteger(input.orderIndex) || input.orderIndex < 0) {
    errors.push("Order must be a whole number, 0 or greater.");
  }
  return { valid: errors.length === 0, errors };
}

export type BookStatus = "draft" | "published" | "archived";

export interface BookCategoryInput {
  categoryId: string;
  isPrimary: boolean;
}

export interface BookInput {
  /** Present when editing; absent when creating. */
  id?: string;
  title: string;
  author: string;
  description?: string;
  difficultyLevel: number;
  isFeatured: boolean;
  isFree: boolean;
  freePreviewSentenceCount: number;
  status: BookStatus;
  orderIndex: number;
  categories: BookCategoryInput[];
}

const VALID_STATUSES: BookStatus[] = ["draft", "published", "archived"];

export function validateBookInput(input: BookInput): ValidationResult {
  const errors: string[] = [];

  if (!input.title?.trim()) errors.push("Title is required.");
  if (!input.author?.trim()) errors.push("Author is required.");
  if (
    !Number.isInteger(input.difficultyLevel) ||
    input.difficultyLevel < 1 ||
    input.difficultyLevel > 3
  ) {
    errors.push("Difficulty must be Beginner, Intermediate, or Advanced.");
  }
  if (!Number.isInteger(input.freePreviewSentenceCount) || input.freePreviewSentenceCount < 0) {
    errors.push("Free preview sentence count must be 0 or greater.");
  }
  if (!VALID_STATUSES.includes(input.status)) errors.push("Invalid publishing status.");
  if (!Number.isInteger(input.orderIndex) || input.orderIndex < 0) {
    errors.push("Order must be a whole number, 0 or greater.");
  }

  if (!Array.isArray(input.categories) || input.categories.length === 0) {
    errors.push("At least one category is required.");
  } else {
    const primaryCount = input.categories.filter((c) => c.isPrimary).length;
    if (primaryCount === 0) errors.push("One category must be marked primary.");
    if (primaryCount > 1) errors.push("Only one category can be marked primary.");
    const uniqueIds = new Set(input.categories.map((c) => c.categoryId));
    if (uniqueIds.size !== input.categories.length)
      errors.push("A category is selected more than once.");
  }

  return { valid: errors.length === 0, errors };
}

// --- Book Sections / Sentences — the Book Learning Engine's content-
// authoring foundation (Section 20 of that spec: "create the foundation
// needed to manage/test this structure... do NOT build a giant CMS"). One
// section is one form: title/description/order plus its full sentence list
// as one-sentence-per-line plain text, replacing whatever sentences existed
// before on save — same delete-and-reinsert pattern saveLesson already uses
// for lesson sentences (src/lib/admin/content-actions.ts), just with a
// textarea instead of per-sentence rows, since a section can hold anywhere
// from a handful to dozens of sentences and per-row inputs wouldn't scale to
// authoring a real ~200-sentence book. No AI generation, no bulk import —
// exactly what an admin types or pastes, one line each.

/** Splits a sentence-per-line textarea into trimmed, non-empty English sentences, in order — the one place both validation and saveBookSection derive "the section's sentences" from, so they can never disagree about what an empty/whitespace-only line means. */
export function splitSentenceLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Splits a translation textarea into trimmed lines WITHOUT dropping empty
 * ones — unlike splitSentenceLines, position here must line up 1:1 with the
 * English sentence at the same index, so silently collapsing a blank line
 * would misalign every translation after it. An empty string input yields
 * `[]` (no translation supplied for this locale at all — see
 * validateBookSectionInput's line-count check), not `[""]`.
 */
export function splitTranslationLines(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return trimmed.split("\n").map((line) => line.trim());
}

export interface BookSectionInput {
  /** Present when editing; absent when creating. */
  id?: string;
  bookId: string;
  title: string;
  description?: string;
  orderIndex: number;
  /** One English sentence per non-empty line — see splitSentenceLines. */
  sentencesText: string;
  /** One translation per line, same order/count as sentencesText — see splitTranslationLines. Empty string means "no translation supplied," never partial. */
  arabicText?: string;
  turkishText?: string;
  spanishText?: string;
  /** The section title's own translation — a single line each, independent of the sentence translations above. Empty means "no translation supplied," same fallback-to-English convention. */
  titleAr?: string;
  titleTr?: string;
  titleEs?: string;
}

const TRANSLATION_FIELDS = [
  ["arabicText", "Arabic"],
  ["turkishText", "Turkish"],
  ["spanishText", "Spanish"],
] as const;

const TITLE_TRANSLATION_FIELDS = [
  ["titleAr", "Arabic"],
  ["titleTr", "Turkish"],
  ["titleEs", "Spanish"],
] as const;

export function validateBookSectionInput(input: BookSectionInput): ValidationResult {
  const errors: string[] = [];
  if (!input.title?.trim()) errors.push("Title is required.");
  if (input.title && input.title.trim().length > 120)
    errors.push("Title must be 120 characters or fewer.");
  if (!Number.isInteger(input.orderIndex) || input.orderIndex < 0) {
    errors.push("Order must be a whole number, 0 or greater.");
  }
  const sentenceCount = splitSentenceLines(input.sentencesText).length;
  if (sentenceCount === 0) {
    errors.push("At least one sentence is required — one per line.");
  }

  for (const [key, label] of TRANSLATION_FIELDS) {
    const lines = splitTranslationLines(input[key] ?? "");
    if (lines.length === 0) continue; // no translation supplied for this locale — fine, learners fall back to English
    if (lines.length !== sentenceCount) {
      errors.push(
        `${label} translation has ${lines.length} line${lines.length === 1 ? "" : "s"}, but there ${sentenceCount === 1 ? "is" : "are"} ${sentenceCount} English sentence${sentenceCount === 1 ? "" : "s"} — one translated line per sentence, same order.`,
      );
    } else if (lines.some((line) => line.length === 0)) {
      errors.push(
        `${label} translation has a blank line — every sentence must have a translation, or leave the whole field empty.`,
      );
    }
  }

  for (const [key, label] of TITLE_TRANSLATION_FIELDS) {
    const value = (input[key] ?? "").trim();
    if (value.length > 120)
      errors.push(`${label} title translation must be 120 characters or fewer.`);
  }

  return { valid: errors.length === 0, errors };
}
