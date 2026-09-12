import type { LearningMode } from "@/types/content";

// Pure, no I/O — safe to unit test (validation.test.ts) and safe to reuse
// for client-side UX hints, but content-actions.ts always re-validates
// server-side before writing. Client-side validation only improves UX; it
// is never the only check.

export type ContentStatus = "draft" | "published" | "archived";

export interface SentenceInput {
  en: string;
  ar: string;
  /**
   * Spanish translation, stored in content_translations rather than a
   * sibling column — see supabase/migrations/20250122000000_locale_foundation.sql.
   * The field itself stays optional in the type (existing lessons being
   * edited may not have one yet), but validateLessonInput requires it —
   * same as `ar` — for any brand-new lesson (see that function's
   * isNewContent handling). An empty value on an edit just means "no
   * Spanish translation yet" (falls back to English for learners), not a
   * validation error.
   */
  es?: string;
  /** Turkish translation — same content_translations-backed, conditionally-required treatment as `es` (required only when creating new content). See SentenceInput.es's doc comment. */
  tr?: string;
  speaker?: string | null;
  /** Pronunciation audio reference (Milestone 13). Optional — NULL/empty is normal and falls back to speech synthesis in the learner UI. */
  audioUrl?: string | null;
}

export interface LessonInput {
  /**
   * Present when editing an existing lesson; absent when creating a new
   * one. This is what validateLessonInput uses to decide whether the
   * Spanish/Turkish (and, for descriptions, Arabic too) required-translation
   * invariant applies: it's enforced for brand-new content only, never
   * retroactively on an edit — otherwise saving an unrelated change (e.g.
   * toggling free/premium) on one of the pre-existing lessons that don't yet
   * have full Spanish/Turkish coverage would be blocked, which would amount
   * to forcing a translation backfill through the back door.
   */
  id?: string;
  mode: LearningMode;
  levelId: string;
  title: string;
  titleAr: string;
  /** See SentenceInput.es's doc comment — same content_translations-backed treatment, required only for new content. */
  titleEs?: string;
  /** See SentenceInput.tr's doc comment — same content_translations-backed treatment, required only for new content. */
  titleTr?: string;
  /** Short blurb shown on lesson cards — optional, since not every mode/lesson has one yet. When present on a brand-new lesson, its Arabic/Spanish/Turkish counterparts become required together (see validateLessonInput) — an untranslated description is never allowed to ship for new content. */
  description?: string;
  descriptionAr?: string;
  descriptionEs?: string;
  descriptionTr?: string;
  orderIndex: number;
  isFree: boolean;
  status: ContentStatus;
  sentences: SentenceInput[];
  /** Per-lesson voice override — null/undefined means "use the global default" (see resolveVoiceId in src/lib/voice/resolution.ts). Never validated against the voices table here; an id that no longer exists just resolves to nothing playable, the same graceful-degradation the rest of the voice system already has. */
  voiceId?: string | null;
}

export interface LevelInput {
  mode: LearningMode;
  index: number;
  title: string;
  titleAr: string;
  /** See SentenceInput.es's doc comment — same optional, content_translations-backed treatment. */
  titleEs?: string;
}

export interface PreviewSentenceInput {
  en: string;
  ar: string;
  /** See SentenceInput.es's doc comment — same optional, content_translations-backed treatment. */
  es?: string;
}

const MAX_PREVIEW_SENTENCES = 8;

/** Validates the "Start Simple" preview sentences for a level (see updateLevelPreview in content-actions.ts). Not tied to REQUIRED_SENTENCE_COUNT — these are standalone examples, not a lesson's activity sentences. */
export function validatePreviewSentences(sentences: PreviewSentenceInput[]): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(sentences) || sentences.length === 0) {
    errors.push("At least one preview sentence is required.");
  } else if (sentences.length > MAX_PREVIEW_SENTENCES) {
    errors.push(`No more than ${MAX_PREVIEW_SENTENCES} preview sentences are allowed.`);
  } else {
    sentences.forEach((sentence, index) => {
      if (!sentence.en?.trim())
        errors.push(`Preview sentence ${index + 1}: English text is required.`);
      if (!sentence.ar?.trim())
        errors.push(`Preview sentence ${index + 1}: Arabic translation is required.`);
    });
  }

  return { valid: errors.length === 0, errors };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const VALID_MODES: LearningMode[] = ["normal", "stories", "conversation"];
