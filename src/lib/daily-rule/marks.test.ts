import assert from "node:assert/strict";
import test from "node:test";

import { glueEndings, parseMarked, splitMark, stripMarks } from "@/lib/daily-rule/marks";

test("an -ing form shows its ending apart; a word with no -ing is all mark", () => {
  assert.deepEqual(splitMark("gerund-after", "going"), { stem: "go", mark: "ing" });
  assert.deepEqual(splitMark("present-continuous", "working"), { stem: "work", mark: "ing" });
  assert.deepEqual(splitMark("gerund-after", "excluding"), { stem: "exclud", mark: "ing" });
  assert.deepEqual(splitMark("perfect-continuous", "Waiting"), { stem: "Wait", mark: "ing" });
  assert.deepEqual(splitMark("past-continuous", "sing"), { stem: "", mark: "sing" });
});

test("-s, -es and -ies endings are told apart, and an irregular plural is all mark", () => {
  assert.deepEqual(splitMark("he-she-it-s", "works"), { stem: "work", mark: "s" });
  assert.deepEqual(splitMark("he-she-it-s", "likes"), { stem: "like", mark: "s" });
  assert.deepEqual(splitMark("he-she-it-s", "watches"), { stem: "watch", mark: "es" });
  assert.deepEqual(splitMark("he-she-it-s", "goes"), { stem: "go", mark: "es" });
  assert.deepEqual(splitMark("he-she-it-s", "studies"), { stem: "stud", mark: "ies" });
  assert.deepEqual(splitMark("plural", "cars"), { stem: "car", mark: "s" });
  assert.deepEqual(splitMark("plural", "boxes"), { stem: "box", mark: "es" });
  assert.deepEqual(splitMark("plural", "shoes"), { stem: "shoe", mark: "s" });
  assert.deepEqual(splitMark("plural", "kisses"), { stem: "kiss", mark: "es" });
  assert.deepEqual(splitMark("plural", "children"), { stem: "", mark: "children" });
});

test("a past form or a participle shows -ed / -ied; an irregular one is a word of its own", () => {
  assert.deepEqual(splitMark("regular-past", "worked"), { stem: "work", mark: "ed" });
  assert.deepEqual(splitMark("regular-past", "studied"), { stem: "stud", mark: "ied" });
  assert.deepEqual(splitMark("present-perfect", "finished"), { stem: "finish", mark: "ed" });
  assert.deepEqual(splitMark("present-perfect", "been"), { stem: "", mark: "been" });
  assert.deepEqual(splitMark("passive", "built"), { stem: "", mark: "built" });
  assert.deepEqual(splitMark("should-have", "called"), { stem: "call", mark: "ed" });
  assert.deepEqual(splitMark("wish-past", "had"), { stem: "", mark: "had" });
});

test("a comparative shows -er; better, worse and more are the whole word", () => {
  assert.deepEqual(splitMark("comparative", "taller"), { stem: "tall", mark: "er" });
  assert.deepEqual(splitMark("comparative", "better"), { stem: "", mark: "better" });
  assert.deepEqual(splitMark("comparative", "more"), { stem: "", mark: "more" });
});

test("the possessive 's is split in both apostrophes", () => {
  assert.deepEqual(splitMark("possessive-s", "Tom's"), { stem: "Tom", mark: "'s" });
  assert.deepEqual(splitMark("possessive-s", "Tom’s"), { stem: "Tom", mark: "’s" });
});

test("a rule about a word itself marks the whole word", () => {
  for (const [kind, word] of [
    ["be", "is"],
    ["article", "an"],
    ["can", "can"],
    ["didnt", "didn't"],
    ["wh-start", "Where"],
    ["there-is", "are"],
    ["going-to", "visit"],
  ] as const) {
    assert.deepEqual(splitMark(kind, word), { stem: "", mark: word }, `${kind}: ${word}`);
  }
});

test("a sentence written with brackets is read as runs, and the brackets come off", () => {
  assert.deepEqual(parseMarked("She read[s] it."), [
    { text: "She read", marked: false },
    { text: "s", marked: true },
    { text: " it.", marked: false },
  ]);
  assert.deepEqual(parseMarked("[Is] she here?"), [
    { text: "Is", marked: true },
    { text: " she here?", marked: false },
  ]);
  assert.deepEqual(parseMarked("No marks."), [{ text: "No marks.", marked: false }]);
  assert.equal(stripMarks("She read[s] it, and [Tom] too."), "She reads it, and Tom too.");
});

test("an ending written with its hyphen is kept whole at the end of a line, and nothing else changes", () => {
  const joiner = String.fromCharCode(0x2060);
  assert.equal(glueEndings("add -s to the verb"), "add -" + joiner + "s to the verb");
  assert.equal(glueEndings("-ing and -ed"), "-" + joiner + "ing and -" + joiner + "ed");
  assert.equal(glueEndings("verb + -ing"), "verb + -" + joiner + "ing");
  assert.equal(glueEndings("well-known words, 5 - 3"), "well-known words, 5 - 3");
  assert.equal(glueEndings("no endings"), "no endings");
});
