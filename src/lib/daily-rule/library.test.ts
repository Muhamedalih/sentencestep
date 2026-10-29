import assert from "node:assert/strict";
import test from "node:test";

import { buildLibrary } from "@/lib/daily-rule/library";
import { A1_LADDER } from "@/lib/daily-rule/ladder";
import { teachFor } from "@/lib/daily-rule/teach";
import type { RuleStateRow } from "@/lib/daily-rule/visit";

const TODAY = "2026-10-29";

function row(ruleId: string, strength: number, dueOn: string): RuleStateRow {
  return { ruleId, strength, dueOn };
}

/** Every rule of a unit of the map, in order. */
function unitRules(library: ReturnType<typeof buildLibrary>, level: string, unit: string) {
  return (
    library.levels.find((l) => l.label === level)?.units.find((u) => u.id === unit)?.rules ?? []
  );
}

test("a learner who has met nothing sees the whole map of their level, the first rule next", () => {
  const library = buildLibrary({ states: [], today: TODAY, level: 1, locale: "ar" });
  assert.equal(library.met, 0);
  assert.deepEqual(library.due, []);
  assert.deepEqual(
    library.levels.map((level) => [level.label, level.current, level.met, level.total]),
    [["A1", true, 0, 45]],
  );
  assert.deepEqual(library.current, { label: "A1", met: 0, total: 45 });
  const [first, second] = library.levels[0]!.units[0]!.rules;
  assert.equal(first?.id, A1_LADDER[0]!.id);
  assert.equal(first?.state, "next");
  assert.equal(second?.state, "ahead");
  assert.equal(first?.idea, "", "a rule not met yet shows its title only");
});

test("the units of a level are in the order of the syllabus, and their rules add up to the level", () => {
  const library = buildLibrary({ states: [], today: TODAY, level: 2, locale: "ar" });
  const level = library.levels[0]!;
  assert.equal(level.label, "A2–B1");
  assert.equal(level.units.length, 9);
  assert.equal(
    level.units.reduce((sum, unit) => sum + unit.total, 0),
    60,
  );
  assert.deepEqual(level.units.flatMap((unit) => unit.rules.map((rule) => rule.id)).slice(0, 3), [
    "a2-01",
    "a2-09",
    "a2-10",
  ]);
  assert.equal(level.units[0]!.open, true, "the unit with the next rule is open");
  assert.equal(level.units[1]!.open, false);
});

test("a rule whose day has come is listed first; the others keep their place on the map", () => {
  const library = buildLibrary({
    states: [
      row("a1-05", 2, TODAY),
      row("a1-02", 1, "2026-11-01"),
      row("a1-04", 0, "2026-10-28"),
      row("a1-01", 3, "2026-11-05"),
    ],
    today: TODAY,
    level: 1,
    locale: "ar",
  });
  assert.equal(library.met, 4);
  assert.deepEqual(
    library.due.map((rule) => rule.id),
    ["a1-04", "a1-05"],
    "the one that waited longest comes first",
  );
  assert.equal(library.current?.met, 4);
  const basics = unitRules(library, "A1", "a1-basics");
  assert.deepEqual(
    basics
      .filter((rule) => rule.state === "held" || rule.state === "learning")
      .map((rule) => [rule.id, rule.state]),
    [
      ["a1-01", "held"],
      ["a1-02", "learning"],
    ],
  );
  assert.equal(
    unitRules(library, "A1", "a1-present").find((rule) => rule.id === "a1-04")?.state,
    "due",
  );
});

test("the rule that opens next is the first one not met in the order of the syllabus", () => {
  const library = buildLibrary({
    states: [row(A1_LADDER[0]!.id, 1, "2026-11-02"), row(A1_LADDER[1]!.id, 1, "2026-11-02")],
    today: TODAY,
    level: 1,
    locale: "ar",
  });
  const states = library.levels[0]!.units.flatMap((unit) => unit.rules.map((rule) => rule.state));
  assert.equal(states.filter((state) => state === "next").length, 1);
  assert.equal(states.indexOf("next"), 2);
});

