import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { QuestType } from "@/lib/features/catalog";
import type { DailyQuest, TodayQuestInfo } from "@/lib/features/quests";

import { isTodayMode, showsNewHome, splitToday, todayRedoHref, todayTotals } from "./home-layout";

function info(
  kind: TodayQuestInfo["kind"],
  overrides: Partial<TodayQuestInfo> = {},
): TodayQuestInfo {
  return {
    kind,
    title: "",
    supportTitle: null,
    levelCode: null,
    minutes: 5,
    href: `/learn/${kind}`,
    redoHref: null,
    accuracy: null,
    paid: false,
    ...overrides,
  };
}

function quest(
  slot: number,
  type: QuestType,
  kind: TodayQuestInfo["kind"] | null,
  overrides: Partial<DailyQuest> = {},
  infoOverrides: Partial<TodayQuestInfo> = {},
): DailyQuest {
  return {
    slot,
    type,
    target: 1,
    progress: 0,
    xp: 10,
    completed: false,
    ...(kind ? { today: info(kind, infoOverrides) } : {}),
    ...overrides,
  };
}

const day = (overrides: { listen?: Partial<DailyQuest>; story?: Partial<DailyQuest> } = {}) => [
  quest(10, "passages", "listen", { xp: 15, ...overrides.listen }, { href: "/learn/passages/p1" }),
  quest(11, "lessons", "story", overrides.story ?? {}, { href: "/learn/stories/s1" }),
  quest(12, "masterWords", "words", {}, { href: "/learn/today/go?step=words" }),
  quest(13, "sentenceReview", "sentences"),
];

describe("showsNewHome", () => {
  const all = {
    signedIn: true,
    newHome: true,
    todaySession: true,
    hasEngagement: true,
    classic: false,
  };

  it("needs a signed-in learner, the permission, Today's session and the day's cards", () => {
    assert.equal(showsNewHome(all), true);
    assert.equal(showsNewHome({ ...all, signedIn: false }), false);
    assert.equal(showsNewHome({ ...all, newHome: false }), false);
    assert.equal(showsNewHome({ ...all, todaySession: false }), false);
    assert.equal(showsNewHome({ ...all, hasEngagement: false }), false);
  });

  it("?classic=1 is the way back to the current Home", () => {
    assert.equal(showsNewHome({ ...all, classic: true }), false);
  });
});

describe("splitToday", () => {
  it("puts the three tasks in the box and the self-test on its own card", () => {
    const { tasks, test } = splitToday(day());
    assert.deepEqual(
      tasks.map((entry) => entry.slot),
      [10, 11, 12],
    );
    assert.equal(test?.slot, 13);
  });

  it("has no card on a day without a test, and never mistakes a random quest for one", () => {
    const quests = day().slice(0, 3);
    assert.equal(splitToday(quests).test, null);
    assert.equal(splitToday([quest(1, "lessons", null)]).test, null);
  });
});

describe("isTodayMode", () => {
  it("is true only for quests tied to a passage, story or words", () => {
    assert.equal(isTodayMode(day()), true);
    assert.equal(isTodayMode([quest(1, "lessons", null), quest(2, "sentences", null)]), false);
    assert.equal(isTodayMode([]), false);
  });
});

describe("todayTotals", () => {
  it("counts the three tasks and what they pay, leaving the test out", () => {
    const { tasks } = splitToday(day());
    assert.deepEqual(todayTotals(tasks), { done: 0, total: 3, totalXp: 35, earnedXp: 0 });
  });

  it("counts a finished task as paid only when its XP was really paid", () => {
    const paid = quest(10, "passages", "listen", { xp: 15, completed: true }, { paid: true });
    const unpaid = quest(11, "lessons", "story", { completed: true }, { paid: false });
    const words = quest(12, "masterWords", "words");
    assert.deepEqual(todayTotals([paid, unpaid, words]), {
      done: 2,
      total: 3,
      totalXp: 35,
      earnedXp: 15,
    });
  });
});

describe("todayRedoHref", () => {
  it("restarts the passage or story finished today, in order", () => {
    const quests = [
      quest(10, "passages", "listen", { completed: true }, { redoHref: "/learn/passages/p1" }),
      quest(11, "lessons", "story", { completed: true }, { redoHref: "/learn/stories/s1" }),
      quest(
        12,
        "masterWords",
        "words",
        { completed: true },
        { href: "/learn/today/go?step=words" },
      ),
    ];
    assert.equal(todayRedoHref(quests), "/learn/passages/p1?today=1&redo=1");
  });

  it("falls back to the words step, and to nothing when there is nothing to redo", () => {
    assert.equal(
      todayRedoHref([
        quest(12, "masterWords", "words", {}, { href: "/learn/today/go?step=words" }),
      ]),
      "/learn/today/go?step=words",
    );
    assert.equal(todayRedoHref([]), null);
  });
});
