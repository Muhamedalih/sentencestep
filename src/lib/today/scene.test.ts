import assert from "node:assert/strict";
import test from "node:test";

import type { PassageSection, PassageWord } from "@/lib/passages/types";
import {
  buildScene,
  givenRanges,
  nameWordIndexes,
  passageNames,
  sceneDayPassageId,
  sceneLinesMinutes,
  sceneReviewWords,
  sceneWordCards,
  sentenceSpans,
  stageRows,
  targetWordIndexes,
  typedSpan,
} from "@/lib/today/scene";
import { backspaceOverRanges, fillRanges } from "@/lib/given-ranges";
import type { Scene } from "@/lib/today/scene";
import { BLANK_TOKEN } from "@/types/word-lists";

const spoken = (line: string) => sentenceSpans(line).map(([a, b]) => line.slice(a, b));

const typed = (line: string, ...words: string[]) => line.slice(...typedSpan(line, words));

test("a line is cut into its sentences, with the gap between two belonging to neither", () => {
  assert.deepEqual(spoken("His fingers hurt. The sound is ugly."), [
    "His fingers hurt.",
    "The sound is ugly.",
  ]);
  assert.deepEqual(spoken('"Stop!" Then she laughs… “Why?”'), [
    '"Stop!"',
    "Then she laughs…",
    "“Why?”",
  ]);
  assert.deepEqual(spoken("Mr. Brown calls Dr. Lee at 9."), ["Mr. Brown calls Dr. Lee at 9."]);
  assert.deepEqual(spoken('"No." he says.'), ['"No." he says.']);
  assert.deepEqual(spoken("One sentence only"), ["One sentence only"]);
});

test("only the sentence that holds the word is typed", () => {
  assert.equal(typed("His fingers hurt. The sound is ugly.", "hurt"), "His fingers hurt.");
  assert.equal(
    typed("Day one. Leo plays for ten minutes. It sounds terrible.", "terrible"),
    "It sounds terrible.",
  );
  // Two of the day's words in two sentences of one line: both sentences, and what lies between.
  assert.equal(
    typed("Leo plays a song. It is late. His fingers hurt.", "song", "hurt"),
    "Leo plays a song. It is late. His fingers hurt.",
  );
  // A word the line does not have leaves the whole line.
  assert.equal(typed("A short line.", "missing"), "A short line.");
  // Two words too far apart to type together: only the first word's sentence.
  assert.equal(
    typed(
      "Leo plays a song for her. Everyone in the small room listens very quietly tonight. His fingers hurt.",
      "song",
      "hurt",
    ),
    "Leo plays a song for her.",
  );
});

test("a long sentence is typed in part: the clause around the word, or a run of ten words", () => {
  const commas =
    "When the rain finally stops in the late afternoon, the children run outside, laughing loudly together.";
  assert.equal(typed(commas, "children"), "the children run outside,");
  // The clause alone is too short to hear out: the next one joins it.
  assert.equal(
    typed(
      "After a very long and tiring walk around the old city, we rest, and drink some cold water.",
      "rest",
    ),
    "we rest, and drink some cold water.",
  );
  const plain =
    "The old man who lives at the end of our quiet street grows enormous red tomatoes every single summer";
  const part = typed(plain, "street");
  assert.equal(part.split(" ").length, 10);
  assert.match(part, /\bstreet\b/);
  assert.ok(plain.includes(part));
});

const line = (id: number, en: string, speaker: string | null = null, audio = true) => ({
  id: `s${id}`,
  order: id,
  speaker,
  en,
  ar: `ترجمة ${id}`,
  audioUrl: audio ? `https://audio/${id}.mp3` : null,
});

const sections: PassageSection[] = [
  {
    id: "p1",
    order: 0,
    title: "One",
    titleAr: "",
    questions: [],
    sentences: [
      line(0, "Leo finds an old guitar in his grandma's house."),
      line(1, "Grandma, can I play this?", "Leo"),
      line(2, "Then I want to play that song for your birthday.", "Leo"),
    ],
  },
  {
    id: "p2",
    order: 1,
    title: "Two",
    titleAr: "",
    questions: [],
    sentences: [
      line(3, "Day one. Leo plays for ten minutes. It sounds terrible."),
      line(4, "His fingers hurt. The sound is ugly."),
      line(5, "I cannot do this.", "Leo"),
      line(6, "But he remembers the plan: practice only ten minutes every day."),
    ],
  },
];

