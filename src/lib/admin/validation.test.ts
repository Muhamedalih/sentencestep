// Deterministic unit tests for admin content validation — no database.
// Run with `npm run test:admin`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MIN_STORY_SENTENCE_COUNT,
  REQUIRED_SENTENCE_COUNT,
  validateLessonInput,
  validateLevelInput,
  validateSentenceInput,
} from "./validation";
import type { LessonInput, LevelInput, SentenceInput } from "./validation";

function sentencesFor(
  mode: LessonInput["mode"],
  count = REQUIRED_SENTENCE_COUNT[mode],
): SentenceInput[] {
  return Array.from({ length: count }, (_, i) => ({
    en: `Sentence number ${i + 1}.`,
    ar: `الجملة رقم ${i + 1}.`,
    speaker: mode === "conversation" ? (i % 2 === 0 ? "A" : "B") : undefined,
  }));
}

/**
 * Carries `id` by default, i.e. represents editing an already-saved lesson —
 * these fixtures predate the Spanish/Turkish-required-for-new-content
 * invariant (see validateLessonInput's isNewContent) and exist to test
 * structural validation (sentence count, speaker requirement, status, ...)
 * independent of translation completeness, exactly like one of the
 * pre-existing 74 lessons being edited today. The brand-new-lesson path is
 * covered separately by newLesson() below, which omits `id` on purpose.
 */
function baseLesson(overrides: Partial<LessonInput> = {}): LessonInput {
  const mode = overrides.mode ?? "normal";
  return {
    id: "test-lesson-id",
    mode,
    levelId: "level-1",
    title: "I am happy.",
    titleAr: "أنا سعيد.",
    orderIndex: 1,
    isFree: true,
    status: "published",
    sentences: sentencesFor(mode),
    ...overrides,
  };
}

/** Sentences with Arabic, Spanish, and Turkish all filled in — what a brand-new lesson (no `id`) must supply for validateLessonInput to accept it. */
function fullyTranslatedSentencesFor(
  mode: LessonInput["mode"],
  count = REQUIRED_SENTENCE_COUNT[mode],
): SentenceInput[] {
  return Array.from({ length: count }, (_, i) => ({
    en: `Sentence number ${i + 1}.`,
    ar: `الجملة رقم ${i + 1}.`,
    es: `Frase número ${i + 1}.`,
    tr: `Cümle numara ${i + 1}.`,
    speaker: mode === "conversation" ? (i % 2 === 0 ? "A" : "B") : undefined,
  }));
}

/** A well-formed brand-new lesson: no `id`, and Arabic/Spanish/Turkish present for both the title and every sentence — the shape the admin creation form must submit. */
function newLesson(overrides: Partial<LessonInput> = {}): LessonInput {
  const mode = overrides.mode ?? "normal";
  return {
    mode,
    levelId: "level-1",
    title: "I am happy.",
    titleAr: "أنا سعيد.",
    titleEs: "Estoy feliz.",
    titleTr: "Mutluyum.",
    orderIndex: 1,
    isFree: true,
    status: "published",
    sentences: fullyTranslatedSentencesFor(mode),
    ...overrides,
  };
}

// --- New-content translation requirement (Arabic/Spanish/Turkish) ---

