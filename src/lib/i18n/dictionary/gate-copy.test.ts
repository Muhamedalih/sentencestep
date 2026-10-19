// Run with `npm run test:i18n`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { ar } from "./ar";
import { en } from "./en";
import { es } from "./es";
import { tr } from "./tr";

const dictionaries = { en, ar, es, tr };

function gateStrings(dictionary: typeof en): Record<string, string> {
  return {
    "premium.gateHeading": dictionary.premium.gateHeading,
    "premium.gateSubheading": dictionary.premium.gateSubheading,
    "premium.gateBenefitLibrary": dictionary.premium.gateBenefitLibrary,
    "premium.gateBenefitLibraryPlain": dictionary.premium.gateBenefitLibraryPlain,
    "premium.gateBenefitMethod": dictionary.premium.gateBenefitMethod,
    "premium.gateBenefitProgress": dictionary.premium.gateBenefitProgress,
    "premium.gateCta": dictionary.premium.gateCta,
    "premium.gateTrust": dictionary.premium.gateTrust,
    "wordLists.gateHeading": dictionary.wordLists.gateHeading,
    "wordLists.gateSubheading": dictionary.wordLists.gateSubheading,
    "wordLists.gateBenefitLists": dictionary.wordLists.gateBenefitLists,
    "wordLists.gateBenefitListsPlain": dictionary.wordLists.gateBenefitListsPlain,
    "wordLists.gateBenefitContext": dictionary.wordLists.gateBenefitContext,
    "wordLists.gateBenefitReview": dictionary.wordLists.gateBenefitReview,
  };
}

test("the locked-content card fills its placeholders in every language", () => {
  for (const [name, dictionary] of Object.entries(dictionaries)) {
    assert.match(dictionary.premium.gateBenefitLibrary, /\{count\}/, `${name} gateBenefitLibrary`);
    assert.equal(
      /\{/.test(dictionary.premium.gateBenefitLibraryPlain),
      false,
      `${name} plain library`,
    );
    assert.match(dictionary.wordLists.gateBenefitLists, /\{lists\}/, `${name} lists`);
    assert.match(dictionary.wordLists.gateBenefitLists, /\{words\}/, `${name} words`);
    assert.equal(
      /\{/.test(dictionary.wordLists.gateBenefitListsPlain),
      false,
      `${name} plain lists`,
    );
    // The price line under the button is built from this one, so it must keep its slot.
    assert.match(dictionary.premium.fromPerMonthCaption, /\{amount\}/, `${name} price caption`);
  }
});

test("the locked-content card only says things that are true: no refunds, deadlines, scarcity or free offers", () => {
  const forbidden =
    /refund|money-back|limited[- ]time|last chance|hurry|only today|ends soon|free trial|launch offer|reembols|devoluci|oferta limitada|última oportunidad|iade|sınırlı süre|son şans|استرجاع|استرداد|عرض محدود|آخر فرصة|عرض الإطلاق/i;
  for (const [name, dictionary] of Object.entries(dictionaries)) {
    for (const [key, value] of Object.entries(gateStrings(dictionary))) {
      assert.equal(forbidden.test(value), false, `${name} ${key}: ${value}`);
    }
  }
});

test("the Arabic card text has no em dash, which lands at a line edge in the left-to-right layout", () => {
  for (const [key, value] of Object.entries(gateStrings(ar))) {
    assert.equal(value.includes("—"), false, `${key}: ${value}`);
  }
});

test("the card promises what the product does: one payment, no auto-renewal", () => {
  assert.match(en.premium.gateTrust, /One payment/);
  assert.match(en.premium.gateTrust, /No auto-renewal/);
  assert.match(es.premium.gateTrust, /Sin renovación automática/);
  assert.match(tr.premium.gateTrust, /Otomatik yenileme yok/);
  assert.match(ar.premium.gateTrust, /بدون تجديد تلقائي/);
});

function freePathStrings(dictionary: typeof en): Record<string, string> {
  return Object.fromEntries(
    Object.entries(dictionary.freePath).map(([key, value]) => [`freePath.${key}`, value]),
  );
}

test("the free-path screens only say things that are true: no refunds, deadlines, scarcity or free offers", () => {
  const forbidden =
    /refund|money-back|limited[- ]time|last chance|hurry|only today|ends soon|free trial|launch offer|reembols|devoluci|oferta limitada|última oportunidad|iade|sınırlı süre|son şans|استرجاع|استرداد|عرض محدود|آخر فرصة|عرض الإطلاق/i;
  for (const [name, dictionary] of Object.entries(dictionaries)) {
    for (const [key, value] of Object.entries(freePathStrings(dictionary))) {
      assert.equal(forbidden.test(value), false, `${name} ${key}: ${value}`);
    }
  }
});

test("the free-path Arabic text has no em dash, which lands at a line edge in the left-to-right layout", () => {
  for (const [key, value] of Object.entries(freePathStrings(ar))) {
    assert.equal(value.includes("—"), false, `${key}: ${value}`);
  }
});

test("the short look at a locked passage or word list keeps its placeholders in every language", () => {
  for (const [name, dictionary] of Object.entries(dictionaries)) {
    const f = dictionary.freePath;
    for (const key of ["previewPassageTitle", "previewWordsTitle"] as const) {
      assert.match(f[key], /\{n\}/, `${name} ${key}`);
    }
  }
});

test("the button on the short look at locked content says it unlocks and keeps the price slot in every language", () => {
  // The old wording ("Continue the lesson") read as a free way on, and people tapped it expecting one.
  const readsAsFree = /continue the|keep reading|continúa|sigue leyendo|devam edin|أكمل|تابع/i;
  for (const [name, dictionary] of Object.entries(dictionaries)) {
    const f = dictionary.freePath;
    for (const key of ["previewPassageCta", "previewWordsCta"] as const) {
      assert.match(f[key], /\{amount\}/, `${name} ${key} keeps the price slot`);
      assert.equal(readsAsFree.test(f[key]), false, `${name} ${key} reads as free: ${f[key]}`);
    }
  }
});
