import assert from "node:assert/strict";
import test from "node:test";

import { blankOutWord, buildAnkiTsv } from "@/lib/cards/anki";

const card = {
  word: "ordered",
  meaning: "طلبتُ",
  sentenceEn: "I ordered a black coffee and a sandwich",
  wordIndex: 1,
  lessonTitle: "The Wrong Order",
  mode: "normal",
};

test("blankOutWord: replaces only the word at that position", () => {
  assert.equal(blankOutWord(card.sentenceEn, 1), "I _____ a black coffee and a sandwich");
  assert.equal(blankOutWord(card.sentenceEn, 99), card.sentenceEn);
  assert.equal(blankOutWord(card.sentenceEn, -1), card.sentenceEn);
});

test("buildAnkiTsv: header tells Anki how to import, then one tab-separated row per card", () => {
  const lines = buildAnkiTsv([card]).trimEnd().split("\n");
  assert.deepEqual(lines.slice(0, 6), [
    "#separator:tab",
    "#html:true",
    "#notetype:Basic",
    "#deck:SentenceStep",
    "#columns:Front\tBack\tTags",
    "#tags column:3",
  ]);
  assert.equal(lines.length, 7);
  const [front, back, tags] = lines[6]!.split("\t");
  assert.equal(front, "I _____ a black coffee and a sandwich<br>طلبتُ");
  assert.equal(
    back,
    "<b>ordered</b><br>I ordered a black coffee and a sandwich<br><i>The Wrong Order</i>",
  );
  assert.equal(tags, "sentencestep normal");
});

test("buildAnkiTsv: content can't break the file — tabs/newlines flattened, HTML escaped", () => {
  const nasty = {
    ...card,
    meaning: "line1\nline2\tx <b>bold</b> & more",
    lessonTitle: "A <script>alert(1)</script> title",
  };
  const out = buildAnkiTsv([nasty]);
  const row = out.trimEnd().split("\n").at(-1)!;
  assert.equal(row.split("\t").length, 3);
  assert.equal(row.includes("<script>"), false);
  assert.ok(row.includes("&lt;script&gt;"));
  assert.ok(row.includes("&amp; more"));
  assert.ok(row.includes("line1 line2 x"));
});

test("buildAnkiTsv: no cards still yields a valid header-only file", () => {
  const lines = buildAnkiTsv([]).trimEnd().split("\n");
  assert.equal(lines.length, 6);
  assert.ok(lines.every((line) => line.startsWith("#")));
});
