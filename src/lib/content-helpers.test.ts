import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isLearnerVisibleStatus,
  resolveLevelSupportTitle,
  resolveVocabularySupportText,
  withSupportTextFallback,
} from "./content-helpers";
import type { VocabularyItem } from "@/types/content";

test("isLearnerVisibleStatus: published content is visible to learners", () => {
  assert.equal(isLearnerVisibleStatus("published"), true);
});

test("isLearnerVisibleStatus: draft content is never visible to learners", () => {
  assert.equal(isLearnerVisibleStatus("draft"), false);
});

test("isLearnerVisibleStatus: archived content is never visible to learners", () => {
  assert.equal(isLearnerVisibleStatus("archived"), false);
});

// --- withSupportTextFallback (locale routing case 1/4) ---

const previews = {
  1: [{ en: "Hello.", ar: "مرحبا.", es: "Hola." }],
};

test("withSupportTextFallback: Arabic locale backfills supportText from ar", () => {
  const result = withSupportTextFallback(previews, "ar");
  assert.equal(result[1]![0]!.supportText, "مرحبا.");
});

test("withSupportTextFallback: Spanish locale backfills supportText from es", () => {
  const result = withSupportTextFallback(previews, "es");
  assert.equal(result[1]![0]!.supportText, "Hola.");
});

test("withSupportTextFallback: already-resolved supportText is left untouched", () => {
  const withSupportText = {
    1: [{ en: "Hi.", ar: "أهلا.", es: "Hola.", supportText: "already resolved" }],
  };
  const result = withSupportTextFallback(withSupportText, "ar");
  assert.equal(result[1]![0]!.supportText, "already resolved");
});

test("withSupportTextFallback: Turkish locale resolves from sentence.tr when present", () => {
  const withTurkish = { 1: [{ en: "Hi.", ar: "أهلا.", tr: "Merhaba." }] };
  const result = withSupportTextFallback(withTurkish, "tr");
  assert.equal(result[1]![0]!.supportText, "Merhaba.");
});

test("withSupportTextFallback: Turkish locale with no sentence.tr never falls through to another locale's text", () => {
  const result = withSupportTextFallback(previews, "tr");
  assert.equal(result[1]![0]!.supportText, undefined);
});

test("withSupportTextFallback: a genuinely unrecognized locale never falls through to another locale's text", () => {
  // Simulates a future locale reaching this function at runtime before
  // SupportLocale is widened to include it — the type system would
  // normally prevent this, but the runtime behavior must stay safe
  // regardless (see the Phase 2 verification report's finding on the
  // original locale === "ar" ? sentence.ar : sentence.es ternary).
  const result = withSupportTextFallback(previews, "fr" as never);
  assert.equal(result[1]![0]!.supportText, undefined);
});

test("withSupportTextFallback: no locale returns the previews unchanged", () => {
  const result = withSupportTextFallback(previews, undefined);
  assert.equal(result[1]![0]!.supportText, undefined);
});

// --- resolveVocabularySupportText (locale routing case 2/4) ---

const vocab: VocabularyItem = { id: "v1", en: "walk", ar: "يمشي", es: "caminar" };

test("resolveVocabularySupportText: prefers an already-resolved supportText", () => {
  assert.equal(
    resolveVocabularySupportText({ ...vocab, supportText: "resolved" }, "es"),
    "resolved",
  );
});

test("resolveVocabularySupportText: Arabic locale falls back to item.ar", () => {
  assert.equal(resolveVocabularySupportText(vocab, "ar"), "يمشي");
});

test("resolveVocabularySupportText: Spanish locale falls back to item.es", () => {
  assert.equal(resolveVocabularySupportText(vocab, "es"), "caminar");
});

test("resolveVocabularySupportText: Spanish locale with no item.es falls back to English", () => {
  assert.equal(resolveVocabularySupportText({ ...vocab, es: undefined }, "es"), "walk");
});

test("resolveVocabularySupportText: Turkish locale falls back to item.tr", () => {
  assert.equal(resolveVocabularySupportText({ ...vocab, tr: "yürümek" }, "tr"), "yürümek");
});

test("resolveVocabularySupportText: Turkish locale with no item.tr falls back to English", () => {
  assert.equal(resolveVocabularySupportText(vocab, "tr"), "walk");
});

test("resolveVocabularySupportText: a genuinely unrecognized locale falls back to English, never Spanish", () => {
  assert.equal(resolveVocabularySupportText(vocab, "fr" as never), "walk");
});

test("resolveVocabularySupportText: null locale falls back to English", () => {
  assert.equal(resolveVocabularySupportText(vocab, null), "walk");
});

// --- resolveLevelSupportTitle (locale routing case 3/4) ---

test("resolveLevelSupportTitle: Spanish locale returns titleEs", () => {
  assert.equal(resolveLevelSupportTitle("es", "Español", "عربي", "English"), "Español");
});

test("resolveLevelSupportTitle: Arabic locale returns titleAr", () => {
  assert.equal(resolveLevelSupportTitle("ar", "Español", "عربي", "English"), "عربي");
});

test("resolveLevelSupportTitle: Turkish locale returns titleTr when supplied", () => {
  assert.equal(resolveLevelSupportTitle("tr", "Español", "عربي", "English", "Türkçe"), "Türkçe");
});

test("resolveLevelSupportTitle: Turkish locale falls back to the English title when titleTr is missing", () => {
  assert.equal(resolveLevelSupportTitle("tr", "Español", "عربي", "English"), "English");
});

test("resolveLevelSupportTitle: a genuinely unrecognized locale returns the English title, never Arabic's", () => {
  assert.equal(resolveLevelSupportTitle("fr" as never, "Español", "عربي", "English"), "English");
});

test("resolveLevelSupportTitle: null locale returns the English title", () => {
  assert.equal(resolveLevelSupportTitle(null, "Español", "عربي", "English"), "English");
});
