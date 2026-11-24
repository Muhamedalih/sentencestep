import assert from "node:assert/strict";
import test from "node:test";

import { parsePrepared } from "@/lib/daily-rule/items";
import { DE_A1_LADDER, DE_A2_LADDER, DE_B2_LADDER } from "@/lib/daily-rule/de/ladders";
import { DE_SYLLABUS } from "@/lib/daily-rule/de/syllabus";
import { DE_UNITS } from "@/lib/daily-rule/de/units";
import { stripMarks } from "@/lib/daily-rule/marks";
import { ALL_DE_RULES, languageOfRuleId, neighbourRules, ruleById } from "@/lib/daily-rule/levels";
import { candidatesFor } from "@/lib/daily-rule/matchers";
import { teachFor } from "@/lib/daily-rule/teach";
import { diagnoseAny, normalizeAnswer, tokenize } from "@/lib/daily-rule/tokens";
import { unitById } from "@/lib/daily-rule/units";

const ARABIC = /[؀-ۿ]/;
// DE_ONLY="de-a1" (a regular expression) checks only the matching rule ids, for a quick run while editing.
const ONLY = new RegExp(process.env.DE_ONLY ?? "");
const RULES = ALL_DE_RULES.filter((rule) => ONLY.test(rule.id));

test("the German syllabus: 150 rules, A1 45, A2–B1 60, B2 45, ids de-a1-01 ... de-b2-45 without gaps", () => {
  assert.equal(DE_SYLLABUS.length, 150);
  assert.deepEqual([DE_A1_LADDER.length, DE_A2_LADDER.length, DE_B2_LADDER.length], [45, 60, 45]);
  for (const [ladder, prefix] of [
    [DE_A1_LADDER, "a1"],
    [DE_A2_LADDER, "a2"],
    [DE_B2_LADDER, "b2"],
  ] as const) {
    assert.deepEqual(
      ladder.map((rule) => rule.id),
      ladder.map((_, index) => `de-${prefix}-${String(index + 1).padStart(2, "0")}`),
    );
  }
  for (const rule of ALL_DE_RULES) {
    assert.ok(
      rule.id.length >= 4 && rule.id.length <= 12,
      `${rule.id} fits the learner_rules column`,
    );
    assert.equal(languageOfRuleId(rule.id), "de");
    assert.equal(ruleById(rule.id)?.id, rule.id);
  }
});

test("every German rule is in a unit of its own level and the units are not split", () => {
  for (const level of ["A1", "A2-B1", "B2"] as const) {
    const seen: string[] = [];
    for (const rule of DE_SYLLABUS.filter((entry) => entry.level === level)) {
      const unit = unitById(rule.unit);
      assert.ok(unit, `${rule.id}: unit ${rule.unit} exists`);
      assert.equal(unit.level, level);
      if (seen[seen.length - 1] !== rule.unit) {
        assert.ok(!seen.includes(rule.unit), `${rule.id}: unit ${rule.unit} is split`);
        seen.push(rule.unit);
      }
    }
    assert.deepEqual(
      seen,
      DE_UNITS.filter((unit) => unit.level === level).map((unit) => unit.id),
    );
  }
});

test("every German rule teaches: four languages, a right and a wrong sentence, at least five prepared sentences", () => {
  for (const rule of RULES) {
    const teach = teachFor(rule.id);
    assert.ok(teach, `${rule.id} has a teach entry`);
    for (const lang of ["en", "ar", "es", "tr"] as const)
      assert.ok(teach.idea[lang].trim().length > 10, `${rule.id} idea ${lang}`);
    assert.ok(stripMarks(teach.right).trim().length > 0, `${rule.id} right`);
    assert.ok(/\[[^\]]+\]/.test(teach.right), `${rule.id} right has a [mark]`);
    assert.ok(/\[[^\]]+\]/.test(teach.wrong), `${rule.id} wrong has a [mark]`);
    for (const noteItem of teach.notes) {
      for (const lang of ["en", "ar", "es", "tr"] as const)
        assert.ok(noteItem.say[lang].trim().length > 10, `${rule.id} note ${lang}`);
      assert.ok(noteItem.examples.length > 0, `${rule.id} note has an example`);
    }
    const items = (teach.items ?? []).map((raw) => parsePrepared(raw));
    assert.ok(items.length >= 5, `${rule.id}: at least 5 prepared sentences`);
    items.forEach((item, index) => assert.ok(item, `${rule.id}: sentence ${index + 1} parses`));
    assert.equal(new Set(teach.items).size, teach.items?.length, `${rule.id}: no sentence twice`);
  }
});

test("Arabic script only in the Arabic lines (the es, tr and en lines never quote Arabic)", () => {
  for (const rule of RULES) {
    const teach = teachFor(rule.id)!;
    for (const lang of ["en", "es", "tr"] as const) {
      assert.ok(!ARABIC.test(teach.idea[lang]), `${rule.id} idea ${lang}`);
      for (const noteItem of teach.notes)
        assert.ok(!ARABIC.test(noteItem.say[lang]), `${rule.id} note ${lang}`);
    }
    for (const sentence of [teach.right, teach.wrong, ...(teach.items ?? [])])
      assert.ok(!ARABIC.test(sentence), `${rule.id}: a German sentence has no Arabic`);
  }
});

test("a rule with a matcher finds the blank of at least one of its prepared sentences", () => {
  const misses: string[] = [];
  for (const rule of RULES) {
    if (rule.match === "none") continue;
    const items = (teachFor(rule.id)?.items ?? []).map((raw) => parsePrepared(raw)!);
    const found = items.filter((item) => {
      const tokens = tokenize(item.text);
      const [index] = candidatesFor(rule.match, tokens, item.text);
      return index !== undefined && tokens[index]!.text.toLowerCase() === item.answer.toLowerCase();
    });
    if (found.length === 0) misses.push(`${rule.id} (${rule.match})`);
  }
  assert.deepEqual(misses, []);
});

test("a matcher never blanks a word the sentence does not hold", () => {
  for (const rule of RULES) {
    if (rule.match === "none") continue;
    const items = (teachFor(rule.id)?.items ?? []).map((raw) => parsePrepared(raw)!);
    for (const item of items) {
      const tokens = tokenize(item.text);
      for (const index of candidatesFor(rule.match, tokens, item.text))
        assert.ok(tokens[index], `${rule.id}: candidate ${index} is a word`);
    }
  }
});

test("typing: ä ö ü ß are accepted as a o u ss, and capital letters do not count", () => {
  assert.equal(normalizeAnswer("Möchte"), normalizeAnswer("mochte"));
  assert.equal(normalizeAnswer("weiß"), normalizeAnswer("weiss"));
  assert.equal(diagnoseAny("fahrt", ["fährt"]), "correct");
  assert.equal(diagnoseAny("sind", ["seid"]), "other");
});

test("the admin arrows stay inside the German course", () => {
  assert.equal(neighbourRules("de-a1-01").previous, undefined);
  assert.equal(neighbourRules("de-a1-01").next?.id, "de-a1-02");
  assert.equal(neighbourRules("de-a1-45").next?.id, "de-a2-01");
  assert.equal(neighbourRules("de-b2-45").next, undefined);
});
