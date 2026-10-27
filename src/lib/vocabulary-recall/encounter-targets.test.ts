import assert from "node:assert/strict";
import test from "node:test";

import { MAX_STORY_ENCOUNTERS } from "@/lib/vocabulary-recall/constants";
import { encounterTargets } from "@/lib/vocabulary-recall/encounter-targets";
import { locateVocabularyItem, parseVocabularyItemId } from "@/lib/vocabulary-recall/item-id";

/** The "storyRecall" permission open for the learner (the default of these tests); the closed case is tested on its own. */
const open = { stories: true };

const sentences = [
  { id: "story-121-s1", en: "Mia feels total burnout after a long week." },
  { id: "story-121-s2", en: "She decides to unplug from her phone." },
  { id: "story-121-s3", en: "On Sunday she feels recharged, and the burnout fades." },
];

test("a derived id carries its sentence and the word's place; a curated id carries the word", () => {
  assert.deepEqual(parseVocabularyItemId("story-9-s1-vocab-3"), {
    sentenceId: "story-9-s1",
    wordIndex: 3,
  });
  // The last marker wins, so a sentence id that holds the marker itself still parses.
  assert.deepEqual(parseVocabularyItemId("a-vocab-b-vocab-2"), {
    sentenceId: "a-vocab-b",
    wordIndex: 2,
  });
  assert.equal(parseVocabularyItemId("story-121-vocab-burnout"), null);
  assert.equal(parseVocabularyItemId("no-marker-here"), null);
});

test("a curated word is found at its first occurrence in the story, matched the way mistakes are", () => {
  const indexById = new Map(sentences.map((sentence, index) => [sentence.id, index]));
  // "burnout" is in sentence 0 (word 3) and again in sentence 2: the first one wins.
  assert.deepEqual(
    locateVocabularyItem({ id: "story-121-vocab-burnout", en: "burnout" }, sentences, indexById),
    { index: 0, wordIndex: 3 },
  );
  // A capital letter and the sentence's own punctuation do not matter.
  assert.deepEqual(
    locateVocabularyItem({ id: "story-121-vocab-week", en: "Week" }, sentences, indexById),
    { index: 0, wordIndex: 7 },
  );
  assert.deepEqual(
    locateVocabularyItem(
      { id: "story-121-vocab-recharged", en: "recharged" },
      sentences,
      indexById,
    ),
    { index: 2, wordIndex: 4 },
  );
  // A word that is nowhere in the story is not guessed, and neither is an id with no marker at all.
  assert.equal(
    locateVocabularyItem({ id: "story-121-vocab-ghost", en: "ghost" }, sentences, indexById),
    null,
  );
  assert.equal(locateVocabularyItem({ id: "burnout", en: "burnout" }, sentences, indexById), null);
  assert.equal(
    locateVocabularyItem({ id: "story-121-vocab-x", en: "—" }, sentences, indexById),
    null,
  );
});

test("a derived id is placed by its sentence, and a sentence that is not in the lesson is no place", () => {
  const indexById = new Map(sentences.map((sentence, index) => [sentence.id, index]));
  assert.deepEqual(
    locateVocabularyItem({ id: "story-121-s2-vocab-3", en: "unplug" }, sentences, indexById),
    { index: 1, wordIndex: 3 },
  );
  assert.equal(
    locateVocabularyItem({ id: "story-121-s9-vocab-3", en: "unplug" }, sentences, indexById),
    null,
  );
});

test("a curated story's words become encounters in the sentence they are found in (the bug: none did)", () => {
  const targets = encounterTargets(
    {
      mode: "stories",
      sentences,
      vocabulary: [
        { id: "story-121-vocab-burnout", en: "burnout", ar: "إرهاق تام" },
        { id: "story-121-vocab-unplug", en: "unplug", ar: "ينقطع عن الإنترنت" },
      ],
    },
    open,
  );
  assert.deepEqual(targets, [
    {
      word: "burnout",
      ar: "إرهاق تام",
      sentenceId: "story-121-s1",
      sentenceEn: "Mia feels total burnout after a long week.",
      wordIndex: 3,
    },
    {
      word: "unplug",
      ar: "ينقطع عن الإنترنت",
      sentenceId: "story-121-s2",
      sentenceEn: "She decides to unplug from her phone.",
      wordIndex: 3,
    },
  ]);
});

test("a derived id is still placed by its own sentence and index, in a story and in a Normal lesson", () => {
  const vocabulary = [
    { id: "story-121-s2-vocab-3", en: "unplug", ar: "ينقطع" },
    { id: "story-121-s1-vocab-2", en: "Total", ar: "كامل" },
  ];
  for (const mode of ["stories", "normal"] as const) {
    const targets = encounterTargets({ mode, sentences, vocabulary }, open);
    assert.deepEqual(
      targets.map(({ word, sentenceId, wordIndex }) => [word, sentenceId, wordIndex]),
      [
        ["unplug", "story-121-s2", 3],
        ["total", "story-121-s1", 2],
      ],
    );
  }
});