const word = (w: string, audio = true): PassageWord => ({
  id: `w-${w}`,
  word: w,
  hintAr: `${w} بالعربي`,
  contextEn: null,
  contextAr: null,
  audioUrl: audio ? `https://audio/${w}.mp3` : null,
});

const passage = {
  sections,
  words: ["guitar", "song", "terrible", "hurt", "practice"].map((w) => word(w)),
};

const built = (): Scene => {
  const scene = buildScene(passage);
  assert.ok(scene);
  return scene;
};

test("the scene has one line for each word, in the passage's order, and each line is whole", () => {
  const scene = built();
  assert.deepEqual(
    scene.steps.map((step) => [step.line.index, step.typed]),
    [
      [0, "Leo finds an old guitar in his grandma's house."],
      [2, "Then I want to play that song for your birthday."],
      [3, "It sounds terrible."],
      [4, "His fingers hurt."],
      [6, "But he remembers the plan: practice only ten minutes every day."],
    ],
  );
  for (const step of scene.steps) {
    assert.equal(step.before + step.typed + step.after, step.line.en);
  }
  assert.equal(scene.steps[3]!.after, " The sound is ugly.");
  assert.deepEqual(
    scene.words.map((w) => w.word),
    ["guitar", "song", "terrible", "hurt", "practice"],
  );
});

test("a word with no clip, a line with none and a word with no line are left out", () => {
  const scene = buildScene({
    sections: [
      {
        ...sections[0]!,
        sentences: [line(0, "A guitar and a song."), line(1, "A cat sleeps.", null, false)],
      },
      sections[1]!,
    ],
    words: [
      word("guitar", false),
      word("cat"),
      word("plane"),
      word("song"),
      word("hurt"),
      word("plan"),
    ],
  });
  assert.ok(scene);
  assert.deepEqual(
    scene.words.map((w) => w.word),
    ["song", "hurt", "plan"],
  );
});

test("two words in one line share its step, and with too few words there is no scene", () => {
  const scene = buildScene({
    sections: [
      {
        ...sections[0]!,
        sentences: [line(0, "A guitar and a song."), line(1, "It hurts, hurt me.")],
      },
    ],
    words: [word("guitar"), word("song"), word("hurt")],
  });
  assert.ok(scene);
  assert.equal(scene.steps.length, 2);
  assert.deepEqual(
    scene.steps[0]!.words.map((w) => w.word),
    ["guitar", "song"],
  );
  assert.equal(buildScene({ sections, words: [word("guitar"), word("song")] }), null);
});

test("the day's scene is the first passage finished today, else the next one", () => {
  const dayOf = (iso: string) => iso.slice(0, 10);
  const progress = [
    { passageId: "old", completedAt: "2026-11-26T10:00:00Z" },
    { passageId: "second", completedAt: "2026-11-27T12:00:00Z" },
    { passageId: "first", completedAt: "2026-11-27T09:00:00Z" },
    { passageId: "gone", completedAt: "2026-11-27T08:00:00Z" },
    { passageId: "open", completedAt: null },
  ];
  const known = (id: string) => id !== "gone";
  assert.equal(
    sceneDayPassageId({ progress, todayISO: "2026-11-27", dayOf, known, next: "next" }),
    "first",
  );
  assert.equal(
    sceneDayPassageId({ progress, todayISO: "2026-11-28", dayOf, known, next: "next" }),
    "next",
  );
  assert.equal(
    sceneDayPassageId({ progress: [], todayISO: "2026-11-28", dayOf, known, next: null }),
    null,
  );
});

const stage = (scene: Scene, current: number) =>
  stageRows(scene, current).map((row) => `${row.line.index}:${row.role}`);

test("the stage keeps a few lines around the one being typed, and the last typed one", () => {
  const scene = built();
  // The next typed line is never shown.
  assert.deepEqual(stage(scene, 0), ["0:current", "1:context", "2:locked"]);
  assert.deepEqual(stage(scene, 2), [
    "0:done",
    "1:context",
    "2:done",
    "3:current",
    "4:locked",
    "5:context",
  ]);
  assert.deepEqual(stage(scene, 4), ["3:done", "4:done", "5:context", "6:current"]);
  assert.deepEqual(stage(scene, 5), []);
  assert.deepEqual(
    stageRows(scene, 2).map((row) => row.distance),
    [-3, -2, -1, 0, 1, 2],
  );
});

test("no line that is still to be typed is ever shown on the stage", () => {
  const scene = built();
  for (let current = 0; current < scene.steps.length; current++) {
    const later = new Set(scene.steps.slice(current + 1).map((step) => step.line.index));
    for (const row of stageRows(scene, current)) {
      assert.ok(!later.has(row.line.index) || row.role === "locked");
    }
  }
});

