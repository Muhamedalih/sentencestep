import assert from "node:assert/strict";
import test from "node:test";

import { parsePrepared } from "@/lib/daily-rule/items";
import { preparedItems, preparedSentenceId, isPreparedId } from "@/lib/daily-rule/prepared";
import { ruleById } from "@/lib/daily-rule/levels";

test("a prepared sentence has a blank, the answer inside it, and the rest around it", () => {
  assert.deepEqual(parsePrepared("She [is] at home."), {
    text: "She is at home.",
    before: "She ",
    answer: "is",
    answers: ["is"],
    after: " at home.",
  });
});

test("other answers after | are accepted too, and the first is the one shown", () => {
  const parsed = parsePrepared("He [isn't|is not] late.");
  assert.equal(parsed?.answer, "isn't");
  assert.deepEqual(parsed?.answers, ["isn't", "is not"]);
  assert.equal(parsed?.text, "He isn't late.");
});

test("a {hint} at the end is shown with the blank and is not part of the sentence", () => {
  const parsed = parsePrepared("I like [swimming] in the summer.{swim}");
  assert.equal(parsed?.hint, "swim");
  assert.equal(parsed?.text, "I like swimming in the summer.");
  assert.equal(parsed?.after, " in the summer.");
});

test("a sentence with no blank, two blanks, or an empty one is not a question", () => {
  assert.equal(parsePrepared("She is at home."), null);
  assert.equal(parsePrepared("[She] is [at] home."), null);
  assert.equal(parsePrepared("She [] at home."), null);
  assert.equal(parsePrepared("She [ | ] at home."), null);
  assert.equal(parsePrepared("She [is at home."), null);
});

test("the prepared sentences of a rule are questions with their own ids and no recording", () => {
  const rule = ruleById("a1-26")!;
  const items = preparedItems(rule);
  assert.equal(items.length, 6);
  assert.equal(items[0]!.sentenceId, preparedSentenceId("a1-26", 0));
  assert.ok(isPreparedId(items[0]!.sentenceId));
  assert.ok(!isPreparedId("0f6c1a5e-aaaa-bbbb-cccc-123456789abc"));
  for (const item of items) {
    assert.equal(item.ruleId, "a1-26");
    assert.equal(item.audioUrl, undefined);
    assert.equal(item.before + item.answer + item.after, item.text);
    assert.ok((item.answers ?? []).includes(item.answer));
  }
  assert.deepEqual(items[0]!.answers, ["isn't", "is not"]);
});

test("a rule without teaching has no prepared sentences", () => {
  assert.deepEqual(preparedItems({ id: "zz-none" }), []);
});
