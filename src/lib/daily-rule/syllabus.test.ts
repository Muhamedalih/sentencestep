import assert from "node:assert/strict";
import test from "node:test";

import { stripMarks } from "@/lib/daily-rule/marks";
import { parsePrepared } from "@/lib/daily-rule/items";
import { A1_LADDER } from "@/lib/daily-rule/ladder";
import { A2_LADDER, B2_LADDER } from "@/lib/daily-rule/ladder-higher";
import { ALL_RULES } from "@/lib/daily-rule/levels";
import { candidatesFor } from "@/lib/daily-rule/matchers";
import { preparedItemsForCard } from "@/lib/daily-rule/prepared";
import { SYLLABUS } from "@/lib/daily-rule/syllabus";
import { TEACH } from "@/lib/daily-rule/teach";
import { tokenize } from "@/lib/daily-rule/tokens";
import { UNITS, unitById } from "@/lib/daily-rule/units";

const MARK_STYLES = ["ing", "ed", "s", "er", "est", "ly", "ed-ing", "possessive", "whole"];

test("the syllabus: 150 rules, A1 45, A2–B1 60, B2 45, each id used once", () => {
  assert.equal(SYLLABUS.length, 150);
  assert.deepEqual([A1_LADDER.length, A2_LADDER.length, B2_LADDER.length], [45, 60, 45]);
  const ids = SYLLABUS.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const [ladder, level, prefix] of [
    [A1_LADDER, "A1", "a1"],
    [A2_LADDER, "A2-B1", "a2"],
    [B2_LADDER, "B2", "b2"],
  ] as const) {
    ladder.forEach((rule, index) => {
      assert.equal(rule.order, index + 1, `${rule.id} order`);
      assert.equal(rule.level, level, `${rule.id} level`);
      assert.match(rule.id, new RegExp(`^${prefix}-\\d{2}$`));
    });
  }
});

test("the ids are numbered without gaps, so a rule added later gets the next free number", () => {
  for (const [ladder, prefix, count] of [
    [A1_LADDER, "a1", 45],
    [A2_LADDER, "a2", 60],
    [B2_LADDER, "b2", 45],
  ] as const) {
    const wanted = Array.from(
      { length: count },
      (_, index) => `${prefix}-${String(index + 1).padStart(2, "0")}`,
    );
    assert.deepEqual(ladder.map((rule) => rule.id).sort(), wanted);
  }
});

test("the first 39 rules keep their titles, because their ids are stored per learner", () => {
  const titles = new Map(SYLLABUS.map((rule) => [rule.id, rule.title]));
  assert.equal(titles.get("a1-01"), "am / is / are");
  assert.equal(titles.get("a1-24"), "some / any");
  assert.equal(titles.get("a2-01"), "am / is / are + -ing");
  assert.equal(titles.get("a2-08"), "many / much");
  assert.equal(titles.get("b2-01"), "if + past, would");
  assert.equal(titles.get("b2-07"), "verb + -ing");
});

test("every rule is in a unit of its own level, and the rules of a unit follow one another", () => {
  for (const level of ["A1", "A2-B1", "B2"] as const) {
    const rules = SYLLABUS.filter((rule) => rule.level === level);
    const seen: string[] = [];
    for (const rule of rules) {
      const unit = unitById(rule.unit);
      assert.ok(unit, `${rule.id}: unit ${rule.unit} exists`);
      assert.equal(unit.level, level, `${rule.id}: unit of its level`);
      if (seen[seen.length - 1] !== rule.unit) {
        assert.ok(!seen.includes(rule.unit), `${rule.id}: unit ${rule.unit} is not split in two`);
        seen.push(rule.unit);
      }
    }
    assert.deepEqual(
      seen,
      UNITS.filter((unit) => unit.level === level).map((unit) => unit.id),
      `${level}: the units open in the order the map lists them`,
    );
  }
});

test("every unit has its name in all four languages and at least three rules", () => {
  for (const unit of UNITS) {
    for (const locale of ["en", "ar", "es", "tr"] as const) {
      assert.ok(unit.title[locale].trim().length > 0, `${unit.id} ${locale}`);
    }
    assert.ok(SYLLABUS.filter((rule) => rule.unit === unit.id).length >= 3, unit.id);
  }
});

test("every rule has a mark style that exists, a family and a title", () => {
  for (const rule of SYLLABUS) {
    assert.ok(rule.title.length > 0 && rule.family.length > 0, rule.id);
    if (rule.mark) assert.ok(MARK_STYLES.includes(rule.mark), `${rule.id}: ${rule.mark}`);
  }
});

test("every rule is taught: a right and a wrong sentence, notes, and six prepared sentences", () => {
  for (const rule of ALL_RULES) {
    const teach = TEACH[rule.id];
    assert.ok(teach, `${rule.id}: has teaching`);
    assert.ok(teach.notes.length > 0, `${rule.id}: has notes`);
    const items = teach.items ?? [];
    assert.ok(
      items.length >= 5 && items.length <= 8,
      `${rule.id}: ${items.length} prepared sentences`,
    );
    const texts = new Set<string>();
    for (const raw of items) {
      const parsed = parsePrepared(raw);
      assert.ok(parsed, `${rule.id}: «${raw}» reads as a question`);
      assert.ok(parsed.text.includes(parsed.answer), `${rule.id}: the answer is in the sentence`);
      assert.ok(!texts.has(parsed.text), `${rule.id}: «${parsed.text}» is not repeated`);
      texts.add(parsed.text);
      assert.ok(
        !/[\]{}[]/.test(parsed.before + parsed.after),
        `${rule.id}: «${raw}» has one blank only`,
      );
    }
  }
});

test("a rule with a matcher finds its own right sentence in a story, and one with none says so", () => {
  for (const rule of ALL_RULES) {
    const right = stripMarks(TEACH[rule.id]!.right);
    const found = candidatesFor(rule.match, tokenize(right), right);
    if (rule.match === "none") assert.deepEqual(found, [], `${rule.id}: no matcher`);
    else assert.ok(found.length > 0, `${rule.id} (${rule.match}): ${right}`);
  }
  const without = ALL_RULES.filter((rule) => rule.match === "none").map((rule) => rule.id);
  assert.equal(without.length, 20, `${without.length} rules have no matcher`);
});

test("the card's examples and typed sentences never repeat the right sentence it shows above them", () => {
  for (const rule of ALL_RULES) {
    const right = stripMarks(TEACH[rule.id]!.right).trim();
    const used = preparedItemsForCard(rule).slice(0, 5);
    assert.equal(used.length, 5, rule.id);
    for (const item of used) assert.notEqual(item.text.trim(), right, `${rule.id}: ${right}`);
  }
});
