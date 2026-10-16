// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { ar } from "@/lib/i18n/dictionary/ar";
import { en } from "@/lib/i18n/dictionary/en";
import { es } from "@/lib/i18n/dictionary/es";
import { tr } from "@/lib/i18n/dictionary/tr";

import { premiumBenefits } from "./benefits";

const dictionaries = { en, ar, es, tr };

test("until the Passages section is open to everyone, the benefit list is exactly what Premium has always said", () => {
  for (const [name, dictionary] of Object.entries(dictionaries)) {
    const list = premiumBenefits(dictionary.premium, false);
    assert.deepEqual(list, dictionary.premium.benefits, name);
    // A copy: changing what a page got back can never change the dictionary.
    list.push("changed");
    assert.equal(dictionary.premium.benefits.includes("changed"), false, name);
  }
});

test("once the section is open it gets one line of its own, just before the open-ended last one", () => {
  for (const [name, dictionary] of Object.entries(dictionaries)) {
    const base = dictionary.premium.benefits;
    const list = premiumBenefits(dictionary.premium, true);
    assert.equal(list.length, base.length + 1, name);
    assert.equal(list[list.length - 2], dictionary.premium.benefitPassages, name);
    assert.equal(list[list.length - 1], base[base.length - 1], name);
    assert.deepEqual(
      list.filter((line) => line !== dictionary.premium.benefitPassages),
      base,
      name,
    );
  }
  // Nothing to put it before: it simply stands alone.
  assert.deepEqual(premiumBenefits({ benefits: [], benefitPassages: "P" }, true), ["P"]);
});

test("the Passages line names the section the way the app does, and only says things that are true", () => {
  const forbidden =
    /refund|money-back|limited[- ]time|last chance|hurry|only today|ends soon|free trial|launch offer|reembols|devoluci|oferta limitada|última oportunidad|iade|sınırlı süre|son şans|استرجاع|استرداد|عرض محدود|آخر فرصة|عرض الإطلاق/i;
  for (const [name, dictionary] of Object.entries(dictionaries)) {
    const line = dictionary.premium.benefitPassages;
    assert.ok(line.includes(dictionary.passages.title), `${name} names the section: ${line}`);
    assert.equal(/[{}]/.test(line), false, `${name} has no placeholder: ${line}`);
    assert.equal(forbidden.test(line), false, `${name}: ${line}`);
  }
  // An em dash lands at a line's edge in the left-to-right layout around Arabic text.
  assert.equal(ar.premium.benefitPassages.includes("—"), false);
});
