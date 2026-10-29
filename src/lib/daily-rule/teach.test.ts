import assert from "node:assert/strict";
import test from "node:test";

import { ALL_RULES } from "@/lib/daily-rule/levels";
import { parseMarked, stripMarks } from "@/lib/daily-rule/marks";
import { TEACH, inLocale, teachFor, type Lines } from "@/lib/daily-rule/teach";
import { SUPPORT_LOCALES } from "@/lib/i18n/locales";

const ARABIC = /[\u0600-\u06FF]/;

function everyLine(): { where: string; lines: Lines }[] {
  const out: { where: string; lines: Lines }[] = [];
  for (const [id, teach] of Object.entries(TEACH)) {
    out.push({ where: `${id} idea`, lines: teach.idea });
    teach.notes.forEach((note, index) =>
      out.push({ where: `${id} note ${index + 1}`, lines: note.say }),
    );
  }
  return out;
}

test("every rule on every ladder has its teaching, and nothing else is taught", () => {
  assert.deepEqual(Object.keys(TEACH).sort(), ALL_RULES.map((rule) => rule.id).sort());
  assert.equal(teachFor("a1-01")?.right, "She [is] at home.");
  assert.equal(teachFor("nope"), undefined);
});

test("the right and the wrong sentence of every rule differ, and each shows its part", () => {
  for (const rule of ALL_RULES) {
    const teach = TEACH[rule.id]!;
    assert.notEqual(
      stripMarks(teach.right),
      stripMarks(teach.wrong),
      `${rule.id}: right and wrong differ`,
    );
    assert.ok(
      parseMarked(teach.right).some((part) => part.marked),
      `${rule.id}: right shows its part`,
    );
    assert.ok(
      parseMarked(teach.wrong).some((part) => part.marked),
      `${rule.id}: wrong shows its part`,
    );
  }
});

test("every line is said in English and in all three languages, each in its own script", () => {
  for (const { where, lines } of everyLine()) {
    assert.ok(lines.en.trim().length > 0, `${where}: en`);
    assert.ok(!ARABIC.test(lines.en), `${where}: en has no Arabic`);
    for (const locale of SUPPORT_LOCALES) {
      assert.ok(lines[locale].trim().length > 0, `${where}: ${locale}`);
      assert.equal(ARABIC.test(lines[locale]), locale === "ar", `${where}: ${locale} script`);
    }
  }
});

test("page one stays short: an idea fits a glance", () => {
  for (const [id, teach] of Object.entries(TEACH)) {
    assert.ok(teach.idea.en.length <= 170, `${id}: ${teach.idea.en.length} characters`);
    for (const locale of SUPPORT_LOCALES) {
      assert.ok(teach.idea[locale].length <= 220, `${id} ${locale}: ${teach.idea[locale].length}`);
    }
  }
});

test("every note on page two comes with a marked example, and no bracket is left open", () => {
  for (const [id, teach] of Object.entries(TEACH)) {
    assert.ok(
      teach.notes.length > 0,
      `${id}: a card with no page two is a choice, not an accident`,
    );
    for (const note of teach.notes) {
      assert.ok(note.examples.length > 0, `${id}: a note with no example`);
      for (const example of note.examples) {
        assert.ok(
          parseMarked(example).some((part) => part.marked),
          `${id}: ${example}`,
        );
        assert.ok(!/[[\]]/.test(stripMarks(example)), `${id}: ${example}`);
      }
    }
  }
});

test("a line is read in the learner's language, Arabic until one is chosen", () => {
  const idea = teachFor("a1-01")!.idea;
  assert.equal(inLocale(idea, "es"), idea.es);
  assert.equal(inLocale(idea, "tr"), idea.tr);
  assert.equal(inLocale(idea, null), idea.ar);
});
