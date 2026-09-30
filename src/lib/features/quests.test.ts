import assert from "node:assert/strict";
import test from "node:test";

import { QUEST_DEFAULTS, QUEST_TYPES } from "@/lib/features/catalog";
import type { QuestType } from "@/lib/features/catalog";
import {
  allQuestsCompleted,
  eligibleQuestTypes,
  pickDailyQuestTypes,
  questEventsForLesson,
  questProgressPercent,
} from "@/lib/features/quests";
import type { QuestTypeSettings } from "@/lib/features/quests";

function settings(overrides: Partial<Record<QuestType, Partial<QuestTypeSettings>>> = {}) {
  const out = {} as Record<QuestType, QuestTypeSettings>;
  for (const type of QUEST_TYPES) {
    out[type] = { enabled: true, target: QUEST_DEFAULTS[type].target, ...overrides[type] };
  }
  return out;
}

const everything = { reviewableWords: 50, dictationAvailable: true, dailySessionAvailable: true };

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

test("eligibleQuestTypes: everything on and achievable -> the whole pool", () => {
  assert.deepEqual(eligibleQuestTypes(settings(), everything), [...QUEST_TYPES]);
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

test("questProgressPercent / allQuestsCompleted", () => {
  assert.equal(questProgressPercent({ progress: 5, target: 10 }), 50);
  assert.equal(questProgressPercent({ progress: 12, target: 10 }), 100);
  assert.equal(allQuestsCompleted([]), false);
  assert.equal(allQuestsCompleted([{ completed: true }, { completed: false }]), false);
  assert.equal(allQuestsCompleted([{ completed: true }, { completed: true }]), true);
});
