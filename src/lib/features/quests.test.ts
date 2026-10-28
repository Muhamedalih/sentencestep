import assert from "node:assert/strict";
import test from "node:test";

import { QUEST_DEFAULTS, QUEST_TYPES } from "@/lib/features/catalog";
import type { QuestType } from "@/lib/features/catalog";
import {
  allQuestsCompleted,
  countedQuestEvents,
  eligibleQuestTypes,
  eventsForAudience,
  pickDailyQuestTypes,
  questEventsForLesson,
  questProgressPercent,
} from "@/lib/features/quests";
import type { QuestEvent, QuestTypeSettings } from "@/lib/features/quests";

function settings(overrides: Partial<Record<QuestType, Partial<QuestTypeSettings>>> = {}) {
  const out = {} as Record<QuestType, QuestTypeSettings>;
  for (const type of QUEST_TYPES) {
    out[type] = { enabled: true, target: QUEST_DEFAULTS[type].target, ...overrides[type] };
  }
  return out;
}

const everything = {
  reviewableWords: 50,
  dictationAvailable: true,
  dailySessionAvailable: true,
  passagesAvailable: true,
};

test("pickDailyQuestTypes: deals three distinct types and is stable for the same learner and day", () => {
  const first = pickDailyQuestTypes("user-1", "2026-09-30", QUEST_TYPES);
  const again = pickDailyQuestTypes("user-1", "2026-09-30", QUEST_TYPES);
  assert.equal(first.length, 3);
  assert.equal(new Set(first).size, 3);
  assert.deepEqual(first, again);
});

test("pickDailyQuestTypes: different days and learners get different mixes", () => {
  const days = new Set<string>();
  for (let day = 1; day <= 20; day++) {
    days.add(
      pickDailyQuestTypes("user-1", `2026-09-${String(day).padStart(2, "0")}`, QUEST_TYPES).join(),
    );
  }
  assert.ok(days.size > 1, "the mix should vary across days");

  const learners = new Set<string>();
  for (let n = 0; n < 20; n++) {
    learners.add(pickDailyQuestTypes(`user-${n}`, "2026-09-30", QUEST_TYPES).join());
  }
  assert.ok(learners.size > 1, "the mix should vary across learners");
});

test("pickDailyQuestTypes: fewer candidates than the count just returns them all; none returns none", () => {
  assert.deepEqual(pickDailyQuestTypes("u", "2026-09-30", ["sentences", "lessons"]).sort(), [
    "lessons",
    "sentences",
  ]);
  assert.deepEqual(pickDailyQuestTypes("u", "2026-09-30", []), []);
});

test("eligibleQuestTypes: everything on and achievable -> the whole random pool", () => {
  assert.deepEqual(
    eligibleQuestTypes(settings(), everything),
    QUEST_TYPES.filter((type) => type !== "sentenceReview"),
  );
});

test("eligibleQuestTypes: the sentence review is Today's fourth task and is never dealt at random", () => {
  assert.equal(eligibleQuestTypes(settings(), everything).includes("sentenceReview"), false);
  assert.equal(
    eligibleQuestTypes(settings({ sentenceReview: { enabled: true } }), everything).includes(
      "sentenceReview",
    ),
    false,
  );
});

test("eligibleQuestTypes: admin-disabled types are never dealt", () => {
  const types = eligibleQuestTypes(settings({ sentences: { enabled: false } }), everything);
  assert.equal(types.includes("sentences"), false);
});

test("eligibleQuestTypes: 'master words' needs at least target reviewable words", () => {
  const target = QUEST_DEFAULTS.masterWords.target;
  const few = eligibleQuestTypes(settings(), { ...everything, reviewableWords: target - 1 });
  assert.equal(few.includes("masterWords"), false);
  const enough = eligibleQuestTypes(settings(), { ...everything, reviewableWords: target });
  assert.equal(enough.includes("masterWords"), true);
});

test("eligibleQuestTypes: dictation and daily-session quests follow their features", () => {
  const off = eligibleQuestTypes(settings(), {
    ...everything,
    dictationAvailable: false,
    dailySessionAvailable: false,
  });
  assert.equal(off.includes("dictation"), false);
  assert.equal(off.includes("dailySession"), false);
});

