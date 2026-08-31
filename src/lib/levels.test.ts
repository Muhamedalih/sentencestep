import assert from "node:assert/strict";
import { test } from "node:test";

import { splitLevelTitle, tierSupportLabel } from "./levels";

// --- tierSupportLabel (locale routing case 4/4) ---

test("tierSupportLabel: Arabic locale returns the Arabic tier label", () => {
  assert.equal(tierSupportLabel("beginner", "ar"), "مبتدئ");
});

test("tierSupportLabel: Spanish locale returns the Spanish tier label", () => {
  assert.equal(tierSupportLabel("beginner", "es"), "Principiante");
});

test("tierSupportLabel: Turkish locale returns the Turkish tier label", () => {
  assert.equal(tierSupportLabel("beginner", "tr"), "Başlangıç");
});

test("tierSupportLabel: an unrecognized locale throws instead of silently returning the wrong language", () => {
  // Simulates a future locale (e.g. "fr") reaching this function at
  // runtime before SupportLocale is widened to include it and TierConfig
  // gains a matching field — the type system normally prevents this call
  // from compiling at all (that's the point of the exhaustiveness switch,
  // which caught exactly this when Turkish was actually added — see the
  // Phase 2 verification report's finding on the original
  // locale === "ar" ? config.labelAr : config.labelEs ternary), but the
  // runtime behavior must still fail loudly, not silently return another
  // locale's label.
  assert.throws(() => tierSupportLabel("beginner", "fr" as never), /unhandled locale "fr"/);
});

// --- splitLevelTitle (RTL/bidi isolation for the admin level label — see the
// Admin Levels page, which renders the Arabic title in a dir="rtl" span) ---

test("splitLevelTitle: splits the trailing CEFR code off an em-dash-separated title", () => {
  assert.deepEqual(splitLevelTitle("متقدم — B2+"), { label: "متقدم", code: "B2+" });
});

test("splitLevelTitle: a title with no em-dash separator is returned unchanged, with a null code", () => {
  assert.deepEqual(splitLevelTitle("مبتدئ"), { label: "مبتدئ", code: null });
});

test("splitLevelTitle: splits on the LAST em-dash when the label itself contains one", () => {
  assert.deepEqual(splitLevelTitle("A — B — C2"), { label: "A — B", code: "C2" });
});
