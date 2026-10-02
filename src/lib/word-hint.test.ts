import assert from "node:assert/strict";
import test from "node:test";

import { applyHint, planHint } from "@/lib/word-hint";

function hint(typed: string, target: string, alternates?: readonly string[]) {
  const plan = planHint(typed, target, alternates);
  return plan ? { ...plan, result: applyHint(typed, plan) } : null;
}

test("nothing typed yet: the hint is the first letter", () => {
  assert.deepEqual(hint("", "friendship"), {
    answer: "friendship",
    keep: 0,
    remove: 0,
    add: "f",
    result: "f",
  });
});

test("right letters so far: the hint is the next one, whatever the learner already has", () => {
  assert.equal(hint("fr", "friendship")?.result, "fri");
  assert.equal(hint("fri", "friendship")?.add, "e");
  assert.equal(hint("fr", "friendship")?.remove, 0);
  // The last missing letter completes the word.
  assert.equal(hint("friendshi", "friendship")?.result, "friendship");
});

test("a wrong letter and what follows it are taken away, and the right letter takes their place", () => {
  // f-r-i right, then b and n: both go, the fourth letter (e) is restored.
  assert.deepEqual(hint("fribn", "friendship"), {
    answer: "friendship",
    keep: 3,
    remove: 2,
    add: "e",
    result: "frie",
  });
  // A wrong first letter takes everything with it.
  const first = hint("xrie", "friendship");
  assert.equal(first?.keep, 0);
  assert.equal(first?.remove, 4);
  assert.equal(first?.result, "f");
  // One wrong letter at the very end.
  assert.equal(hint("friendsx", "friendship")?.result, "friendsh");
});

test("letters typed past the end of the word are taken away even though every right letter is there", () => {
  const plan = hint("friendshipx", "friendship");
  assert.equal(plan?.keep, 10);
  assert.equal(plan?.remove, 1);
  assert.equal(plan?.add, "");
  assert.equal(plan?.result, "friendship");
});

test("a word that is already typed in full has nothing left to hint", () => {
  assert.equal(planHint("friendship", "friendship"), null);
  assert.equal(planHint("FRIENDSHIP", "friendship"), null);
});

test("case and accents never count as mistakes, and the learner's own casing is kept", () => {
  assert.equal(hint("FRi", "friendship")?.result, "FRie");
  assert.equal(hint("fianc", "fiancé")?.add, "é");
  assert.equal(hint("fianc", "fiancé")?.result, "fiancé");
  assert.equal(hint("Mon", "Monday")?.result, "Mond");
});

test("an alternate the learner is already typing is followed instead of the stored word", () => {
  // gray is stored, grey is also accepted.
  assert.equal(hint("gre", "gray", ["grey"])?.result, "grey");
  assert.equal(hint("gre", "gray", ["grey"])?.answer, "grey");
  // Typing the stored one stays on it.
  assert.equal(hint("gra", "gray", ["grey"])?.result, "gray");
  // Equally far along: the stored word wins.
  assert.equal(hint("gr", "gray", ["grey"])?.result, "gra");
  assert.equal(hint("", "gray", ["grey"])?.result, "g");
});

test("an alternate with a space in it is followed letter by letter", () => {
  assert.equal(hint("heat", "heatwave", ["heat wave"])?.result, "heatw");
  assert.equal(hint("heat ", "heatwave", ["heat wave"])?.result, "heat w");
});

test("a complete accepted answer is never 'repaired' towards a longer one", () => {
  // color is stored and colour is also accepted: color is finished, so there is nothing to give.
  assert.equal(planHint("color", "color", ["colour"]), null);
});

test("repeated hints walk the word forward one right letter at a time", () => {
  let typed = "";
  const steps: string[] = [];
  for (let index = 0; index < 4; index++) {
    const plan = planHint(typed, "aunt");
    assert.ok(plan);
    typed = applyHint(typed, plan);
    steps.push(typed);
  }
  assert.deepEqual(steps, ["a", "au", "aun", "aunt"]);
  assert.equal(planHint(typed, "aunt"), null);
});
