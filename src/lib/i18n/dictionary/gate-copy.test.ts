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
