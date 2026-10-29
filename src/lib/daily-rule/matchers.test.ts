import assert from "node:assert/strict";
import test from "node:test";

import { A1_LADDER, ruleById, type MatchKind } from "@/lib/daily-rule/ladder";
import { candidatesFor } from "@/lib/daily-rule/matchers";
import {
  aroundToken,
  diagnose,
  diagnoseAny,
  normalizeAnswer,
  tokenize,
} from "@/lib/daily-rule/tokens";

/** The words a matcher picked, in order, so an assertion reads as English. */
function picked(kind: MatchKind, sentence: string): string[] {
  const tokens = tokenize(sentence);
  return candidatesFor(kind, tokens, sentence).map((index) => tokens[index]!.text);
}

test("every rule on the ladder has a matcher, an id and a title", () => {
  assert.equal(A1_LADDER.length, 45);
  assert.deepEqual(
    A1_LADDER.map((rule) => rule.order),
    Array.from({ length: 45 }, (_, index) => index + 1),
  );
  assert.equal(new Set(A1_LADDER.map((rule) => rule.id)).size, 45);
  for (const rule of A1_LADDER) {
    assert.match(rule.id, /^a1-\d{2}$/);
    assert.ok(rule.title.length > 0 && rule.unit.length > 0);
  }
  assert.equal(ruleById("a1-04")?.title, "he / she / it + -s");
  assert.equal(ruleById("a1-99"), undefined);
});

test("a typed answer is right when it is any of the answers a sentence accepts", () => {
  assert.equal(diagnoseAny("is not", ["isn't", "is not"]), "correct");
  assert.equal(diagnoseAny("Isn't", ["isn't", "is not"]), "correct");
  assert.equal(diagnoseAny("work", ["works"]), "missing-s");
  assert.equal(diagnoseAny("walk", ["walked", "did walk"]), "missing-ed");
  assert.equal(diagnoseAny("banana", ["isn't", "is not"]), "other");
});

test("the be-verb, articles and possessives are found where they stand", () => {
  assert.deepEqual(picked("be", "She is at home."), ["is"]);
  assert.deepEqual(picked("be", "There is a bag."), [], "there is belongs to its own rule");
  assert.deepEqual(picked("article", "It is an apple."), ["an"]);
  assert.deepEqual(picked("possessive", "This is my book."), ["my"]);
  assert.deepEqual(picked("possessive", "I see my"), [], "a possessive needs a noun after it");
});

test("third-person -s is found, and the words that only look like it are not", () => {
  assert.deepEqual(picked("he-she-it-s", "She works here."), ["works"]);
  assert.deepEqual(picked("he-she-it-s", "It starts to drip down my hand."), ["starts"]);
  assert.deepEqual(picked("he-she-it-s", "He has a car."), [], "has is a different word");
  assert.deepEqual(picked("he-she-it-s", "It was bus."), [], "bus is a noun");
});

test("base verbs after I, you, we and they are found; modals in front are not", () => {
  assert.deepEqual(picked("present-base", "We live here."), ["live"]);
  assert.deepEqual(picked("present-base", "I can swim."), []);
});

test("regular and irregular past are found; adjectives in -ed are not", () => {
  assert.deepEqual(picked("regular-past", "I worked yesterday."), ["worked"]);
  assert.deepEqual(picked("regular-past", "I was tired."), [], "tired is an adjective");
  assert.deepEqual(picked("irregular-past", "I went home."), ["went"]);
  assert.deepEqual(picked("irregular-past", "I have got a car."), [], "have got is present");
});

test("prepositions of place skip the time expressions that belong to their own rule", () => {
  assert.deepEqual(picked("place", "The cup is on the table."), ["on"]);
  assert.deepEqual(picked("place", "We meet on Monday."), []);
  assert.deepEqual(picked("time-prep", "We meet on Monday."), ["on"]);
  assert.deepEqual(picked("time-prep", "We meet in the morning."), ["in"]);
  assert.deepEqual(picked("time-prep", "We meet at 5."), ["at"]);
  assert.deepEqual(picked("time-prep", "We meet at school."), []);
});

test("questions are recognised by their question mark", () => {
  assert.deepEqual(picked("wh-start", "Where is the bus?"), ["Where"]);
  assert.deepEqual(picked("wh-start", "Where is the bus."), []);
  assert.deepEqual(picked("do-does-question", "Does she work here?"), ["Does"]);
  assert.deepEqual(picked("did-question", "Did you call me?"), ["Did"]);
});

test("negatives, can, there is, frequency and some/any", () => {
  assert.deepEqual(picked("dont-doesnt", "She doesn't like tea."), ["doesn't"]);
  assert.deepEqual(picked("didnt", "I didn't call you."), ["didn't"]);
  assert.deepEqual(picked("can", "I can swim."), ["can"]);
  assert.deepEqual(picked("there-is", "There are two cats."), ["are"]);
  assert.deepEqual(picked("frequency", "She never drinks coffee."), ["never"]);
  assert.deepEqual(picked("some-any", "I have some water."), ["some"]);
});

test("object pronouns follow a verb or a preposition only", () => {
  assert.deepEqual(picked("object-pronoun", "Call me tomorrow."), ["me"]);
  assert.deepEqual(picked("object-pronoun", "I see her."), ["her"]);
  assert.deepEqual(picked("object-pronoun", "Her bag is red."), []);
});

test("imperatives start with the verb, and a question is not an order", () => {
  assert.deepEqual(picked("imperative", "Open the window, please."), ["Open"]);
  assert.deepEqual(picked("imperative", "Please sit down."), ["sit"]);
  assert.deepEqual(picked("imperative", "Opens the window."), []);
});

test("plural nouns after a number or a quantity, and this/that before a noun", () => {
  assert.deepEqual(picked("plural", "Two cars are here."), ["cars"]);
  assert.deepEqual(picked("plural", "The bus is late."), []);
  assert.deepEqual(picked("this-that", "These shoes are new."), ["These"]);
  assert.deepEqual(picked("this-that", "This is my book."), [], "this followed by is is a pronoun");
});

test("possessive 's belongs to a name, not to it's or let's", () => {
  assert.deepEqual(picked("possessive-s", "This is Tom's bag."), ["Tom's"]);
  assert.deepEqual(picked("possessive-s", "It's cold."), []);
  assert.deepEqual(picked("possessive-s", "Let's go."), []);
});

test("tokens keep apostrophes and digits, and the blank leaves the rest of the sentence intact", () => {
  const sentence = "I don't know Tom's bag at 5.";
  assert.deepEqual(
    tokenize(sentence).map((token) => token.text),
    ["I", "don't", "know", "Tom's", "bag", "at", "5"],
  );
  const word = tokenize(sentence).find((token) => token.text === "bag")!;
  assert.deepEqual(aroundToken(sentence, word), { before: "I don't know Tom's ", after: " at 5." });
});

test("answers are compared once case and quotes are set aside, and a near miss is named, not forgiven", () => {
  assert.equal(normalizeAnswer("  Starts. "), "starts");
  assert.equal(normalizeAnswer("Don’t"), "don't");
  assert.equal(diagnose("Works", "works"), "correct");
  assert.equal(diagnose("start", "starts"), "missing-s");
  assert.equal(diagnose("work", "worked"), "missing-ed");
  assert.equal(diagnose("starts", "start"), "extra-s");
  assert.equal(diagnose("a", "an"), "a-an");
  assert.equal(diagnose("wrok", "works"), "other");
});
