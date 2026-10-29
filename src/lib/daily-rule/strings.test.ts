import assert from "node:assert/strict";
import test from "node:test";

import { fill, RULE_STRINGS, ruleStrings, ruleTextDir } from "@/lib/daily-rule/strings";
import { SUPPORT_LOCALES } from "@/lib/i18n/locales";

const placeholders = (line: string): string[] => (line.match(/\{\w+\}/g) ?? []).sort();

test("every label is written in every language, and none is empty", () => {
  const keys = Object.keys(RULE_STRINGS.ar).sort();
  for (const locale of SUPPORT_LOCALES) {
    assert.deepEqual(Object.keys(RULE_STRINGS[locale]).sort(), keys, locale);
    for (const key of keys) {
      const value = RULE_STRINGS[locale][key as keyof (typeof RULE_STRINGS)["ar"]];
      if (typeof value === "string") assert.ok(value.trim().length > 0, `${locale}.${key}`);
    }
  }
});

test("a label that carries a number or a name carries it in every language", () => {
  for (const key of Object.keys(RULE_STRINGS.ar) as (keyof (typeof RULE_STRINGS)["ar"])[]) {
    const ar = RULE_STRINGS.ar[key];
    if (typeof ar !== "string") continue;
    for (const locale of SUPPORT_LOCALES) {
      const line = RULE_STRINGS[locale][key] as string;
      assert.deepEqual(placeholders(line), placeholders(ar), `${locale}.${key}`);
    }
  }
});

test("the library's lines fill in their numbers", () => {
  const ar = ruleStrings("ar");
  assert.equal(fill(ar.myRulesPill, { n: 3 }), "قواعدي · 3");
  assert.equal(fill(ar.youAreIn, { level: "A1" }), "أنت في A1");
  assert.equal(fill(ruleStrings("es").practiceScore, { n: 2, total: 3 }), "2 de 3 correctas");
  assert.equal(fill(ruleStrings("tr").youAreIn, { level: "A2–B1" }), "Şu an A2–B1 seviyesindesin");
});

test("a line of a rule reads right to left in Arabic, and left to right in the other languages", () => {
  assert.equal(ruleTextDir("ar"), "rtl");
  assert.equal(ruleTextDir(null), "rtl");
  assert.equal(ruleTextDir("es"), "ltr");
  assert.equal(ruleTextDir("tr"), "ltr");
});
