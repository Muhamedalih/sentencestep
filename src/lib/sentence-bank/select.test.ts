import assert from "node:assert/strict";
import test from "node:test";

import {
  DAILY_REVIEW_COUNT,
  MAX_PER_LESSON,
  MIN_REVIEW_WORDS,
  reviewWordCount,
  selectSentenceReview,
  sentencesStillToAsk,
} from "@/lib/sentence-bank/select";
import type { SentenceCandidate } from "@/lib/sentence-bank/select";
import { applyOutcome } from "@/lib/word-mastery/schedule";
import type { MasteryState } from "@/lib/word-mastery/schedule";

const TODAY = "2025-06-10";
const YESTERDAY = "2025-06-09";

let counter = 0;
function sentence(
  lessonId: string,
  orderIndex: number,
  en = "She bought a red car",
  completedOn = YESTERDAY,
): SentenceCandidate {
  counter += 1;
  return { id: `${lessonId}-s${orderIndex}-${counter}`, lessonId, orderIndex, en, completedOn };
}

function lesson(
  lessonId: string,
  count: number,
  completedOn = YESTERDAY,
  text = "She bought a red car",
): SentenceCandidate[] {
  return Array.from({ length: count }, (_unused, index) =>
    sentence(lessonId, index + 1, text, completedOn),
  );
}

function ids(selection: { items: { sentence: SentenceCandidate }[] }): string[] {
  return selection.items.map((item) => item.sentence.id);
}

function states(entries: [SentenceCandidate, MasteryState][]): Map<string, MasteryState> {
  return new Map(entries.map(([entry, state]) => [entry.id, state]));
}

test("the batch is three sentences, at most two from one lesson, from sentences of four words or more", () => {
  assert.equal(DAILY_REVIEW_COUNT, 3);
  assert.equal(MAX_PER_LESSON, 2);
  assert.equal(MIN_REVIEW_WORDS, 4);
});

test("a word is a piece of text with a letter in it: a lone dash does not count", () => {
  assert.equal(reviewWordCount("She bought a red car"), 5);
  assert.equal(reviewWordCount("Hello — world, again!"), 3);
  assert.equal(reviewWordCount("  "), 0);
  assert.equal(reviewWordCount("Hi, Tom!"), 2);
});

test("only sentences of four words or more from a lesson finished on an earlier day are considered", () => {
  const pool = [
    sentence("a", 1, "Hi, Tom!"),
    sentence("a", 2, "I like tea"), // three words
    sentence("b", 1, "I like green tea"), // exactly four
    sentence("c", 1, "She bought a red car", TODAY), // typed today: not yet a memory to test
    sentence("d", 1, "He walks to the park", "2025-06-01"),
  ];
  const picked = selectSentenceReview(pool, new Map(), { todayISO: TODAY });
  assert.deepEqual(ids(picked), [pool[2]!.id, pool[4]!.id]);
  assert.equal(picked.more, false);
});

test("a sentence nobody has asked back yet counts as new, and new is due", () => {
  const [only] = lesson("a", 1);
  const picked = selectSentenceReview([only!], new Map(), { todayISO: TODAY });
  assert.deepEqual(picked.items, [{ sentence: only, strength: 0, reason: "spread" }]);
});

test("due sentences come first, the longest waiting first and the weaker first among equals", () => {
  const [a1, a2, a3, a4] = lesson("a", 4);
  const [b1, b2] = lesson("b", 2);
  const picked = selectSentenceReview(
    [b1!, a1!, a2!, a3!, a4!, b2!],
    states([
      [a1!, { strength: 3, dueOn: "2025-06-09" }],
      [a2!, { strength: 1, dueOn: "2025-06-09" }],
      [a3!, { strength: 2, dueOn: "2025-06-05" }],
      [b1!, { strength: 1, dueOn: "2025-06-10" }],
    ]),
    { todayISO: TODAY, cap: 4, maxPerLesson: 4 },
  );
  // a3 has waited longest; a2 then a1 share a day (the weaker, strength 1, first); b1 is due today.
  assert.deepEqual(ids(picked), [a3!.id, a2!.id, a1!.id, b1!.id]);
  assert.deepEqual(
    picked.items.map((item) => [item.reason, item.strength]),
    [
      ["due", 2],
      ["due", 1],
      ["due", 3],
      ["due", 1],
    ],
  );
});

test("a sentence scheduled for a later day stays out, and is not mistaken for a new one", () => {
  const [a1, a2] = lesson("a", 2);
  const picked = selectSentenceReview(
    [a1!, a2!],
    states([[a1!, { strength: 2, dueOn: "2025-06-13" }]]),
    { todayISO: TODAY },
  );
  assert.deepEqual(ids(picked), [a2!.id]);
});

