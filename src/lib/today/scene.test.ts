import assert from "node:assert/strict";
import test from "node:test";

import type { PassageSection, PassageWord } from "@/lib/passages/types";
import {
  buildScene,
  sceneDayPassageId,
  sceneLinesMinutes,
  sceneReviewWords,
  sceneScript,
  sceneWordCards,
  sentenceSpans,
  typedSpan,
} from "@/lib/today/scene";
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

const kinds = (scene: Scene, current: number) =>
  sceneScript(scene, current).map((row) => {
    if (row.kind === "done" || row.kind === "current") return `${row.kind}:${row.step.line.index}`;
    if (row.kind === "context") return `context:${row.line.index}`;
    if (row.kind === "gap") return `gap:${row.context?.index ?? "-"}`;
    return row.kind;
  });

test("the script keeps the last finished lines, the current one, one line more and a locked mark", () => {
  const scene = built();
  assert.deepEqual(kinds(scene, 0), ["current:0", "context:1", "locked"]);
  // The next line is still to be typed: it is never shown, only a locked mark.
  assert.deepEqual(kinds(scene, 2), ["done:0", "gap:1", "done:2", "current:3", "locked"]);
  assert.deepEqual(kinds(scene, 3), [
    "done:0",
    "gap:1",
    "done:2",
    "done:3",
    "current:4",
    "context:5",
    "locked",
  ]);
  // Only three finished lines stay; what is above them is left out.
  assert.deepEqual(kinds(scene, 4), ["gap:1", "done:2", "done:3", "done:4", "gap:5", "current:6"]);
  assert.deepEqual(kinds(scene, 5), ["gap:-", "done:3", "done:4", "gap:5", "done:6"]);
});

test("no line that is still to be typed ever appears in the script", () => {
  const scene = built();
  for (let current = 0; current < scene.steps.length; current++) {
    const later = new Set(scene.steps.slice(current + 1).map((step) => step.line.index));
    for (const row of sceneScript(scene, current)) {
      const shown =
        row.kind === "context"
          ? row.line.index
          : row.kind === "gap"
            ? row.context?.index
            : row.kind === "done" || row.kind === "current"
              ? row.step.line.index
              : undefined;
      assert.ok(shown === undefined || !later.has(shown), `line ${shown} shown at ${current}`);
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
  assert.deepEqual(kinds(scene, 1), ["done:0", "gap:1", "current:2", "locked"]);
  assert.deepEqual(kinds(scene, 2), ["done:0", "gap:1", "done:2", "gap:3", "current:4"]);
});

test("typing the scene is estimated in whole minutes, two at least", () => {
  const scene = built();
  assert.equal(sceneLinesMinutes(scene, 18), 3);
  assert.equal(sceneLinesMinutes(scene, 100), 2);
});
