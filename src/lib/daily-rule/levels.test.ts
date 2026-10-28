import assert from "node:assert/strict";
import { test } from "node:test";

import { A1_LADDER, type MatchKind } from "./ladder";
import { A2_LADDER, B2_LADDER } from "./ladder-higher";
import { ALL_RULES, LEVEL_LABEL, MAX_WORDS_BY_LEVEL, hasRuleLadder, ladderForLevel, ruleById } from "./levels";
import { candidatesFor } from "./matchers";
import { tokenize } from "./tokens";

/** The words a rule would blank in a sentence, in reading order (the first one is what a learner types). */
function blanks(kind: MatchKind, sentence: string): string[] {
  const tokens = tokenize(sentence);
  return candidatesFor(kind, tokens, sentence).map((index) => tokens[index]!.text);
}

test("the ladders: ids are unique, each ladder starts at 1, each rule carries its own level", () => {
  const ids = ALL_RULES.map((rule) => rule.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const ladder of [A1_LADDER, A2_LADDER, B2_LADDER]) {
    ladder.forEach((rule, index) => assert.equal(rule.order, index + 1, rule.id));
  }
  assert.ok(A1_LADDER.every((rule) => rule.level === "A1"));
  assert.ok(A2_LADDER.every((rule) => rule.level === "A2-B1"));
  assert.ok(B2_LADDER.every((rule) => rule.level === "B2"));
  assert.equal(A2_LADDER.length, 8);
  assert.equal(B2_LADDER.length, 7);
});

test("every rule's right sentence shows its own form, so the card's example is a real example", () => {
  for (const rule of ALL_RULES) {
    assert.ok(blanks(rule.match, rule.right).length > 0, `${rule.id}: ${rule.right}`);
  }
});

test("levels map to ladders, labels and sentence lengths", () => {
  assert.equal(hasRuleLadder(1), true);
  assert.equal(hasRuleLadder(2), true);
  assert.equal(hasRuleLadder(3), true);
  assert.equal(hasRuleLadder(4), false);
  assert.equal(ladderForLevel(2), A2_LADDER);
  assert.equal(LEVEL_LABEL[2], "A2–B1");
  assert.equal(MAX_WORDS_BY_LEVEL[1], 14);
  assert.equal(MAX_WORDS_BY_LEVEL[3], 22);
  assert.equal(ruleById("b2-04")?.match, "passive");
  assert.equal(ruleById("nope"), undefined);
});

test("present continuous: am / is / are with an -ing verb, not an -ing adjective", () => {
  assert.deepEqual(blanks("present-continuous", "She is working now."), ["working"]);
  assert.deepEqual(blanks("present-continuous", "We're leaving at noon."), ["leaving"]);
  assert.deepEqual(blanks("present-continuous", "This is amazing."), []);
  assert.deepEqual(blanks("present-continuous", "She is work now."), []);
});

test("past continuous: was / were with an -ing verb", () => {
  assert.deepEqual(blanks("past-continuous", "I was reading when you called."), ["reading"]);
  assert.deepEqual(blanks("past-continuous", "There was nothing to do."), []);
});

test("present perfect: have / has with a participle, adverbs allowed between", () => {
  assert.deepEqual(blanks("present-perfect", "I have never been to Japan."), ["been"]);
  assert.deepEqual(blanks("present-perfect", "She has already finished the report."), ["finished"]);
  assert.deepEqual(blanks("present-perfect", "I have a dog."), []);
  assert.deepEqual(blanks("present-perfect", "I have never go to Japan."), []);
  assert.deepEqual(blanks("present-perfect", "I have been waiting for an hour."), []);
});

test("going to: am / is / are going to with a verb, not a place", () => {
  assert.deepEqual(blanks("going-to", "We are going to visit Rome in May."), ["visit"]);
  assert.deepEqual(blanks("going-to", "It is going to rain tomorrow."), ["rain"]);
  assert.deepEqual(blanks("going-to", "We are going to the park."), []);
});

test("comparative: -er or better / worse before than, more / less before than", () => {
  assert.deepEqual(blanks("comparative", "She is taller than her brother."), ["taller"]);
  assert.deepEqual(blanks("comparative", "Today is better than yesterday."), ["better"]);
  assert.deepEqual(blanks("comparative", "It is more expensive than the bus."), ["more"]);
  assert.deepEqual(blanks("comparative", "I never say that."), []);
});

test("must: the modal itself", () => {
  assert.deepEqual(blanks("must", "You must wear a seat belt."), ["must"]);
  assert.deepEqual(blanks("must", "You mustn't park here."), []);
});

test("first conditional: will after if", () => {
  assert.deepEqual(blanks("first-conditional", "If it rains, we will stay home."), ["will"]);
  assert.deepEqual(blanks("first-conditional", "We will stay home."), []);
});

test("many / much: only the form that fits the noun", () => {
  assert.deepEqual(blanks("much-many", "There are many cars here."), ["many"]);
  assert.deepEqual(blanks("much-many", "There is much water here."), ["much"]);
  assert.deepEqual(blanks("much-many", "There are many people here."), ["many"]);
  assert.deepEqual(blanks("much-many", "There are much cars here."), []);
});

test("second conditional: would, only when the if-clause is past", () => {
  assert.deepEqual(blanks("second-conditional", "If I had more time, I would travel."), ["would"]);
  assert.deepEqual(blanks("second-conditional", "She asked if you would come."), []);
});

test("perfect continuous: have been with an -ing verb", () => {
  assert.deepEqual(blanks("perfect-continuous", "I have been waiting for an hour."), ["waiting"]);
  assert.deepEqual(blanks("perfect-continuous", "I have been to Paris."), []);
});

test("past perfect: had with a participle, the adverb allowed", () => {
  assert.deepEqual(blanks("past-perfect", "When I arrived, the film had already started."), ["started"]);
  assert.deepEqual(blanks("past-perfect", "She had worked there for years."), ["worked"]);
  assert.deepEqual(blanks("past-perfect", "I had a dog."), []);
});

test("passive: be with a participle of a passive verb, not an adjective or 'used to'", () => {
  assert.deepEqual(blanks("passive", "The bridge was built in 1932."), ["built"]);
  assert.deepEqual(blanks("passive", "The bridge was build in 1932."), []);
  assert.deepEqual(blanks("passive", "I am used to it."), []);
});

test("wish + past: the past form after wish and the subject", () => {
  assert.deepEqual(blanks("wish-past", "I wish I had more free time."), ["had"]);
  assert.deepEqual(blanks("wish-past", "I wish I have more free time."), []);
  assert.deepEqual(blanks("wish-past", "I wish I were taller."), ["were"]);
});

test("should have: the participle after should have", () => {
  assert.deepEqual(blanks("should-have", "You should have called me."), ["called"]);
  assert.deepEqual(blanks("should-have", "You should have call me."), []);
});

test("verb + -ing: the -ing after enjoy, avoid and the like, not after want", () => {
  assert.deepEqual(blanks("gerund-after", "I enjoy reading in the evening."), ["reading"]);
  assert.deepEqual(blanks("gerund-after", "I enjoy to read in the evening."), []);
});
