import assert from "node:assert/strict";
import test from "node:test";

import { planLearnChoice, planOutcome } from "@/lib/word-mastery/plan";
import {
  MAX_OUTCOME_FIELD_LENGTH,
  REPORTED_OUTCOMES,
  isLearnChoiceInput,
} from "@/lib/word-mastery/types";

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

test("Learn's 'I know it' starts a new word at the first rung and only holds one already on the schedule", () => {
  assert.equal(planLearnChoice("known", false), "clean");
  // A claim is not recall: it must never climb a word that is already scheduled.
  assert.equal(planLearnChoice("known", true), "assisted");
});

test("Learn's 'still learning' sends the word back to the start whether or not it was scheduled", () => {
  assert.equal(planLearnChoice("learning", false), "missed");
  assert.equal(planLearnChoice("learning", true), "missed");
});

test("a Learn choice is validated like any other action input", () => {
  assert.equal(isLearnChoiceInput({ wordId: "family-aunt", choice: "known" }), true);
  assert.equal(isLearnChoiceInput({ wordId: "family-aunt", choice: "learning" }), true);
  for (const bad of [
    null,
    "known",
    {},
    { wordId: "", choice: "known" },
    { wordId: "x".repeat(MAX_OUTCOME_FIELD_LENGTH + 1), choice: "known" },
    { wordId: "family-aunt", choice: "clean" },
    { wordId: 7, choice: "known" },
  ]) {
    assert.equal(isLearnChoiceInput(bad), false);
  }
});