test("validateLessonInput: a fully-translated brand-new lesson (no id) passes", () => {
  const result = validateLessonInput(newLesson());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateLessonInput: a new lesson missing the Arabic title is rejected", () => {
  const result = validateLessonInput(newLesson({ titleAr: "" }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Arabic title")));
});

test("validateLessonInput: a new lesson missing the Spanish title is rejected", () => {
  const result = validateLessonInput(newLesson({ titleEs: "" }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Spanish title")));
});

test("validateLessonInput: a new lesson missing the Turkish title is rejected", () => {
  const result = validateLessonInput(newLesson({ titleTr: "" }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Turkish title")));
});

test("validateLessonInput: a new lesson with a whitespace-only Spanish title is rejected", () => {
  const result = validateLessonInput(newLesson({ titleEs: "   " }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Spanish title")));
});

test("validateLessonInput: a new lesson with a whitespace-only Turkish title is rejected", () => {
  const result = validateLessonInput(newLesson({ titleTr: "   " }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Turkish title")));
});

test("validateLessonInput: a new lesson with a sentence missing Spanish is rejected", () => {
  const sentences = fullyTranslatedSentencesFor("normal");
  sentences[2] = { ...sentences[2]!, es: "" };
  const result = validateLessonInput(newLesson({ sentences }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Sentence 3") && e.includes("Spanish")));
});

test("validateLessonInput: a new lesson with a sentence missing Turkish is rejected", () => {
  const sentences = fullyTranslatedSentencesFor("normal");
  sentences[2] = { ...sentences[2]!, tr: "" };
  const result = validateLessonInput(newLesson({ sentences }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Sentence 3") && e.includes("Turkish")));
});

test("validateLessonInput: a new lesson with a whitespace-only sentence Spanish translation is rejected", () => {
  const sentences = fullyTranslatedSentencesFor("normal");
  sentences[0] = { ...sentences[0]!, es: "   " };
  const result = validateLessonInput(newLesson({ sentences }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Sentence 1") && e.includes("Spanish")));
});

test("validateLessonInput: a new lesson with a whitespace-only sentence Turkish translation is rejected", () => {
  const sentences = fullyTranslatedSentencesFor("normal");
  sentences[0] = { ...sentences[0]!, tr: "   " };
  const result = validateLessonInput(newLesson({ sentences }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Sentence 1") && e.includes("Turkish")));
});

test("validateLessonInput: a new lesson works for stories and conversations too, not just normal lessons", () => {
  assert.equal(validateLessonInput(newLesson({ mode: "stories" })).valid, true);
  assert.equal(validateLessonInput(newLesson({ mode: "conversation" })).valid, true);
});

test("validateLessonInput: a new lesson with an English description requires Arabic/Spanish/Turkish descriptions", () => {
  const result = validateLessonInput(newLesson({ description: "A short blurb." }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Arabic description")));
  assert.ok(result.errors.some((e) => e.includes("Spanish description")));
  assert.ok(result.errors.some((e) => e.includes("Turkish description")));
});

test("validateLessonInput: a new lesson with all four description languages passes", () => {
  const result = validateLessonInput(
    newLesson({
      description: "A short blurb.",
      descriptionAr: "وصف قصير.",
      descriptionEs: "Una breve descripción.",
      descriptionTr: "Kısa bir açıklama.",
    }),
  );
  assert.equal(result.valid, true);
});

test("validateLessonInput: a new lesson with no description at all doesn't require description translations", () => {
  const result = validateLessonInput(newLesson());
  assert.equal(result.valid, true);
});

test("validateLessonInput: editing an existing lesson (id present) does not require Spanish/Turkish — existing behavior is preserved", () => {
  // Mirrors baseLesson(): no titleEs/titleTr, sentences with only en/ar —
  // exactly what one of the pre-existing 74 lessons looks like today. Must
  // still pass so editing old content is never blocked on backfilling
  // translations it doesn't have.
  const result = validateLessonInput(baseLesson({ id: "normal-1" }));
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateLessonInput: editing an existing lesson with a description still doesn't require description translations", () => {
  const result = validateLessonInput(baseLesson({ id: "normal-1", description: "A short blurb." }));
  assert.equal(result.valid, true);
});

test("validateSentenceInput: with requireAllTranslations, rejects a missing Spanish translation", () => {
  const errors = validateSentenceInput({ en: "Hi", ar: "مرحبا", tr: "Merhaba" }, "normal", true);
  assert.ok(errors.some((e) => e.includes("Spanish")));
});

test("validateSentenceInput: with requireAllTranslations, rejects a missing Turkish translation", () => {
  const errors = validateSentenceInput({ en: "Hi", ar: "مرحبا", es: "Hola" }, "normal", true);
  assert.ok(errors.some((e) => e.includes("Turkish")));
});

test("validateSentenceInput: with requireAllTranslations, accepts all four languages present", () => {
  const errors = validateSentenceInput(
    { en: "Hi", ar: "مرحبا", es: "Hola", tr: "Merhaba" },
    "normal",
    true,
  );
  assert.deepEqual(errors, []);
});

test("validateSentenceInput: without requireAllTranslations (default), Spanish/Turkish stay optional — existing behavior preserved", () => {
  const errors = validateSentenceInput({ en: "Hi", ar: "مرحبا" }, "normal");
  assert.deepEqual(errors, []);
});

test("validateLessonInput: a well-formed normal lesson (9 sentences) passes", () => {
  const result = validateLessonInput(baseLesson());
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("validateLessonInput: a well-formed story (12 sentences) passes", () => {
  const result = validateLessonInput(baseLesson({ mode: "stories" }));
  assert.equal(result.valid, true);
});

test("validateLessonInput: a well-formed conversation (30 lines) passes", () => {
  const result = validateLessonInput(baseLesson({ mode: "conversation" }));
  assert.equal(result.valid, true);
});

test("validateLessonInput: rejects an empty title", () => {
  const result = validateLessonInput(baseLesson({ title: "  " }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Title")));
});

test("validateLessonInput: rejects a missing level", () => {
  const result = validateLessonInput(baseLesson({ levelId: "" }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("level")));
});

test("validateLessonInput: rejects a non-positive order", () => {
  const result = validateLessonInput(baseLesson({ orderIndex: 0 }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Order")));
});

test("validateLessonInput: rejects a fractional order", () => {
  const result = validateLessonInput(baseLesson({ orderIndex: 1.5 }));
  assert.equal(result.valid, false);
});

test("validateLessonInput: rejects an invalid publishing status", () => {
  // @ts-expect-error deliberately invalid status, to prove server-side validation doesn't trust the caller's type
  const result = validateLessonInput(baseLesson({ status: "live" }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("status")));
});

test("validateLessonInput: rejects zero sentences", () => {
  const result = validateLessonInput(baseLesson({ sentences: [] }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("sentence")));
});

test("validateLessonInput: rejects a normal lesson with the wrong sentence count", () => {
  const result = validateLessonInput(baseLesson({ sentences: sentencesFor("normal", 5) }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("exactly 9")));
});

test("validateLessonInput: a story below the minimum sentence count is rejected", () => {
  const result = validateLessonInput(
    baseLesson({
      mode: "stories",
      sentences: sentencesFor("stories", MIN_STORY_SENTENCE_COUNT - 1),
    }),
  );
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes(`at least ${MIN_STORY_SENTENCE_COUNT}`)));
});

test("validateLessonInput: a story is NOT forced to exactly 12 sentences — any length at or above the minimum passes", () => {
  for (const count of [MIN_STORY_SENTENCE_COUNT, 9, 10, 12, 14]) {
    const result = validateLessonInput(
      baseLesson({ mode: "stories", sentences: sentencesFor("stories", count) }),
    );
    assert.equal(
      result.valid,
      true,
      `a ${count}-sentence story should be valid, got errors: ${result.errors.join(", ")}`,
    );
  }
});

test("validateLessonInput: rejects a conversation with the wrong line count", () => {
  const result = validateLessonInput(
    baseLesson({ mode: "conversation", sentences: sentencesFor("conversation", 20) }),
  );
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("exactly 30")));
});

test("validateLessonInput: a conversation lesson requires a speaker on every line", () => {
  const sentences = sentencesFor("conversation");
  sentences[1] = { en: "Hi", ar: "أهلا" };
  const result = validateLessonInput(baseLesson({ mode: "conversation", sentences }));
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes("Sentence 2") && e.includes("speaker")));
});

test("validateLessonInput: normal/story lessons don't require a speaker", () => {
  const result = validateLessonInput(baseLesson({ mode: "stories" }));
  assert.equal(result.valid, true);
});

test("validateSentenceInput: rejects blank English text", () => {
  const errors = validateSentenceInput({ en: "   ", ar: "شيء" }, "normal");
  assert.ok(errors.some((e) => e.includes("English")));
});

test("validateSentenceInput: rejects blank Arabic text", () => {
  const errors = validateSentenceInput({ en: "Something", ar: "" }, "normal");
  assert.ok(errors.some((e) => e.includes("Arabic")));
});

test("validateSentenceInput: a missing audio URL is fine — audio is always optional", () => {
  const errors = validateSentenceInput({ en: "Hi", ar: "مرحبا" }, "normal");
  assert.deepEqual(errors, []);
});

test("validateSentenceInput: accepts a well-formed https audio URL", () => {
  const errors = validateSentenceInput(
    { en: "Hi", ar: "مرحبا", audioUrl: "https://cdn.example.com/hi.mp3" },
    "normal",
  );
  assert.deepEqual(errors, []);
});

test("validateSentenceInput: accepts a site-relative audio path", () => {
  const errors = validateSentenceInput(
    { en: "Hi", ar: "مرحبا", audioUrl: "/audio/hi.mp3" },
    "normal",
  );
  assert.deepEqual(errors, []);
});

test("validateSentenceInput: rejects a malformed audio URL", () => {
  const errors = validateSentenceInput({ en: "Hi", ar: "مرحبا", audioUrl: "not a url" }, "normal");
  assert.ok(errors.some((e) => e.includes("Audio URL")));
});

function baseLevel(overrides: Partial<LevelInput> = {}): LevelInput {
  return {
    mode: "normal",
    index: 1,
    title: "Everyday Basics",
    titleAr: "أساسيات يومية",
    ...overrides,
  };
}

test("validateLevelInput: a well-formed level passes", () => {
  const result = validateLevelInput(baseLevel());
  assert.equal(result.valid, true);
});

test("validateLevelInput: rejects a non-integer level number", () => {
  const result = validateLevelInput(baseLevel({ index: 1.5 }));
  assert.equal(result.valid, false);
});

test("validateLevelInput: rejects a level number below 1", () => {
  const result = validateLevelInput(baseLevel({ index: 0 }));
  assert.equal(result.valid, false);
});
