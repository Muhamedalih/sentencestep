import assert from "node:assert/strict";
import test from "node:test";

import { planOutcome } from "@/lib/word-mastery/plan";
import { REPORTED_OUTCOMES } from "@/lib/word-mastery/types";

test("a miss goes to the schedule and puts the word in the weak list", () => {
  assert.deepEqual(planOutcome("missed", true), { schedule: "missed", ledger: ["recordMistake"] });
});

test("typing a missed word right afterwards corrects it (due tomorrow) and leaves the schedule alone", () => {
  assert.deepEqual(planOutcome("recovered", true), { schedule: null, ledger: ["markCorrected"] });
});

test("a clean answer climbs the schedule and only corrects or advances what is already in the ledger", () => {
  assert.deepEqual(planOutcome("clean", true), {
    schedule: "clean",
    ledger: ["markCorrected", "reviewClean"],
  });
});

test("an answer that needed the hint holds the schedule and enters the weak list already corrected", () => {
  assert.deepEqual(planOutcome("assisted", true), {
    schedule: "assisted",
    ledger: ["recordMistake", "markCorrected"],
  });
});

test("a word too trivial to track never touches the weak-word ledger, but its schedule still moves", () => {
  for (const outcome of REPORTED_OUTCOMES) {
    assert.deepEqual(planOutcome(outcome, false).ledger, []);
  }
  assert.equal(planOutcome("clean", false).schedule, "clean");
  assert.equal(planOutcome("missed", false).schedule, "missed");
  assert.equal(planOutcome("recovered", false).schedule, null);
});

test("no outcome ever clears a word from the weak list in one step: the only ledger writes are record, correct and a due review", () => {
  const allowed = new Set(["recordMistake", "markCorrected", "reviewClean"]);
  for (const outcome of REPORTED_OUTCOMES) {
    for (const trackable of [true, false]) {
      for (const step of planOutcome(outcome, trackable).ledger) {
        assert.ok(allowed.has(step), `${outcome}: unexpected ledger step ${step}`);
      }
    }
  }
});

test("a word that was missed is never treated as learned: no outcome that follows a miss reaches the review-clean step", () => {
  // "recovered" is what a screen reports for a word missed earlier in the visit.
  assert.equal(planOutcome("recovered", true).ledger.includes("reviewClean"), false);
});