test("the words step has each word's meaning choices, its line blanked and where it is recorded", () => {
  const scene = built();
  const cards = sceneWordCards("p-1", scene);
  assert.deepEqual(
    cards.map((card) => [card.word.word, card.blanked]),
    [
      ["guitar", "Leo finds an old _____ in his grandma's house."],
      ["song", "Then I want to play that _____ for your birthday."],
      ["terrible", "Day one. Leo plays for ten minutes. It sounds _____."],
      ["hurt", "His fingers _____. The sound is ugly."],
      ["practice", "But he remembers the plan: _____ only ten minutes every day."],
    ].map(([word, line]) => [word, line!.replace("_____", BLANK_TOKEN)]),
  );
  for (const card of cards) {
    assert.equal(card.word.meaningOptions.length, 4);
    assert.ok(card.word.meaningOptions.includes(card.word.term));
  }
  const reviews = sceneReviewWords({ id: "p-1", title: "Ten Minutes", wordGroupId: "g-1" }, scene);
  assert.deepEqual(
    reviews.map((review) => [review.targetWord, review.groupId, review.sessionSource]),
    ["guitar", "song", "terrible", "hurt", "practice"].map((w) => [w, "g-1", "wordList"]),
  );
  assert.equal(reviews[3]!.bank?.homeSentence, "His fingers hurt. The sound is ugly.");
});

test("a context line that spells a word still to be typed is not shown", () => {
  const scene = buildScene({
    sections: [
      {
        ...sections[0]!,
        sentences: [
          line(0, "Leo finds an old guitar."),
          line(1, "He looks at it."),
          line(2, "He played one song every year."),
          line(3, "I want to play that song."),
          line(4, "It sounds terrible."),
        ],
      },
    ],
    words: ["guitar", "song", "terrible"].map((w) => word(w)),
  });
  assert.ok(scene);
  assert.deepEqual(stage(scene, 1), ["0:done", "1:context", "2:current", "3:locked", "4:locked"]);
  assert.deepEqual(stage(scene, 2), ["1:context", "2:done", "3:context", "4:current"]);
});

test("the names of a passage are its people and places, not its ordinary capitals", () => {
  const names = passageNames([
    { en: "On Monday, Leo walks to Millbrook with his grandma.", speaker: null },
    { en: 'She says, "Come here, Dad." Then Mr. Brown opens the door.', speaker: "Nora" },
    { en: "I speak English. The green door opens onto Green Street.", speaker: null },
    { en: "Millbrook's baker is Leo's friend: Honestly the best.", speaker: null },
  ]);
  assert.deepEqual([...names].sort(), ["Brown", "Leo", "Millbrook", "Nora", "Street"]);
});

test("names are written for the learner and the day's words are marked", () => {
  const target = "Leo takes the guitar to Millbrook.";
  const given = nameWordIndexes(target, new Set(["Leo", "Millbrook"]));
  assert.deepEqual([...given], [0, 5]);
  assert.deepEqual([...targetWordIndexes(target, [{ ...word("guitar"), audioUrl: "x" }])], [3]);

  // Each name with what follows it is written for the learner.
  assert.deepEqual(givenRanges(target, given), [
    [0, 4],
    [24, target.length],
  ]);
});

test("the typing passes over the names, forwards and back", () => {
  const target = "Then Leo plays.";
  const ranges = givenRanges(target, nameWordIndexes(target, new Set(["Leo"])));
  assert.equal(fillRanges(target, "Then ", ranges), "Then Leo ");
  assert.equal(fillRanges(target, "Then", ranges), "Then");
  // A backspace after the name takes the learner's own space before it.
  assert.equal(backspaceOverRanges(target, "Then Leo", ranges), "Then");
  assert.equal(backspaceOverRanges(target, "Then Leo p", ranges), "Then Leo p");
  // A name that opens the line is there before anything is typed.
  const first = "Leo sings.";
  const opening = givenRanges(first, new Set([0]));
  assert.equal(fillRanges(first, "", opening), "Leo ");
  assert.equal(backspaceOverRanges(first, "Leo", opening), "Leo ");
});

test("typing the scene is estimated in whole minutes, two at least", () => {
  const scene = built();
  assert.equal(sceneLinesMinutes(scene, 18), 3);
  assert.equal(sceneLinesMinutes(scene, 100), 2);
});