test("a story gives at most three words; a Normal lesson gives all of its words", () => {
  const many = [
    { id: "story-121-vocab-mia", en: "Mia", ar: "ميا" },
    { id: "story-121-vocab-feels", en: "feels", ar: "تشعر" },
    { id: "story-121-vocab-total", en: "total", ar: "كامل" },
    { id: "story-121-vocab-burnout", en: "burnout", ar: "إرهاق" },
    { id: "story-121-vocab-week", en: "week", ar: "أسبوع" },
  ];
  assert.equal(MAX_STORY_ENCOUNTERS, 3);
  const story = encounterTargets({ mode: "stories", sentences, vocabulary: many }, open);
  assert.deepEqual(
    story.map((target) => target.word),
    ["mia", "feels", "total"],
  );
  const normal = encounterTargets(
    {
      mode: "normal",
      sentences,
      vocabulary: [
        { id: "story-121-s1-vocab-0", en: "Mia", ar: "ميا" },
        { id: "story-121-s1-vocab-1", en: "feels", ar: "تشعر" },
        { id: "story-121-s1-vocab-2", en: "total", ar: "كامل" },
        { id: "story-121-s1-vocab-3", en: "burnout", ar: "إرهاق" },
        { id: "story-121-s1-vocab-7", en: "week", ar: "أسبوع" },
      ],
    },
    open,
  );
  assert.equal(normal.length, 5);
});

test("a word that cannot be placed does not take one of a story's three places", () => {
  const targets = encounterTargets(
    {
      mode: "stories",
      sentences,
      vocabulary: [
        { id: "story-121-vocab-ghost", en: "ghost", ar: "شبح" }, // nowhere in the story
        { id: "story-121-s9-vocab-1", en: "lost", ar: "ضائع" }, // a sentence that is not in the story
        { id: "story-121-vocab-feels", en: "feels", ar: "تشعر" },
        { id: "story-121-vocab-unplug", en: "unplug", ar: "ينقطع" },
        { id: "story-121-vocab-phone", en: "phone", ar: "هاتف" },
        { id: "story-121-vocab-week", en: "week", ar: "أسبوع" },
      ],
    },
    open,
  );
  assert.deepEqual(
    targets.map((target) => target.word),
    ["feels", "unplug", "phone"],
  );
});

test("a word is taken once, whichever way it is spelled in the vocabulary", () => {
  const targets = encounterTargets(
    {
      mode: "normal",
      sentences,
      vocabulary: [
        { id: "story-121-s1-vocab-3", en: "burnout", ar: "إرهاق" },
        { id: "story-121-vocab-burnout", en: "Burnout", ar: "إرهاق" },
      ],
    },
    open,
  );
  assert.equal(targets.length, 1);
  assert.equal(targets[0]!.sentenceId, "story-121-s1");
});

test("a conversation, or a lesson with no vocabulary, hands nothing over", () => {
  const vocabulary = [{ id: "story-121-vocab-burnout", en: "burnout", ar: "إرهاق" }];
  assert.deepEqual(encounterTargets({ mode: "conversation", sentences, vocabulary }, open), []);
  assert.deepEqual(encounterTargets({ mode: "stories", sentences }, open), []);
  assert.deepEqual(encounterTargets({ mode: "stories", sentences, vocabulary: [] }, open), []);
  assert.deepEqual(encounterTargets({ mode: "normal", sentences: [], vocabulary }, open), []);
});

test("a story hands over nothing while its permission is closed; a Normal lesson does not care", () => {
  const closed = { stories: false };
  const curated = [{ id: "story-121-vocab-burnout", en: "burnout", ar: "إرهاق" }];
  const derived = [{ id: "story-121-s1-vocab-3", en: "burnout", ar: "إرهاق" }];
  // Closed: neither the curated ids (the ones in use) nor derived ones are recorded for a story.
  assert.deepEqual(
    encounterTargets({ mode: "stories", sentences, vocabulary: curated }, closed),
    [],
  );
  assert.deepEqual(
    encounterTargets({ mode: "stories", sentences, vocabulary: derived }, closed),
    [],
  );
  // Open: both are.
  assert.equal(
    encounterTargets({ mode: "stories", sentences, vocabulary: curated }, open).length,
    1,
  );
  assert.equal(
    encounterTargets({ mode: "stories", sentences, vocabulary: derived }, open).length,
    1,
  );
  // A Normal lesson gives the same words whichever way the story permission is set.
  assert.deepEqual(
    encounterTargets({ mode: "normal", sentences, vocabulary: derived }, closed),
    encounterTargets({ mode: "normal", sentences, vocabulary: derived }, open),
  );
  assert.equal(
    encounterTargets({ mode: "normal", sentences, vocabulary: derived }, closed).length,
    1,
  );
});
