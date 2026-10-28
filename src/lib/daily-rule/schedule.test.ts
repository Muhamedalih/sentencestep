import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { itemOutcome, ruleOutcome } from "@/lib/daily-rule/outcome";
import {
  RULE_HELD_STRENGTH,
  RULE_INTERVAL_DAYS,
  applyRuleOutcome,
  isRuleHeld,
  ruleIntervalDays,
  type RuleSchedule,
} from "@/lib/daily-rule/schedule";

test("a rule is held after three clean answers on three different days", () => {
  let state: RuleSchedule | null = null;
  state = applyRuleOutcome(state, "clean", "2026-10-28");
  assert.deepEqual(state, { strength: 1, dueOn: "2026-10-29" });
  state = applyRuleOutcome(state, "clean", "2026-10-29");
  assert.deepEqual(state, { strength: 2, dueOn: "2026-11-01" });
  state = applyRuleOutcome(state, "clean", "2026-11-01");
  assert.deepEqual(state, { strength: 3, dueOn: "2026-11-08" });
  assert.equal(isRuleHeld(state.strength), true);
  assert.equal(RULE_HELD_STRENGTH, 3);
});

test("an answer before the due day changes nothing, so one afternoon cannot climb the ladder", () => {
  const state = { strength: 2, dueOn: "2026-11-05" };
  assert.deepEqual(applyRuleOutcome(state, "clean", "2026-11-02"), state);
  assert.deepEqual(applyRuleOutcome(state, "missed", "2026-11-02"), { strength: 0, dueOn: "2026-11-03" });
});

test("a miss goes back to strength 0 and comes back tomorrow; help holds the strength", () => {
  assert.deepEqual(applyRuleOutcome({ strength: 4, dueOn: "2026-11-01" }, "missed", "2026-11-01"), {
    strength: 0,
    dueOn: "2026-11-02",
  });
  assert.deepEqual(applyRuleOutcome({ strength: 2, dueOn: "2026-11-01" }, "assisted", "2026-11-01"), {
    strength: 2,
    dueOn: "2026-11-04",
  });
  assert.deepEqual(applyRuleOutcome(null, "assisted", "2026-10-28"), { strength: 0, dueOn: "2026-10-29" });
});

test("the intervals are the word ladder: 1, 3, 7, 16, 30 days", () => {
  assert.deepEqual([...RULE_INTERVAL_DAYS], [1, 3, 7, 16, 30]);
  assert.equal(ruleIntervalDays(0), 1);
  assert.equal(ruleIntervalDays(9), 30);
});

test("the SQL function keeps the same ladder and the same rules as the TypeScript schedule", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase", "migrations", "20250351000000_learner_rules.sql"),
    "utf8",
  );
  assert.match(sql, /array\[1, 3, 7, 16, 30\]/);
  assert.match(sql, /least\(v_prev_strength \+ 1, 5\)/);
  assert.match(sql, /v_prev_due > p_today/);
  assert.match(sql, /p_outcome = 'missed'/);
});

test("one item's outcome: clean with no help, assisted with a hint or a second try, missed when wrong twice", () => {
  assert.equal(itemOutcome({ correct: true, wrongTries: 0, hinted: false }), "clean");
  assert.equal(itemOutcome({ correct: true, wrongTries: 0, hinted: true }), "assisted");
  assert.equal(itemOutcome({ correct: true, wrongTries: 1, hinted: false }), "assisted");
  assert.equal(itemOutcome({ correct: false, wrongTries: 2, hinted: false }), "missed");
});

test("a card's outcome: any miss is a miss, any help is assisted, otherwise clean", () => {
  assert.equal(ruleOutcome(["clean", "clean", "clean"]), "clean");
  assert.equal(ruleOutcome(["clean", "assisted", "clean"]), "assisted");
  assert.equal(ruleOutcome(["clean", "missed", "assisted"]), "missed");
});