test("rules due on the same day stay in the order of the ladder", () => {
  const library = buildLibrary({
    states: [row("a1-07", 0, "2026-10-28"), row("a1-03", 0, "2026-10-28")],
    today: TODAY,
    level: 1,
    locale: null,
  });
  assert.deepEqual(
    library.due.map((rule) => rule.id),
    ["a1-03", "a1-07"],
    "a1-03 opens before a1-07 on the A1 map",
  );
});

test("the dots count the clean days up to three, whatever the strength", () => {
  const library = buildLibrary({
    states: [
      row("a1-01", 0, "2026-11-02"),
      row("a1-02", 2, "2026-11-02"),
      row("a1-03", 5, "2026-12-02"),
    ],
    today: TODAY,
    level: 1,
    locale: "ar",
  });
  const found = unitRules(library, "A1", "a1-basics").filter(
    (rule) => rule.state !== "ahead" && rule.state !== "next",
  );
  assert.deepEqual(
    found.map((rule) => [rule.id, rule.dots, rule.state]),
    [
      ["a1-01", 0, "learning"],
      ["a1-02", 2, "learning"],
      ["a1-03", 3, "held"],
    ],
  );
});

test("a held rule that has come due is listed as due, not held", () => {
  const library = buildLibrary({
    states: [row("a1-01", 4, TODAY)],
    today: TODAY,
    level: 1,
    locale: "ar",
  });
  assert.equal(library.due[0]?.status, "due");
  assert.equal(library.due[0]?.dots, 3);
  assert.equal(
    unitRules(library, "A1", "a1-basics").find((rule) => rule.id === "a1-01")?.state,
    "due",
  );
});

test("a level the learner has met a rule of stays on the map, and the course level is the one counted", () => {
  const library = buildLibrary({
    states: [row("a1-01", 3, "2026-12-01"), row("b2-07", 1, "2026-11-02")],
    today: TODAY,
    level: 3,
    locale: "ar",
  });
  assert.deepEqual(
    library.levels.map((level) => [level.label, level.current, level.met]),
    [
      ["A1", false, 1],
      ["B2", true, 1],
    ],
  );
  assert.deepEqual(library.current, { label: "B2", met: 1, total: 45 });
  const open = library.levels
    .find((level) => level.label === "A1")!
    .units.some((unit) => unit.open);
  assert.equal(open, false, "only the level the course is on opens its units by itself");
});

test("a learner who has met every rule of A1 is on A2–B1, with A1 still on the map", () => {
  const states = A1_LADDER.map((rule) => row(rule.id, 3, "2027-01-01"));
  const library = buildLibrary({ states, today: TODAY, level: 1, locale: "ar" });
  assert.deepEqual(
    library.levels.map((level) => [level.label, level.current, level.met, level.total]),
    [
      ["A1", false, 45, 45],
      ["A2–B1", true, 0, 60],
    ],
  );
  assert.deepEqual(library.current, { label: "A2–B1", met: 0, total: 60 });
});

test("a row with an id that is on no ladder is left out, and a level with no ladder has no count", () => {
  const library = buildLibrary({
    states: [row("a1-01", 1, "2026-11-02"), row("zz-99", 1, "2026-11-02")],
    today: TODAY,
    level: 4,
    locale: "ar",
  });
  assert.equal(library.met, 1);
  assert.deepEqual(
    library.levels.map((level) => level.label),
    ["A1"],
    "the level 4 has no ladder, and A1 is shown because a rule of it is met",
  );
  assert.equal(library.current, null);
});

test("the idea and the unit's name are in the learner's language, Arabic until one is chosen", () => {
  const states = [row("a1-01", 1, "2026-11-02")];
  const idea = teachFor("a1-01")!.idea;
  const ideaOf = (locale: "es" | "tr" | null) =>
    unitRules(buildLibrary({ states, today: TODAY, level: 1, locale }), "A1", "a1-basics").find(
      (rule) => rule.id === "a1-01",
    )?.idea;
  assert.equal(ideaOf("es"), idea.es);
  assert.equal(ideaOf("tr"), idea.tr);
  assert.equal(ideaOf(null), idea.ar);
  const title = (locale: "es" | null) =>
    buildLibrary({ states, today: TODAY, level: 1, locale }).levels[0]!.units[0]!.title;
  assert.equal(title(null), "الأساسيات");
  assert.equal(title("es"), "Lo básico");
});