const VALID_STATUSES: ContentStatus[] = ["draft", "published", "archived"];

/**
 * The content-length standard for each mode: an ordinary lesson is exactly 9
 * sentences (one coherent mini-situation per lesson, since the Start Simple
 * homepage redesign), a conversation is exactly 30 lines. Stories are the one
 * exception — see MIN_STORY_SENTENCE_COUNT below — but `stories: 12` is kept
 * here as the library's typical/reference length: mode-section.tsx's
 * marketing sentence-total still uses it as a stand-in average (premium
 * stories' real sentences are RLS-hidden from the anon client that page
 * reads through, so an exact sum isn't available there), and story-card.tsx
 * falls back to it for the same reason on a *locked* story's card. Reused by
 * the admin CMS (via validateLessonInput below) and seed-content.test.ts —
 * never re-declared separately, so the two can't silently drift apart.
 */
export const REQUIRED_SENTENCE_COUNT: Record<LearningMode, number> = {
  normal: 9,
  stories: 12,
  conversation: 30,
};

/**
 * Stories are deliberately NOT held to an exact sentence count the way
 * normal lessons and conversations are — a story's length should follow the
 * natural shape of its own setup/complication/resolution arc, not be padded
 * or trimmed to hit a number (see the Stories content-quality audit this
 * constant was introduced for). This is the only structural floor: enough
 * sentences for a real arc to exist, not a target to reach.
 */
export const MIN_STORY_SENTENCE_COUNT = 6;

/**
 * `requireAllTranslations` (default false, preserving every existing
 * caller's behavior) enforces Spanish and Turkish alongside Arabic — set to
 * true only for a brand-new lesson (see validateLessonInput's isNewContent).
 * An in-place edit of an already-saved sentence never gets this flag, so a
 * pre-existing sentence with no Spanish/Turkish yet can still be edited
 * (e.g. reordered, its audio URL set) without being forced to add them.
 */
const MAX_SENTENCE_LENGTH = 500;
const MAX_SPEAKER_LENGTH = 100;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;

export function validateSentenceInput(
  sentence: SentenceInput,
  mode: LearningMode,
  requireAllTranslations = false,
): string[] {
  const errors: string[] = [];
  if (!sentence.en?.trim()) errors.push("English text is required.");
  if (sentence.en && sentence.en.trim().length > MAX_SENTENCE_LENGTH)
    errors.push(`English text must be ${MAX_SENTENCE_LENGTH} characters or fewer.`);
  if (!sentence.ar?.trim()) errors.push("Arabic translation is required.");
  if (sentence.ar && sentence.ar.trim().length > MAX_SENTENCE_LENGTH)
    errors.push(`Arabic translation must be ${MAX_SENTENCE_LENGTH} characters or fewer.`);
  if (requireAllTranslations) {
    if (!sentence.es?.trim()) errors.push("Spanish translation is required.");
    if (!sentence.tr?.trim()) errors.push("Turkish translation is required.");
  }
  if (sentence.es && sentence.es.trim().length > MAX_SENTENCE_LENGTH)
    errors.push(`Spanish translation must be ${MAX_SENTENCE_LENGTH} characters or fewer.`);
  if (sentence.tr && sentence.tr.trim().length > MAX_SENTENCE_LENGTH)
    errors.push(`Turkish translation must be ${MAX_SENTENCE_LENGTH} characters or fewer.`);
  if (mode === "conversation" && !sentence.speaker?.trim()) {
    errors.push("A speaker is required for conversation lines.");
  }
  if (sentence.speaker && sentence.speaker.trim().length > MAX_SPEAKER_LENGTH)
    errors.push(`Speaker must be ${MAX_SPEAKER_LENGTH} characters or fewer.`);
  const audioUrl = sentence.audioUrl?.trim();
  if (audioUrl && !/^(https?:\/\/|\/)\S+$/.test(audioUrl)) {
    errors.push("Audio URL must be a full link (https://...) or a site-relative path (/...).");
  }
  return errors;
}

/**
 * Whether this content item is being created for the first time, as opposed
 * to an edit of something already saved — the one signal that decides
 * whether Spanish/Turkish (title, sentences, and — coupled with an English
 * description — Arabic/Spanish/Turkish descriptions) are required. Kept as
 * its own named function so the rule reads the same way everywhere it's
 * applied below, rather than three separate `!input.id` checks drifting
 * apart.
 */
