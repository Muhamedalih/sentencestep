// Regression tests for the Real Page Model, updated for the Read/listen-first
// redesign's "exactly four sentences per page" rule (see pagination.ts's own
// doc comment on SENTENCES_PER_PAGE): pages must be deterministic, must
// never cross a section boundary (callers only ever pass one section's
// sentences), must never leave a sentence out, and must hold exactly four
// sentences except for a section's possible partial final page.
//
// Run with `npm test` (runs every *.test.ts).

import { test } from "node:test";
import assert from "node:assert/strict";

import { findPageIndexForSentenceId, paginateSentences } from "./pagination";
import type { BookSentence } from "@/types/library";

function makeSentence(id: string, orderIndex: number, en: string): BookSentence {
  return { id, sectionId: "section-1", orderIndex, en, audioUrl: null };
}

test("groups sentences into pages of exactly four", () => {
  const sentences = Array.from({ length: 8 }, (_, i) =>
    makeSentence(`s${i + 1}`, i, `Sentence number ${i + 1}.`),
  );
  const pages = paginateSentences(sentences);
  assert.equal(pages.length, 2);
  assert.deepEqual(
    pages[0]!.map((s) => s.id),
    ["s1", "s2", "s3", "s4"],
  );
  assert.deepEqual(
    pages[1]!.map((s) => s.id),
    ["s5", "s6", "s7", "s8"],
  );
});

test("a sentence count not divisible by four ends in a partial final page", () => {
  const sentences = Array.from({ length: 9 }, (_, i) =>
    makeSentence(`s${i + 1}`, i, `Sentence number ${i + 1}.`),
  );
  const pages = paginateSentences(sentences);
  assert.deepEqual(
    pages.map((page) => page.map((s) => s.id)),
    [["s1", "s2", "s3", "s4"], ["s5", "s6", "s7", "s8"], ["s9"]],
  );
});

test("every sentence appears in exactly one page, in original order, none dropped or duplicated", () => {
  const sentences = Array.from({ length: 23 }, (_, i) =>
    makeSentence(`s${i}`, i, `Sentence number ${i} here.`),
  );
  const pages = paginateSentences(sentences);

  const flattened = pages.flat();
  assert.deepEqual(
    flattened.map((s) => s.id),
    sentences.map((s) => s.id),
  );
});

test("no page ever holds more than four sentences", () => {
  const sentences = Array.from({ length: 23 }, (_, i) =>
    makeSentence(`s${i}`, i, `Sentence number ${i} here.`),
  );
  const pages = paginateSentences(sentences);
  for (const page of pages) assert.ok(page.length <= 4);
});

test("is deterministic: the same sentences always produce the same page boundaries", () => {
  const sentences = Array.from({ length: 17 }, (_, i) =>
    makeSentence(`s${i}`, i, `This is sentence ${i}.`),
  );
  const a = paginateSentences(sentences).map((page) => page.map((s) => s.id));
  const b = paginateSentences(sentences).map((page) => page.map((s) => s.id));
  assert.deepEqual(a, b);
});

test("a very long sentence still pairs normally with its neighbor, never split or dropped", () => {
  const longSentence = makeSentence("s1", 0, Array.from({ length: 40 }, () => "word").join(" "));
  const shortSentence = makeSentence("s2", 1, "Short one.");
  const pages = paginateSentences([longSentence, shortSentence]);
  assert.equal(pages.length, 1);
  assert.deepEqual(
    pages[0]!.map((s) => s.id),
    ["s1", "s2"],
  );
});

test("empty section produces no pages", () => {
  assert.deepEqual(paginateSentences([]), []);
});

test("a single-sentence section produces one one-sentence page", () => {
  const pages = paginateSentences([makeSentence("s1", 0, "Hello there.")]);
  assert.deepEqual(
    pages.map((page) => page.map((s) => s.id)),
    [["s1"]],
  );
});

test("findPageIndexForSentenceId locates the page containing a given sentence", () => {
  const sentences = Array.from({ length: 23 }, (_, i) =>
    makeSentence(`s${i}`, i, `Sentence number ${i} here.`),
  );
  const pages = paginateSentences(sentences);
  const targetId = pages[pages.length - 1]![0]!.id;
  assert.equal(findPageIndexForSentenceId(pages, targetId), pages.length - 1);
});

test("findPageIndexForSentenceId falls back to page 0 for an unknown sentence id", () => {
  const sentences = [makeSentence("s1", 0, "Hello there.")];
  const pages = paginateSentences(sentences);
  assert.equal(findPageIndexForSentenceId(pages, "does-not-exist"), 0);
});
