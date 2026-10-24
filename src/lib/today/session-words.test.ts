import assert from "node:assert/strict";
import test from "node:test";

import type { PassageWord } from "@/lib/passages/types";
import {
  STORY_WORDS_MAX,
  closestWords,
  passageWordCandidates,
  sessionWords,
  storyWordCandidates,
} from "@/lib/today/session-words";
import type { PositionedWord } from "@/lib/today/session-words";
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

test("the story's target words are blanked inside their own sentence, with where they sit", () => {
  const candidates = storyWordCandidates({
    title: "Half a Cookie",
    sentences,
    vocabulary: [
      item("story-9-s1", 1, "balloon", "بالون"),
      item("story-9-s2", 4, "rain", "مطر", "lluvia"),
    ],
  });
  assert.deepEqual(
    candidates.map(({ word, position }) => [
      word.id,
      word.targetWord,
      word.sentence,
      word.hintAr,
      word.supportHint,
      position,
    ]),
    [
      [
        "recall-balloon",
        "balloon",
        `The ${BLANK_TOKEN} starts to fly over the hill`,
        "بالون",
        "بالون",
        0,
      ],
      ["recall-rain", "rain", `She waits for the ${BLANK_TOKEN} to stop`, "مطر", "lluvia", 1],
    ],
  );
  const first = candidates[0]!.word;
  assert.equal(first.fromToday, "story");
  assert.equal(first.lessonTitle, "Half a Cookie");
  assert.equal(first.groupId, "recall");
  assert.equal(first.pronunciationContentType, "sentence_word");
  assert.equal(first.pronunciationContentId, "story-9-s1::balloon");
});

test("a function word, or a word whose sentence is not in the story, is no target word", () => {
  const candidates = storyWordCandidates({
    title: "T",
    sentences,
    vocabulary: [
      item("story-9-s3", 3, "into", "إلى"),
      item("story-9-missing", 1, "ghost", "شبح"),
      item("story-9-s3", 2, "box", "صندوق"),
    ],
  });
  assert.deepEqual(
    candidates.map(({ word }) => word.targetWord),
    ["box"],
  );
  assert.deepEqual(storyWordCandidates({ title: "T", sentences }), []);
});

function passageWord(id: string, word: string, contextEn: string | null): PassageWord {
  return { id, word, hintAr: `معنى ${word}`, contextEn, contextAr: null, audioUrl: null };
}

const passageLines = [
  "We waited in the dark kitchen.",
  "The silence was the best part of the night.",
  "Then we made a plan: nobody speaks.",
  "He opened the window slowly.",
  "The garden was quiet tonight.",
];
const sections = [
  { sentences: passageLines.slice(0, 2).map((en) => ({ en })) },
  { sentences: passageLines.slice(2).map((en) => ({ en })) },
];

test("the passage's target words are blanked inside their passage line, positioned by that line across the sections", () => {
  const candidates = passageWordCandidates({
    title: "The Quiet Hour",
    wordGroupId: "group-1",
    sections,
    words: [
      passageWord("w1", "silence", passageLines[1]!),
      passageWord("w2", "plan", passageLines[2]!),
    ],
  });
  assert.deepEqual(
    candidates.map(({ word, position }) => [
      word.id,
      word.groupId,
      word.targetWord,
      word.sentence,
      position,
    ]),
    [
      ["w1", "group-1", "silence", `The ${BLANK_TOKEN} was the best part of the night.`, 1],
      ["w2", "group-1", "plan", `Then we made a ${BLANK_TOKEN}: nobody speaks.`, 2],
    ],
  );
  assert.equal(candidates[0]!.word.fromToday, "passage");
  assert.equal(candidates[0]!.word.lessonTitle, "The Quiet Hour");
  assert.equal(candidates[0]!.word.hintAr, "معنى silence");
});

test("a passage word with no line to sit in, or only inside another word, is left out; no word lesson gives none", () => {
  const passage = {
    title: "P",
    wordGroupId: "group-1",
    sections,
    words: [
      passageWord("w1", "plan", null),
      passageWord("w2", "plan", "The planet is far away."),
      passageWord("w3", "into", "She walked into the room."),
      passageWord("w4", "window", passageLines[3]!),
    ],
  };
  assert.deepEqual(
    passageWordCandidates(passage).map(({ word }) => word.targetWord),
    ["window"],
  );
  assert.deepEqual(passageWordCandidates({ ...passage, wordGroupId: null }), []);
});

function at(
  word: string,
  position: number,
  source: "story" | "passage" = "passage",
): PositionedWord {
  return {
    position,
    word: {
      id: word,
      groupId: "g",
      order: 0,
      targetWord: word,
      sentence: `x ${BLANK_TOKEN} y`,
      hintAr: word,
      reason: "review",
      fromToday: source,
    },
  };
}

const names = (entries: readonly PositionedWord[]) => entries.map((entry) => entry.word.targetWord);

