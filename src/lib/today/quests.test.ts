import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { QuestType } from "@/lib/features/catalog";
import type { DailyQuest } from "@/lib/features/quests";

import { TODAY_QUEST_SLOT_BASE, questsByStep, todayQuestRows, todayQuestSlot } from "./quests";

const settings = {
  sentences: { target: 15, xp: 10 },
  lessons: { target: 2, xp: 10 },
  accuracy: { target: 1, xp: 15 },
  masterWords: { target: 5, xp: 10 },
  dictation: { target: 5, xp: 15 },
  dailySession: { target: 1, xp: 15 },
  passages: { target: 3, xp: 15 },
} satisfies Record<QuestType, { target: number; xp: number }>;

describe("todayQuestRows", () => {
  it("deals passages, one lesson and master words in slots 10-12 with the tuned XP", () => {
    assert.deepEqual(todayQuestRows(settings), [
      { slot: 10, type: "passages", target: 3, xp: 15 },
      { slot: 11, type: "lessons", target: 1, xp: 10 },
      { slot: 12, type: "masterWords", target: 5, xp: 10 },
    ]);
  });

  it("keeps the slots clear of the random mix (0-2)", () => {
    assert.ok(todayQuestSlot("listen") >= TODAY_QUEST_SLOT_BASE);
  });
});

function quest(slot: number, type: QuestType, progress = 0, completed = false): DailyQuest {
  return { slot, type, target: 3, progress, xp: 10, completed };
}

describe("questsByStep", () => {
  it("maps Today's rows to their steps and ignores the random ones", () => {
    const byStep = questsByStep([
      quest(0, "lessons", 1),
      quest(10, "passages", 2),
      quest(11, "lessons", 0),
      quest(12, "masterWords", 3, true),
    ]);
    assert.equal(byStep.listen?.progress, 2);
    assert.equal(byStep.story?.slot, 11);
    assert.equal(byStep.words?.completed, true);
  });

  it("does not map a row in a Today slot with the wrong type", () => {
    assert.deepEqual(questsByStep([quest(10, "sentences")]), {});
  });
});
