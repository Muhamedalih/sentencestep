import { test } from "node:test";
import assert from "node:assert/strict";

import { dirFor, isSupportLocale, LOCALE_META, SUPPORT_LOCALES } from "./locales";

test("SUPPORT_LOCALES: the locales actually offered to learners today — Arabic, Spanish, and Turkish, English never", () => {
  // English is deliberately excluded — see SUPPORT_LOCALES' own doc
  // comment: it's the language being learned, never a support-language
  // option. This test should be updated deliberately, not incidentally,
  // whenever a locale is added to or removed from the learner-facing
  // selection UI.
  assert.deepEqual([...SUPPORT_LOCALES].sort(), ["ar", "es", "tr"]);
});

test("dirFor: Arabic, Spanish, and Turkish are all ltr (Arabic deliberately not its native rtl)", () => {
  assert.equal(dirFor("ar"), "ltr");
  assert.equal(dirFor("es"), "ltr");
  assert.equal(dirFor("tr"), "ltr");
});

test("isSupportLocale: accepts ar/es/tr, nothing else", () => {
  assert.equal(isSupportLocale("ar"), true);
  assert.equal(isSupportLocale("es"), true);
  assert.equal(isSupportLocale("tr"), true);
  assert.equal(isSupportLocale("en"), false);
  assert.equal(isSupportLocale(null), false);
  assert.equal(isSupportLocale(undefined), false);
  assert.equal(isSupportLocale(""), false);
});

test("LOCALE_META: dir matches dirFor for every locale offered to learners today", () => {
  for (const locale of SUPPORT_LOCALES) {
    assert.equal(LOCALE_META[locale].dir, dirFor(locale));
  }
});

test("LOCALE_META: Arabic uses the Saudi flag, Spanish uses the Spain flag, Turkish uses the Turkey flag", () => {
  assert.equal(LOCALE_META.ar.flag, "🇸🇦");
  assert.equal(LOCALE_META.es.flag, "🇪🇸");
  assert.equal(LOCALE_META.tr.flag, "🇹🇷");
});

test("LOCALE_META.tr: correct English name, native name, and flag country code, matching the ar/es shape", () => {
  assert.equal(LOCALE_META.tr.label, "Turkish");
  assert.equal(LOCALE_META.tr.nativeLabel, "Türkçe");
  assert.equal(LOCALE_META.tr.flagCountryCode, "tr");
});
