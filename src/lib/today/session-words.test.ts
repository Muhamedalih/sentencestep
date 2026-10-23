import assert from "node:assert/strict";
import test from "node:test";

import { assembleSession } from "@/lib/features/daily-session";
import type { PassageWord } from "@/lib/passages/types";
import { STORY_WORDS_MAX, passageReviewWords, storyReviewWords } from "@/lib/today/session-words";
import { BLANK_TOKEN } from "@/types/word-lists";

const sentences = [
  { id: "story-9-s1", en: "The balloon starts to fly over the hill" },
  { id: "story-9-s2", en: "She waits for the rain to stop" },
  { id: "story-9-s3", en: "He opens the box into the light" },
  { id: "story-9-s4", en: "They build a snowman in the garden" },
];

function item(sentenceId: string, wordIndex: number, en: string, ar: string, supportText?: string) {
  return { id: `${sentenceId}-vocab-${wordIndex}`, en, ar, supportText };
}

test("the story's target words come back blanked inside their own sentence, as the words that finishing the story recorded", () => {
  const words = storyReviewWords({
    title: "Half a Cookie",
    sentences,
    vocabulary: [
      item("story-9-s1", 1, "balloon", "بالون"),
      item("story-9-s2", 4, "rain", "مطر", "lluvia"),
    ],
  });
  assert.deepEqual(
    words.map((word) => [word.id, word.targetWord, word.sentence, word.hintAr, word.supportHint]),
    [
      [
        "recall-balloon",
        "balloon",
        `The ${BLANK_TOKEN} starts to fly over the hill`,
        "بالون",
        "بالون",
      ],
      ["recall-rain", "rain", `She waits for the ${BLANK_TOKEN} to stop`, "مطر", "lluvia"],
    ],
  );
  assert.ok(
    words.every((word) => word.fromToday === "story" && word.lessonTitle === "Half a Cookie"),
  );
  assert.equal(words[0]!.groupId, "recall");
  assert.equal(words[0]!.pronunciationContentType, "sentence_word");
  assert.equal(words[0]!.pronunciationContentId, "story-9-s1::balloon");
});

test("a story gives at most three words, only important ones whose sentence is found", () => {
  assert.equal(STORY_WORDS_MAX, 3);
  const words = storyReviewWords({
    title: "T",
    sentences,
    vocabulary: [
      item("story-9-s3", 3, "into", "إلى"), // a function word is no word to learn
      item("story-9-missing", 1, "ghost", "شبح"), // its sentence is not in the story
      item("story-9-s1", 1, "balloon", "بالون"),
      item("story-9-s2", 4, "rain", "مطر"),
      item("story-9-s3", 2, "box", "صندوق"),
      item("story-9-s4", 2, "build", "يبني"),
    ],
  });
  assert.deepEqual(
    words.map((word) => word.targetWord),
    ["balloon", "rain", "box"],
  );
  assert.deepEqual(storyReviewWords({ title: "T", sentences, vocabulary: [] }), []);
  assert.deepEqual(storyReviewWords({ title: "T", sentences }), []);
});

function passageWord(id: string, word: string, contextEn: string | null): PassageWord {
  return { id, word, hintAr: `معنى ${word}`, contextEn, contextAr: null, audioUrl: null };
}

test("the passage's target words are blanked inside the passage line they appear in, in the passage's order", () => {
  const words = passageReviewWords({
    title: "The Quiet Hour",
    wordGroupId: "group-1",
    words: [
      passageWord("w1", "silence", "The silence was the best part of the night."),
      passageWord("w2", "plan", "We made a plan: nobody speaks."),
    ],
  });
  assert.deepEqual(
    words.map((word) => [word.id, word.groupId, word.targetWord, word.sentence]),
    [
      ["w1", "group-1", "silence", `The ${BLANK_TOKEN} was the best part of the night.`],
      ["w2", "group-1", "plan", `We made a ${BLANK_TOKEN}: nobody speaks.`],
    ],
  );
  assert.ok(
    words.every((word) => word.fromToday === "passage" && word.lessonTitle === "The Quiet Hour"),
  );
  assert.equal(words[0]!.hintAr, "معنى silence");
});

test("a passage word with no line to sit in, or only as part of another word, is left out; a passage with no word lesson gives none", () => {
  const passage = {
    title: "P",
    wordGroupId: "group-1",
    words: [
      passageWord("w1", "plan", null),
      passageWord("w2", "plan", "The planet is far away."), // "plan" only inside "planet"
      passageWord("w3", "into", "She walked into the room."), // a function word
      passageWord("w4", "window", "He opened the window slowly."),
    ],
  };
  assert.deepEqual(
    passageReviewWords(passage).map((word) => word.targetWord),
    ["window"],
  );
  assert.deepEqual(passageReviewWords({ ...passage, wordGroupId: null }), []);
});

test("the five words are the story's two or three and then the passage's, whichever way the split falls", () => {
  const story3 = storyReviewWords({
    title: "S",
    sentences,
    vocabulary: [
      item("story-9-s1", 1, "balloon", "أ"),
      item("story-9-s2", 4, "rain", "ب"),
      item("story-9-s3", 2, "box", "ج"),
    ],
  });
  const story2 = story3.slice(0, 2);
  const passage = passageReviewWords({
    title: "P",
    wordGroupId: "g",
    words: [
      passageWord("p1", "silence", "The silence was the best part."),
      passageWord("p2", "plan", "We made a plan today."),
      passageWord("p3", "window", "He opened the window slowly."),
      passageWord("p4", "garden", "The garden was quiet tonight."),
    ],
  });
  const groups = (story: typeof story3) => [
    { source: "recall" as const, items: story },
    { source: "wordList" as const, items: passage },
    { source: "recall" as const, items: [{ ...story3[0]!, id: "later", targetWord: "other" }] },
  ];

  const three = assembleSession(groups(story3), 5);
  assert.deepEqual(
    three.map((word) => word.targetWord),
    ["balloon", "rain", "box", "silence", "plan"],
  );
  const two = assembleSession(groups(story2), 5);
  assert.deepEqual(
    two.map((word) => word.targetWord),
    ["balloon", "rain", "silence", "plan", "window"],
  );
  // Each completes on the ledger of where it came from.
  assert.deepEqual(
    three.map((word) => word.sessionSource),
    ["recall", "recall", "recall", "wordList", "wordList"],
  );
});

test("a passage that gives too few leaves the rest to the step's usual sources", () => {
  const story = storyReviewWords({
    title: "S",
    sentences,
    vocabulary: [item("story-9-s1", 1, "balloon", "أ"), item("story-9-s2", 4, "rain", "ب")],
  });
  const filler = ["alpha", "bravo", "charlie"].map((targetWord, order) => ({
    ...story[0]!,
    id: `f${order}`,
    targetWord,
  }));
  const session = assembleSession(
    [
      { source: "recall" as const, items: story },
      { source: "wordList" as const, items: [] },
      { source: "weak" as const, items: filler },
    ],
    5,
  );
  assert.deepEqual(
    session.map((word) => word.targetWord),
    ["balloon", "rain", "alpha", "bravo", "charlie"],
  );
});
