import { test } from "node:test";
import assert from "node:assert/strict";

import { resolveScalarField, resolveWordArrayField } from "./content-translations";

test("resolveScalarField: prefers a content_translations row over the legacy column", () => {
  const translations = new Map<string, unknown>([["lesson-1:title", "Nueva lección"]]);
  assert.equal(
    resolveScalarField(translations, "lesson-1", "title", "درس جديد", "es"),
    "Nueva lección",
  );
});

test("resolveScalarField: falls back to the legacy _ar column when locale is ar and no row exists", () => {
  const translations = new Map<string, unknown>();
  assert.equal(resolveScalarField(translations, "lesson-1", "title", "درس جديد", "ar"), "درس جديد");
});

test("resolveScalarField: never falls back to the legacy _ar column for Spanish", () => {
  const translations = new Map<string, unknown>();
  assert.equal(resolveScalarField(translations, "lesson-1", "title", "درس جديد", "es"), undefined);
});

test("resolveScalarField: undefined when nothing is available", () => {
  const translations = new Map<string, unknown>();
  assert.equal(resolveScalarField(translations, "lesson-1", "title", null, "ar"), undefined);
});

test("resolveWordArrayField: prefers a content_translations row over the legacy pairs", () => {
  const translations = new Map<string, unknown>([
    ["sentence-1:word_translations", [{ en: "walked", text: "caminé" }]],
  ]);
  const legacy = [{ en: "walked", ar: "مشيت" }];
  assert.deepEqual(
    resolveWordArrayField(translations, "sentence-1", "word_translations", legacy, "es"),
    [{ en: "walked", text: "caminé" }],
  );
});

test("resolveWordArrayField: reshapes the legacy {en,ar}[] pairs into {en,text}[] for Arabic", () => {
  const translations = new Map<string, unknown>();
  const legacy = [{ en: "walked", ar: "مشيت" }];
  assert.deepEqual(
    resolveWordArrayField(translations, "sentence-1", "word_translations", legacy, "ar"),
    [{ en: "walked", text: "مشيت" }],
  );
});

test("resolveWordArrayField: undefined for Spanish with no row and no legacy fallback", () => {
  const translations = new Map<string, unknown>();
  const legacy = [{ en: "walked", ar: "مشيت" }];
  assert.equal(
    resolveWordArrayField(translations, "sentence-1", "word_translations", legacy, "es"),
    undefined,
  );
});

// --- Turkish: no legacy column of its own ever existed (unlike Arabic), so
// its only path to learner-visible text is a content_translations row —
// same shape as Spanish's tests above, made explicit for the newly-enabled
// locale rather than assumed from Spanish's coverage.

test("resolveScalarField: a content_translations row is returned for Turkish", () => {
  const translations = new Map<string, unknown>([["lesson-1:title", "Yeni ders"]]);
  assert.equal(
    resolveScalarField(translations, "lesson-1", "title", "درس جديد", "tr"),
    "Yeni ders",
  );
});

test("resolveScalarField: never falls back to the legacy _ar column for Turkish", () => {
  const translations = new Map<string, unknown>();
  assert.equal(resolveScalarField(translations, "lesson-1", "title", "درس جديد", "tr"), undefined);
});

test("resolveWordArrayField: a content_translations row is returned for Turkish", () => {
  const translations = new Map<string, unknown>([
    ["sentence-1:word_translations", [{ en: "walked", text: "yürüdüm" }]],
  ]);
  const legacy = [{ en: "walked", ar: "مشيت" }];
  assert.deepEqual(
    resolveWordArrayField(translations, "sentence-1", "word_translations", legacy, "tr"),
    [{ en: "walked", text: "yürüdüm" }],
  );
});

test("resolveWordArrayField: undefined for Turkish with no row and no legacy fallback", () => {
  const translations = new Map<string, unknown>();
  const legacy = [{ en: "walked", ar: "مشيت" }];
  assert.equal(
    resolveWordArrayField(translations, "sentence-1", "word_translations", legacy, "tr"),
    undefined,
  );
});