test("a sentence missed yesterday is due again today", () => {
  const [a1] = lesson("a", 1);
  const missed = applyOutcome({ strength: 3, dueOn: YESTERDAY }, "missed", YESTERDAY);
  assert.deepEqual(missed.state, { strength: 0, dueOn: TODAY });
  const picked = selectSentenceReview([a1!], states([[a1!, missed.state]]), { todayISO: TODAY });
  assert.deepEqual(
    picked.items.map((item) => [item.reason, item.strength]),
    [["due", 0]],
  );
});

test("due sentences are asked before new ones, even new ones holding a weak word", () => {
  const [a1, a2] = lesson("a", 2);
  const [b1] = lesson("b", 1, YESTERDAY, "The doctor called yesterday evening");
  const picked = selectSentenceReview(
    [b1!, a2!, a1!],
    states([[a2!, { strength: 1, dueOn: TODAY }]]),
    { todayISO: TODAY, weakWords: new Set(["doctor"]) },
  );
  assert.deepEqual(ids(picked), [a2!.id, b1!.id, a1!.id]);
  assert.deepEqual(
    picked.items.map((item) => item.reason),
    ["due", "weak", "spread"],
  );
});

test("new sentences holding the learner's weak words come before ordinary ones, the most weak words first", () => {
  const plain = lesson("a", 3);
  const one = sentence("b", 1, "The doctor called last night", YESTERDAY);
  const two = sentence("c", 1, "The doctor wrote a letter yesterday", YESTERDAY);
  const picked = selectSentenceReview([...plain, one, two], new Map(), {
    todayISO: TODAY,
    weakWords: new Set(["doctor", "letter"]),
  });
  assert.deepEqual(ids(picked), [two.id, one.id, plain[0]!.id]);
  assert.deepEqual(
    picked.items.map((item) => item.reason),
    ["weak", "weak", "spread"],
  );
});

test("a weak function word or contraction never pulls a sentence forward", () => {
  const plain = sentence("a", 1, "She bought a red car");
  const withFunctionWords = sentence("b", 1, "We went into the room and sat down", YESTERDAY);
  const picked = selectSentenceReview([withFunctionWords, plain], new Map(), {
    todayISO: TODAY,
    weakWords: new Set(["into", "and", "the", "went"]),
  });
  // "went" is a content word and weak, so that sentence does come first - but the others do not.
  assert.equal(picked.items[0]!.reason, "weak");
  const onlyFunction = selectSentenceReview([withFunctionWords, plain], new Map(), {
    todayISO: TODAY,
    weakWords: new Set(["into", "and", "the", "don't"]),
  });
  assert.deepEqual(
    onlyFunction.items.map((item) => item.reason),
    ["spread", "spread"],
  );
});

test("the rest are spread over the learner's lessons, the newest lesson first, one from each in turn", () => {
  const newest = lesson("newest", 4, "2025-06-09");
  const middle = lesson("middle", 4, "2025-06-05");
  const oldest = lesson("oldest", 1, "2025-05-01");
  const pool = [...oldest, ...middle, ...newest];

  const three = selectSentenceReview(pool, new Map(), { todayISO: TODAY });
  assert.deepEqual(ids(three), [newest[0]!.id, middle[0]!.id, oldest[0]!.id]);
  assert.equal(three.more, true);

  const five = selectSentenceReview(pool, new Map(), { todayISO: TODAY, cap: 5 });
  // Two from a lesson at most, even when more are asked for.
  assert.deepEqual(ids(five), [
    newest[0]!.id,
    middle[0]!.id,
    oldest[0]!.id,
    newest[1]!.id,
    middle[1]!.id,
  ]);
});

test("a learner with a single finished lesson is asked two sentences, not three", () => {
  const only = lesson("only", 6);
  const picked = selectSentenceReview(only, new Map(), { todayISO: TODAY });
  assert.deepEqual(ids(picked), [only[0]!.id, only[1]!.id]);
  assert.equal(picked.more, true);
  assert.deepEqual(selectSentenceReview([], new Map(), { todayISO: TODAY }), {
    items: [],
    more: false,
  });
});

test("a lesson's due sentences obey the same two-a-lesson limit and the third waits for tomorrow", () => {
  const stories = lesson("story", 3, "2025-06-01");
  const picked = selectSentenceReview(
    stories,
    states(
      stories.map((entry): [SentenceCandidate, MasteryState] => [
        entry,
        { strength: 1, dueOn: TODAY },
      ]),
    ),
    { todayISO: TODAY },
  );
  assert.deepEqual(ids(picked), [stories[0]!.id, stories[1]!.id]);
  // It is still due: tomorrow it is the one that has waited longest.
  const tomorrow = selectSentenceReview(
    stories,
    states([
      [stories[0]!, { strength: 2, dueOn: "2025-06-13" }],
      [stories[1]!, { strength: 2, dueOn: "2025-06-13" }],
      [stories[2]!, { strength: 1, dueOn: TODAY }],
    ]),
    { todayISO: "2025-06-11" },
  );
  assert.deepEqual(ids(tomorrow), [stories[2]!.id]);
});