function isNewContent(input: LessonInput): boolean {
  return !input.id;
}

export function validateLessonInput(input: LessonInput): ValidationResult {
  const errors: string[] = [];
  const requireAllTranslations = isNewContent(input);

  if (!VALID_MODES.includes(input.mode)) errors.push("Invalid content type.");
  if (!input.levelId) errors.push("A level is required.");
  if (!input.title?.trim()) errors.push("Title is required.");
  if (input.title && input.title.trim().length > MAX_TITLE_LENGTH)
    errors.push(`Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  if (!input.titleAr?.trim()) errors.push("Arabic title is required.");
  if (input.titleAr && input.titleAr.trim().length > MAX_TITLE_LENGTH)
    errors.push(`Arabic title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  if (requireAllTranslations) {
    if (!input.titleEs?.trim()) errors.push("Spanish title is required.");
    if (!input.titleTr?.trim()) errors.push("Turkish title is required.");
  }
  if (input.titleEs && input.titleEs.trim().length > MAX_TITLE_LENGTH)
    errors.push(`Spanish title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  if (input.titleTr && input.titleTr.trim().length > MAX_TITLE_LENGTH)
    errors.push(`Turkish title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  if (requireAllTranslations && input.description?.trim()) {
    if (!input.descriptionAr?.trim()) errors.push("Arabic description is required.");
    if (!input.descriptionEs?.trim()) errors.push("Spanish description is required.");
    if (!input.descriptionTr?.trim()) errors.push("Turkish description is required.");
  }
  for (const [label, value] of [
    ["Description", input.description],
    ["Arabic description", input.descriptionAr],
    ["Spanish description", input.descriptionEs],
    ["Turkish description", input.descriptionTr],
  ] as const) {
    if (value && value.trim().length > MAX_DESCRIPTION_LENGTH)
      errors.push(`${label} must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`);
  }
  if (!Number.isInteger(input.orderIndex) || input.orderIndex < 1) {
    errors.push("Order must be a positive whole number.");
  }
  if (!VALID_STATUSES.includes(input.status)) errors.push("Invalid publishing status.");

  if (!Array.isArray(input.sentences) || input.sentences.length === 0) {
    errors.push("At least one sentence is required.");
  } else {
    if (input.mode === "stories") {
      if (input.sentences.length < MIN_STORY_SENTENCE_COUNT) {
        errors.push(
          `Stories need at least ${MIN_STORY_SENTENCE_COUNT} sentences to have a real setup, complication, and resolution (this one has ${input.sentences.length}).`,
        );
      }
    } else if (input.mode === "normal" || input.mode === "conversation") {
      // The three onboarding-* lessons (see OPENING_LESSON_ID in
      // starting-level.ts) are a first-time visitor's one-off opening
      // experience, not part of the ordinary numbered curriculum the
      // exact-9 standard exists for (mode-section.tsx's lesson-count-times-9
      // marketing stat is about that curriculum only) — they're exempt from
      // it the same way Stories' arc-driven length already is, so their
      // sentence count is free to match whatever the admin actually wrote.
      const isExemptOnboardingLesson =
        input.mode === "normal" && input.id?.startsWith("onboarding-");
      const requiredCount = REQUIRED_SENTENCE_COUNT[input.mode];
      if (!isExemptOnboardingLesson && input.sentences.length !== requiredCount) {
        errors.push(
          `${input.mode === "normal" ? "Lessons" : "Conversations"} must have exactly ${requiredCount} sentences (this one has ${input.sentences.length}).`,
        );
      }
    }
    input.sentences.forEach((sentence, index) => {
      for (const error of validateSentenceInput(sentence, input.mode, requireAllTranslations)) {
        errors.push(`Sentence ${index + 1}: ${error}`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

export function validateLevelInput(input: LevelInput): ValidationResult {
  const errors: string[] = [];

  if (!VALID_MODES.includes(input.mode)) errors.push("Invalid content type.");
  if (!Number.isInteger(input.index) || input.index < 1) {
    errors.push("Level number must be a positive whole number.");
  }
  if (!input.title?.trim()) errors.push("Title is required.");
  if (!input.titleAr?.trim()) errors.push("Arabic title is required.");

  return { valid: errors.length === 0, errors };
}
