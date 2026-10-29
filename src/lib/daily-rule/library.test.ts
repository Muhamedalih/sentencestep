import assert from "node:assert/strict";
import test from "node:test";

import { buildLibrary } from "@/lib/daily-rule/library";
import { teachFor } from "@/lib/daily-rule/teach";
import type { RuleStateRow } from "@/lib/daily-rule/visit";

const TODAY = "2026-10-29";

function row(ruleId: string, strength: number, dueOn: string): RuleStateRow {
  return { ruleId, strength, dueOn };
}

test("a learner who has met nothing has an empty library and every rule of their level ahead", () => {
  const library = buildLibrary({ states: [], today: TODAY, level: 1, locale: "ar" });
  assert.equal(library.met, 0);
  assert.deepEqual(library.due, []);
  assert.deepEqual(library.kept, []);
  assert.deepEqual(library.levels, []);
  assert.equal(library.current?.label, "A1");
  assert.equal(library.current?.met, 0);
  assert.equal(library.current?.total, 24);
  assert.equal(library.current?.upcoming.length, 24);
  assert.equal(library.current?.upcoming[0], "am / is / are");
});

test("a rule whose day has come is listed first; the others keep the order of the ladder", () => {
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
  assert.deepEqual(
    library.kept.map((rule) => rule.id),
    ["a1-01", "a1-02"],
  );
  assert.deepEqual(
    library.kept.map((rule) => rule.status),
    ["held", "learning"],
  );
  assert.equal(library.current?.met, 4);
  assert.equal(library.current?.upcoming.length, 20);
  assert.ok(!library.current?.upcoming.includes("he / she / it + -s"));
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
  assert.deepEqual(
    library.kept.map((rule) => [rule.id, rule.dots, rule.status]),
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
  assert.equal(library.kept.length, 0);
});

test("rules of two levels are all listed, with the levels named, and the learner's level counts only its own", () => {
  const library = buildLibrary({
    states: [row("a1-01", 3, "2026-12-01"), row("b2-07", 1, "2026-11-02")],
    today: TODAY,
    level: 3,
    locale: "ar",
  });
  assert.deepEqual(
    library.kept.map((rule) => [rule.id, rule.levelLabel]),
    [
      ["a1-01", "A1"],
      ["b2-07", "B2"],
    ],
  );
  assert.deepEqual(library.levels, ["A1", "B2"]);
  assert.equal(library.current?.label, "B2");
  assert.equal(library.current?.met, 1);
  assert.equal(library.current?.total, 7);
});

test("a row with an id that is on no ladder is left out, and a level with no ladder has no count", () => {
  const library = buildLibrary({
    states: [row("a1-01", 1, "2026-11-02"), row("zz-99", 1, "2026-11-02")],
    today: TODAY,
    level: 4,
    locale: "ar",
  });
  assert.equal(library.met, 1);
  assert.equal(library.current, null);
});

test("the idea is in the learner's language, Arabic until one is chosen", () => {
  const states = [row("a1-01", 1, "2026-11-02")];
  const idea = teachFor("a1-01")!.idea;
  assert.equal(
    buildLibrary({ states, today: TODAY, level: 1, locale: "es" }).kept[0]?.idea,
    idea.es,
  );
  assert.equal(
    buildLibrary({ states, today: TODAY, level: 1, locale: "tr" }).kept[0]?.idea,
    idea.tr,
  );
  assert.equal(
    buildLibrary({ states, today: TODAY, level: 1, locale: null }).kept[0]?.idea,
    idea.ar,
  );
});