test("the closest words are the neighbours with the smallest spread, the earliest on a tie", () => {
  assert.deepEqual(names(closestWords([at("a", 0), at("b", 5), at("c", 6)], 2)), ["b", "c"]);
  assert.deepEqual(names(closestWords([at("a", 0), at("b", 1), at("c", 8), at("d", 9)], 2)), [
    "a",
    "b",
  ]);
  assert.deepEqual(
    names(closestWords([at("a", 0), at("b", 2), at("c", 3), at("d", 9), at("e", 20)], 3)),
    ["a", "b", "c"],
  );
});

test("with no more candidates than wanted, all of them come back in text order, each word once", () => {
  assert.deepEqual(names(closestWords([at("c", 9), at("a", 1), at("b", 4)], 5)), ["a", "b", "c"]);
  assert.deepEqual(names(closestWords([at("a", 1), at("A", 2), at("b", 3)], 3)), ["a", "b"]);
  assert.deepEqual(closestWords([at("a", 1)], 0), []);
  assert.deepEqual(closestWords([], 3), []);
});

// A fixed "random" so the order can be asserted.
function counter(): () => number {
  let step = 0;
  return () => {
    step += 1;
    return (step * 0.37) % 1;
  };
}

test("the five words are the story's two or three and the passage's closest ones for the places left", () => {
  assert.equal(STORY_WORDS_MAX, 3);
  const story = [at("balloon", 0, "story"), at("rain", 1, "story"), at("box", 2, "story")];
  const passage = [at("silence", 1), at("plan", 2), at("window", 3), at("garden", 4)];

  const three = sessionWords({ story, passage, size: 5, random: counter() });
  assert.equal(three.length, 5);
  assert.deepEqual(names(three.map((word) => ({ word, position: 0 }))).sort(), [
    "balloon",
    "box",
    "plan",
    "rain",
    "silence",
  ]);

  const two = sessionWords({ story: story.slice(0, 2), passage, size: 5, random: counter() });
  assert.deepEqual(names(two.map((word) => ({ word, position: 0 }))).sort(), [
    "balloon",
    "plan",
    "rain",
    "silence",
    "window",
  ]);
});

test("each word completes on the ledger of where it came from, and the order is random", () => {
  const story = [at("balloon", 0, "story"), at("rain", 1, "story")];
  const passage = [at("silence", 1), at("plan", 2), at("window", 3)];
  const round = sessionWords({ story, passage, size: 5, random: counter() });
  for (const word of round) {
    assert.equal(word.sessionSource, word.fromToday === "story" ? "recall" : "wordList");
  }
  const order = (random: () => number) =>
    sessionWords({ story, passage, size: 5, random }).map((word) => word.targetWord);
  // The same random gives the same order; another one gives another order.
  assert.deepEqual(order(counter()), order(counter()));
  assert.notDeepEqual(
    order(() => 0),
    order(() => 0.999),
  );
});

test("nothing outside the session is added: too few words make a shorter round", () => {
  const story = [at("balloon", 0, "story"), at("rain", 1, "story")];
  assert.deepEqual(
    names(
      sessionWords({ story, passage: [at("silence", 1)], size: 5, random: counter() }).map(
        (word) => ({ word, position: 0 }),
      ),
    ).sort(),
    ["balloon", "rain", "silence"],
  );
  assert.equal(sessionWords({ story, passage: [], size: 5 }).length, 2);
  assert.equal(sessionWords({ story: [], passage: [at("silence", 1)], size: 5 }).length, 1);
  assert.deepEqual(sessionWords({ story: [], passage: [], size: 5 }), []);
  assert.deepEqual(sessionWords({ story, passage: [at("silence", 1)], size: 0 }), []);
});

test("a passage with too few words leaves its places to the story, so the round stays five", () => {
  const story = [
    at("balloon", 0, "story"),
    at("rain", 1, "story"),
    at("box", 2, "story"),
    at("snowman", 3, "story"),
    at("garden", 4, "story"),
  ];
  const round = sessionWords({ story, passage: [at("silence", 1)], size: 5, random: counter() });
  assert.equal(round.length, 5);
  assert.equal(round.filter((word) => word.targetWord === "silence").length, 1);
  assert.equal(round.filter((word) => word.sessionSource === "recall").length, 4);
  // The story alone cannot give more than it has.
  assert.equal(sessionWords({ story: story.slice(0, 4), passage: [], size: 5 }).length, 4);
});

test("a passage word that is also a story word is asked once, and the passage fills the place with another", () => {
  const story = [at("rain", 1, "story")];
  const passage = [
    at("rain", 1),
    at("silence", 2),
    at("plan", 3),
    at("window", 4),
    at("garden", 5),
  ];
  const round = sessionWords({ story, passage, size: 5, random: counter() });
  assert.equal(round.length, 5);
  assert.equal(round.filter((word) => word.targetWord === "rain").length, 1);
  assert.equal(round.find((word) => word.targetWord === "rain")?.sessionSource, "recall");
});