test("there is no counter of what is waiting: forty due sentences give three and a yes or no", () => {
  const pool = Array.from({ length: 20 }, (_unused, index) => lesson(`l${index}`, 2)).flat();
  const picked = selectSentenceReview(
    pool,
    states(
      pool.map((entry): [SentenceCandidate, MasteryState] => [
        entry,
        { strength: 2, dueOn: "2025-05-01" },
      ]),
    ),
    { todayISO: TODAY },
  );
  assert.equal(picked.items.length, 3);
  assert.equal(picked.more, true);
  assert.deepEqual(Object.keys(picked).sort(), ["items", "more"]);
});

test("a sentence left for weeks is asked once like any due one, and the ladder carries on from the answer", () => {
  const [stale] = lesson("a", 1, "2025-03-01");
  const state: MasteryState = { strength: 3, dueOn: "2025-04-01" }; // seventy days overdue
  const picked = selectSentenceReview([stale!], states([[stale!, state]]), { todayISO: TODAY });
  assert.deepEqual(
    picked.items.map((item) => [item.reason, item.strength]),
    [["due", 3]],
  );
  // No jump either way: clean is one step up, a miss is back to the start.
  assert.deepEqual(applyOutcome(state, "clean", TODAY).state, { strength: 4, dueOn: "2025-06-26" });
  assert.deepEqual(applyOutcome(state, "missed", TODAY).state, {
    strength: 0,
    dueOn: "2025-06-11",
  });
});

test("a second batch leaves out what the first one asked", () => {
  const pool = [...lesson("a", 3), ...lesson("b", 3), ...lesson("c", 3)];
  const first = selectSentenceReview(pool, new Map(), { todayISO: TODAY });
  const second = selectSentenceReview(pool, new Map(), {
    todayISO: TODAY,
    exclude: new Set(ids(first)),
  });
  assert.equal(second.items.length, 3);
  for (const id of ids(second)) assert.ok(!ids(first).includes(id));
  const none = selectSentenceReview(pool, new Map(), { todayISO: TODAY, cap: 0 });
  assert.deepEqual(none.items, []);
  assert.equal(none.more, true);
});

test("the same sentences in any order give the same batch, and nothing passed in is changed", () => {
  const pool = [
    ...lesson("a", 3),
    ...lesson("b", 3, "2025-06-02"),
    ...lesson("c", 3, "2025-05-20"),
  ];
  const dueState = states([[pool[4]!, { strength: 1, dueOn: "2025-06-08" }]]);
  const options = { todayISO: TODAY, weakWords: new Set(["bought"]) };
  const snapshot = JSON.stringify(pool);
  const forward = ids(selectSentenceReview(pool, dueState, options));
  const backward = ids(selectSentenceReview([...pool].reverse(), dueState, options));
  assert.deepEqual(forward, backward);
  assert.equal(JSON.stringify(pool), snapshot);
  assert.deepEqual([...dueState.values()], [{ strength: 1, dueOn: "2025-06-08" }]);
});

test("a sentence listed twice is asked once", () => {
  const [a1] = lesson("a", 1);
  const picked = selectSentenceReview([a1!, { ...a1! }], new Map(), { todayISO: TODAY });
  assert.equal(picked.items.length, 1);
});

test("the batch still to ask follows the day's row when there is one, and the weekly check never uses it up", () => {
  // The row was dealt for three and nothing counted yet: three to ask, whatever the check did today.
  assert.equal(sentencesStillToAsk({ target: 3, progress: 0 }, 10), 3);
  assert.equal(sentencesStillToAsk({ target: 3, progress: 1 }, 10), 2);
  assert.equal(sentencesStillToAsk({ target: 2, progress: 0 }, 0), 2);
  assert.equal(sentencesStillToAsk({ target: 3, progress: 3 }, 0), 0);
  assert.equal(sentencesStillToAsk({ target: 1, progress: 5 }, 0), 0);
  // With no row, the day's batch less the sentences already asked today.
  assert.equal(sentencesStillToAsk(undefined, 0), DAILY_REVIEW_COUNT);
  assert.equal(sentencesStillToAsk(undefined, 2), 1);
  assert.equal(sentencesStillToAsk(undefined, 9), 0);
});
