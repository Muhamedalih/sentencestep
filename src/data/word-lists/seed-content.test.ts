// Verifies the curated Word Lists content — no database, no server.
// Mirrors src/data/lessons/seed-content.test.ts's shape for the same
// reason: catch a content mistake here, at authoring time, rather than as
// a broken card or a blank-with-no-answer in the running app.

import { test } from "node:test";
import assert from "node:assert/strict";

import { wordGroups } from "./index";
import { BLANK_TOKEN, WORDS_PER_GROUP } from "@/types/word-lists";

test("word lists: exactly 9 groups exist", () => {
  assert.equal(wordGroups.length, 9);
});

test("word lists: exactly 3 groups per level", () => {
  const perLevel = new Map<number, number>();
  for (const group of wordGroups) perLevel.set(group.level, (perLevel.get(group.level) ?? 0) + 1);
  for (const level of [1, 2, 3]) {
    assert.equal(
      perLevel.get(level),
      3,
      `level ${level} has ${perLevel.get(level)} groups, expected 3`,
    );
  }
});

test(`word lists: every group has exactly ${WORDS_PER_GROUP} words`, () => {
  for (const group of wordGroups) {
    assert.equal(
      group.words.length,
      WORDS_PER_GROUP,
      `${group.id} has ${group.words.length} words, expected ${WORDS_PER_GROUP}`,
    );
  }
});

test("word lists: exactly one free group (Family)", () => {
  const free = wordGroups.filter((group) => group.isFree);
  assert.equal(free.length, 1, `expected exactly 1 free group, got ${free.length}`);
  assert.equal(free[0]?.id, "family");
});

test("word lists: no duplicate group ids or titles", () => {
  const ids = wordGroups.map((group) => group.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate group id found");
  const titles = wordGroups.map((group) => group.title.trim().toLowerCase());
  assert.equal(new Set(titles).size, titles.length, "duplicate group title found");
});

test("word lists: no duplicate word ids across the whole seed", () => {
  const allWordIds = wordGroups.flatMap((group) => group.words.map((word) => word.id));
  assert.equal(new Set(allWordIds).size, allWordIds.length, "duplicate word id found");
});

test("word lists: no duplicate target words or sentences within a group", () => {
  for (const group of wordGroups) {
    const targets = group.words.map((word) => word.targetWord);
    assert.equal(new Set(targets).size, targets.length, `${group.id} has a duplicate target word`);
    const sentences = group.words.map((word) => word.sentence);
    assert.equal(new Set(sentences).size, sentences.length, `${group.id} has a duplicate sentence`);
  }
});

test("word lists: every word's sentence contains exactly one blank", () => {
  for (const group of wordGroups) {
    for (const word of group.words) {
      const blankCount = word.sentence.split(BLANK_TOKEN).length - 1;
      assert.equal(
        blankCount,
        1,
        `${word.id} has ${blankCount} blanks, expected 1: "${word.sentence}"`,
      );
    }
  }
});

test("word lists: the target word never appears in its own sentence text", () => {
  for (const group of wordGroups) {
    for (const word of group.words) {
      const escaped = word.targetWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`\\b${escaped}\\b`, "i");
      assert.ok(
        !re.test(word.sentence),
        `${word.id}: "${word.targetWord}" leaks into its own sentence: "${word.sentence}"`,
      );
    }
  }
});

test("word lists: target words are lowercase, single tokens", () => {
  for (const group of wordGroups) {
    for (const word of group.words) {
      assert.equal(
        word.targetWord,
        word.targetWord.toLowerCase(),
        `${word.id}: targetWord not lowercase`,
      );
      assert.ok(!/\s/.test(word.targetWord), `${word.id}: targetWord contains whitespace`);
    }
  }
});

test("word lists: every word has a non-empty Arabic hint that looks like Arabic", () => {
  const arabicRe = /[؀-ۿ]/;
  for (const group of wordGroups) {
    for (const word of group.words) {
      assert.ok(word.hintAr.trim().length > 0, `${word.id} is missing hintAr`);
      assert.ok(
        arabicRe.test(word.hintAr),
        `${word.id}'s hintAr doesn't look like Arabic: "${word.hintAr}"`,
      );
    }
  }
});

test("word lists: required fields are non-empty on every group", () => {
  for (const group of wordGroups) {
    assert.ok(group.title.trim().length > 0, `${group.id} is missing a title`);
    assert.ok(group.titleAr.trim().length > 0, `${group.id} is missing an Arabic title`);
    assert.ok(
      group.level >= 1 && group.level <= 3,
      `${group.id} has an out-of-range level: ${group.level}`,
    );
  }
});

test("word lists: word order is sequential starting at 1 within each group", () => {
  for (const group of wordGroups) {
    group.words.forEach((word, index) => {
      assert.equal(word.order, index + 1, `${word.id}: order ${word.order}, expected ${index + 1}`);
      assert.equal(
        word.groupId,
        group.id,
        `${word.id}: groupId "${word.groupId}" doesn't match group "${group.id}"`,
      );
    });
  }
});
