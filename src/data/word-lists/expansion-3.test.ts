import assert from "node:assert/strict";
import test from "node:test";

import { hasCoverScene } from "@/components/words/word-cover-art";
import { wordGroups } from "@/data/word-lists";
import { EXPANSION_3_GROUPS } from "@/data/word-lists/expansion-3";
import { WORD_IPA } from "@/data/word-lists/ipa";
import { BLANK_TOKEN } from "@/types/word-lists";

const ALL_WORDS = EXPANSION_3_GROUPS.flatMap((group) =>
  group.words.map((row) => ({ group, word: row[0], sentence: row[1] })),
);

test("16 new topics: five beginner, six intermediate, five advanced, 25 words each", () => {
  assert.equal(EXPANSION_3_GROUPS.length, 16);
  const perLevel = (level: number) => EXPANSION_3_GROUPS.filter((g) => g.level === level).length;
  assert.deepEqual([perLevel(1), perLevel(2), perLevel(3)], [5, 6, 5]);
  for (const group of EXPANSION_3_GROUPS) {
    assert.equal(group.words.length, 25, `${group.id} has ${group.words.length} words`);
  }
});

test("every topic has all its texts in the four languages, and an id and title no other topic uses", () => {
  const seededIds = new Set(wordGroups.map((group) => group.id));
  const ids = new Set<string>();
  const titles = new Set<string>();
  for (const group of EXPANSION_3_GROUPS) {
    assert.match(group.id, /^[a-z]+(-[a-z]+)*$/, group.id);
    assert.ok(!seededIds.has(group.id), `${group.id} is already a seeded topic`);
    assert.ok(!ids.has(group.id), `${group.id} appears twice`);
    assert.ok(!titles.has(group.title), `${group.title} appears twice`);
    ids.add(group.id);
    titles.add(group.title);
    for (const text of [
      group.title,
      group.titleAr,
      group.titleEs,
      group.titleTr,
      group.description,
      group.descriptionAr,
      group.descriptionEs,
      group.descriptionTr,
    ]) {
      assert.ok(text.trim().length > 0, `${group.id} has an empty text`);
    }
  }
});

test("each sentence has exactly one blank, and each hint is filled in in all three languages", () => {
  for (const { group, word, sentence } of ALL_WORDS) {
    assert.equal(sentence.split(BLANK_TOKEN).length - 1, 1, `${group.id}/${word}: ${sentence}`);
    assert.ok(!sentence.toLowerCase().includes(word) || sentence.includes(BLANK_TOKEN), word);
  }
  for (const group of EXPANSION_3_GROUPS) {
    for (const [word, , hintAr, hintEs, hintTr] of group.words) {
      for (const hint of [hintAr, hintEs, hintTr]) {
        assert.ok(hint.trim().length >= 3, `${group.id}/${word} has an empty hint`);
        assert.ok(
          hint.trim().endsWith("."),
          `${group.id}/${word}: hint "${hint}" ends without a full stop`,
        );
      }
    }
  }
});

test("a target word is a lower-case single word and is never the answer in its own sentence", () => {
  for (const { group, word, sentence } of ALL_WORDS) {
    assert.match(word, /^[a-z]+$/, `${group.id}/${word}`);
    const around = sentence.replace(BLANK_TOKEN, " ").toLowerCase();
    assert.ok(
      !new RegExp(`\\b${word}\\b`).test(around),
      `${group.id}/${word} is visible in its own sentence`,
    );
  }
});

test("no word repeats inside the expansion, and none is a word the site already teaches", () => {
  const seen = new Map<string, string>();
  for (const { group, word } of ALL_WORDS) {
    assert.ok(!seen.has(word), `${word} is in both ${seen.get(word)} and ${group.id}`);
    seen.set(word, group.id);
    assert.ok(!(word in WORD_IPA), `${group.id}/${word} is already taught by an existing list`);
  }
});

test("every new topic has a drawing of its own, so no cover falls back to the plain ground", () => {
  for (const group of EXPANSION_3_GROUPS) {
    assert.ok(hasCoverScene(group.title), `${group.title} has no drawing`);
  }
});

test("a / an before the blank matches the first sound of the word", () => {
  const vowelSound = (word: string) => /^[aeiou]/.test(word) && !/^(uni|use|eu)/.test(word);
  for (const { group, word, sentence } of ALL_WORDS) {
    const m = /\b(a|an) (?:[a-z]+ )*?___/i.exec(sentence);
    if (!m) continue;
    // Only the article directly before the blank decides; an adjective in between has its own sound.
    const direct = /\b(a|an) ___/i.exec(sentence);
    if (!direct) continue;
    const article = direct[1]!.toLowerCase();
    assert.equal(article === "an", vowelSound(word), `${group.id}/${word}: "${direct[0]}"`);
  }
});
