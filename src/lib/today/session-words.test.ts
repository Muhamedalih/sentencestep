import assert from "node:assert/strict";
import test from "node:test";

import type { PassageWord } from "@/lib/passages/types";
import {
  STORY_WORDS_MAX,
  closestWords,
  passageWordCandidates,
  playableOnly,
  sessionLeftovers,
  sessionWords,
  storyWordCandidates,
  withClips,
  withoutBank,
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

test("a curated story's target words (ids that carry the word, not a number) are found in its sentences", () => {
  const curated = storyWordCandidates({
    title: "The Weekend Offline",
    sentences: [
      { id: "story-121-s1", en: "Mia feels total burnout after a long week." },
      { id: "story-121-s2", en: "She decides to unplug from her phone." },
      { id: "story-121-s3", en: "On Sunday she feels recharged." },
    ],
    vocabulary: [
      { id: "story-121-vocab-burnout", en: "burnout", ar: "إرهاق تام" },
      { id: "story-121-vocab-unplug", en: "unplug", ar: "ينقطع عن الإنترنت" },
      // a word that is nowhere in the story is skipped, never guessed
      { id: "story-121-vocab-ghost", en: "ghost", ar: "شبح" },
    ],
  });
  assert.deepEqual(
    curated.map(({ word, position }) => [word.targetWord, word.sentence, position]),
    [
      ["burnout", `Mia feels total ${BLANK_TOKEN} after a long week.`, 0],
      ["unplug", `She decides to ${BLANK_TOKEN} from her phone.`, 1],
    ],
  );
  assert.equal(curated[0]!.word.pronunciationContentId, "story-121-s1::burnout");
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

test("'5 more words' holds only the day's own words the first round left", () => {
  const story = [
    at("balloon", 0, "story"),
    at("rain", 1, "story"),
    at("box", 2, "story"),
    at("snowman", 3, "story"),
    at("garden", 4, "story"),
  ];
  const passage = [
    at("silence", 1),
    at("plan", 2),
    at("window", 3),
    at("door", 4),
    at("stairs", 5),
  ];
  const first = sessionWords({ story, passage, size: 5, random: counter() }).map(
    (word) => word.targetWord,
  );
  const rest = sessionLeftovers({ story, passage, size: 5 });
  const left = [...rest.story, ...rest.passage].map((entry) => entry.word.targetWord);
  // Nothing is asked twice, and nothing of the day is lost: the two rounds together are every candidate.
  assert.equal(left.filter((word) => first.includes(word)).length, 0);
  assert.deepEqual(
    [...first, ...left].sort(),
    [...story, ...passage].map((entry) => entry.word.targetWord).sort(),
  );
  // The extra round is built from them the same way, and is still only the day's words.
  const more = sessionWords({ ...rest, size: 5, random: counter() }).map((word) => word.targetWord);
  assert.deepEqual(more.sort(), left.sort());
});

test("a word listed in both the story and the passage is left over in neither once it was asked", () => {
  const story = [at("rain", 1, "story"), at("box", 2, "story")];
  const passage = [at("rain", 1), at("plan", 2), at("window", 3), at("door", 4), at("stairs", 5)];
  const rest = sessionLeftovers({ story, passage, size: 5 });
  assert.equal(
    [...rest.story, ...rest.passage].some((entry) => entry.word.targetWord === "rain"),
    false,
  );
});

test("a candidate gets the clip it plays, keeps one it already carries, and a word with none is not asked", () => {
  const story = [at("balloon", 0, "story"), at("rain", 1, "story"), at("box", 2, "story")];
  const clips = new Map([
    ["balloon", "https://clips/balloon.mp3"],
    ["rain", "https://clips/rain.mp3"],
  ]);
  const voiced = withClips(story, (word) => clips.get(word.targetWord));
  assert.deepEqual(
    voiced.map(({ word, position }) => [word.targetWord, word.audioUrl, position]),
    [
      ["balloon", "https://clips/balloon.mp3", 0],
      ["rain", "https://clips/rain.mp3", 1],
      ["box", null, 2],
    ],
  );
  assert.deepEqual(names(playableOnly(voiced)), ["balloon", "rain"]);

  // A passage word comes with its own clip: a clip another source names does not replace it.
  const own = { ...at("silence", 1), word: { ...at("silence", 1).word, audioUrl: "https://own" } };
  assert.equal(withClips([own], () => "https://other")[0]!.word.audioUrl, "https://own");
  // Nothing is changed in place.
  assert.equal(story[0]!.word.audioUrl, undefined);
});

test("a round is made of words that have a clip: the ones without are never asked and the passage fills their places", () => {
  const story = [at("balloon", 0, "story"), at("rain", 1, "story"), at("box", 2, "story")];
  const passage = [at("silence", 1), at("plan", 2), at("window", 3), at("garden", 4)];
  const clips = new Map(
    ["balloon", "rain", "silence", "plan", "window", "garden"].map((word) => [
      word,
      `https://clips/${word}.mp3`,
    ]),
  );
  // "box" has no clip anywhere.
  const voiced = {
    story: playableOnly(withClips(story, (word) => clips.get(word.targetWord))),
    passage: playableOnly(withClips(passage, (word) => clips.get(word.targetWord))),
  };
  const round = sessionWords({ ...voiced, size: 5, random: counter() });
  assert.equal(round.length, 5);
  assert.equal(
    round.some((word) => word.targetWord === "box"),
    false,
  );
  // Every word of the round plays its own recorded clip.
  for (const word of round) assert.equal(word.audioUrl, `https://clips/${word.targetWord}.mp3`);
  // And "5 more words" is built from the same voiced candidates, so it holds none without a clip either.
  const rest = sessionLeftovers({ ...voiced, size: 5 });
  for (const entry of [...rest.story, ...rest.passage]) assert.ok(entry.word.audioUrl);
});

test("with few words there is nothing left for another round", () => {
  const story = [at("balloon", 0, "story"), at("rain", 1, "story")];
  const rest = sessionLeftovers({ story, passage: [at("silence", 1)], size: 5 });
  assert.deepEqual(rest, { story: [], passage: [] });
  assert.deepEqual(sessionLeftovers({ story: [], passage: [], size: 5 }), {
    story: [],
    passage: [],
  });
});

test("each story word carries what the words bank remembers: where it was met, its meaning and its home sentence", () => {
  const candidates = storyWordCandidates({
    id: "story-9",
    title: "Half a Cookie",
    sentences,
    vocabulary: [
      item("story-9-s2", 4, "rain", "مطر", "lluvia"),
      item("story-9-s1", 1, "balloon", "بالون"),
    ],
  });
  assert.deepEqual(candidates[0]!.word.bank, {
    source: "story",
    lessonId: "story-9",
    lessonTitle: "Half a Cookie",
    ar: "lluvia",
    homeSentence: "She waits for the rain to stop",
  });
  // With no support text the Arabic meaning is the one kept.
  assert.equal(candidates[1]!.word.bank?.ar, "بالون");
  assert.equal(candidates[1]!.word.bank?.homeSentence, "The balloon starts to fly over the hill");
});

test("each passage word carries what the words bank remembers, its home sentence being the passage line", () => {
  const candidates = passageWordCandidates({
    id: "the-quiet-hour",
    title: "The Quiet Hour",
    wordGroupId: "group-1",
    sections,
    words: [passageWord("w1", "silence", passageLines[1]!)],
  });
  assert.deepEqual(candidates[0]!.word.bank, {
    source: "passage",
    lessonId: "the-quiet-hour",
    lessonTitle: "The Quiet Hour",
    ar: "معنى silence",
    homeSentence: passageLines[1],
  });
});

test("the words bank context survives the choice of the five words and is taken away for a learner it is closed to", () => {
  const story = storyWordCandidates({
    id: "story-9",
    title: "Half a Cookie",
    sentences,
    vocabulary: [item("story-9-s1", 1, "balloon", "بالون"), item("story-9-s2", 4, "rain", "مطر")],
  });
  const asked = sessionWords({ story, passage: [], size: 5, random: () => 0 });
  assert.equal(asked.length, 2);
  for (const word of asked) {
    assert.equal((word as { bank?: { source: string } }).bank?.source, "story");
  }
  for (const word of asked.map(withoutBank)) assert.equal("bank" in word, false);
  // Nothing else about the word changes, and the original is left alone.
  assert.equal(withoutBank(asked[0]!).targetWord, asked[0]!.targetWord);
  assert.equal("bank" in asked[0]!, true);
});

test("a word with no words bank context is returned as it is", () => {
  const plain = storyWordCandidates({ title: "T", sentences, vocabulary: [] });
  assert.deepEqual(plain, []);
  const word = {
    id: "w",
    groupId: "g",
    order: 0,
    targetWord: "plan",
    sentence: "x",
    hintAr: "y",
    reason: "review" as const,
  };
  assert.equal(withoutBank(word), word);
});