test("eligibleQuestTypes: the passages quest is only dealt to a learner Passages is open to", () => {
  const closed = eligibleQuestTypes(settings(), { ...everything, passagesAvailable: false });
  assert.equal(closed.includes("passages"), false);
  const open = eligibleQuestTypes(settings(), everything);
  assert.equal(open.includes("passages"), true);
});

test("questEventsForLesson: sentences, one lesson, and accuracy only at 95%+", () => {
  assert.deepEqual(questEventsForLesson({ sentenceCount: 9, accuracy: 0.97 }), [
    { type: "sentences", amount: 9 },
    { type: "lessons", amount: 1 },
    { type: "accuracy", amount: 1 },
  ]);
  assert.equal(
    questEventsForLesson({ sentenceCount: 9, accuracy: 0.94 }).some((e) => e.type === "accuracy"),
    false,
  );
});

test("questEventsForLesson: a story also feeds Today's story task; a regular lesson does not", () => {
  const story = questEventsForLesson({ sentenceCount: 9, accuracy: 0.5, story: true });
  assert.deepEqual(
    story.filter((event) => event.audience === "today"),
    [{ type: "lessons", amount: 1, audience: "today" }],
  );
  // The random "finish lessons" quest still counts the story, as it always did.
  assert.ok(story.some((event) => event.type === "lessons" && event.audience === undefined));
  assert.equal(
    questEventsForLesson({ sentenceCount: 9, accuracy: 0.5 }).some((event) => event.audience),
    false,
  );
});

test("eventsForAudience: a learner with Today's session counts only the Today events of the shared types", () => {
  const events: QuestEvent[] = [
    { type: "lessons", amount: 1 },
    { type: "lessons", amount: 1, audience: "today" },
    { type: "passages", amount: 1 },
    { type: "passages", amount: 1, audience: "today" },
    { type: "masterWords", amount: 1 },
    { type: "masterWords", amount: 5, audience: "today" },
  ];
  assert.deepEqual(eventsForAudience(events, true), [
    { type: "lessons", amount: 1, audience: "today" },
    { type: "passages", amount: 1, audience: "today" },
    { type: "masterWords", amount: 5, audience: "today" },
  ]);
  assert.deepEqual(eventsForAudience(events, false), [
    { type: "lessons", amount: 1 },
    { type: "passages", amount: 1 },
    { type: "masterWords", amount: 1 },
  ]);
});

test("eventsForAudience: the other types have one kind of row, so their events count for everyone", () => {
  const events: QuestEvent[] = [
    { type: "sentences", amount: 9 },
    { type: "accuracy", amount: 1 },
    { type: "dictation", amount: 3 },
    { type: "dailySession", amount: 1 },
    { type: "sentenceReview", amount: 1 },
  ];
  assert.deepEqual(eventsForAudience(events, true), events);
  assert.deepEqual(eventsForAudience(events, false), events);
});

test("countedQuestEvents: until the honest ticks are open every event counts, as before", () => {
  const events: QuestEvent[] = [
    { type: "lessons", amount: 1 },
    { type: "lessons", amount: 1, audience: "today" },
    { type: "masterWords", amount: 1 },
  ];
  assert.deepEqual(countedQuestEvents(events, { todayLearner: true, honestTicks: false }), events);
  assert.deepEqual(countedQuestEvents(events, { todayLearner: false, honestTicks: false }), events);
  // A general masterWords event is a flashcard word: a Today learner's words task does not take it.
  assert.deepEqual(countedQuestEvents(events, { todayLearner: true, honestTicks: true }), [
    { type: "lessons", amount: 1, audience: "today" },
  ]);
});

test("questProgressPercent / allQuestsCompleted", () => {
  assert.equal(questProgressPercent({ progress: 5, target: 10 }), 50);
  assert.equal(questProgressPercent({ progress: 12, target: 10 }), 100);
  assert.equal(allQuestsCompleted([]), false);
  assert.equal(allQuestsCompleted([{ completed: true }, { completed: false }]), false);
  assert.equal(allQuestsCompleted([{ completed: true }, { completed: true }]), true);
});
