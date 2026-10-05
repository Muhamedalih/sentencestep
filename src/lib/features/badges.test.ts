import assert from "node:assert/strict";
import test from "node:test";

import { buildBadgeShelf } from "@/lib/features/badge-display";
import { BADGE_DEFS, BADGE_IDS, isBadgeId } from "@/lib/features/catalog";
import {
  badgeProgress,
  EMPTY_BADGE_METRICS,
  MAX_INDIVIDUAL_BADGE_CELEBRATIONS,
  newlyQualifiedBadges,
  summarizeNewBadges,
} from "@/lib/features/badges";
import type { BadgeMetrics } from "@/lib/features/badges";
import { LEARNER_LEVELS } from "@/lib/progress/learner-level";

const metrics = (overrides: Partial<BadgeMetrics>): BadgeMetrics => ({
  ...EMPTY_BADGE_METRICS,
  ...overrides,
});
const none = new Set<string>();

test("catalog: ids are unique and there are about two dozen badges", () => {
  assert.equal(new Set(BADGE_IDS).size, BADGE_IDS.length);
  assert.ok(BADGE_IDS.length >= 20 && BADGE_IDS.length <= 30);
  assert.equal(isBadgeId("streak7"), true);
  assert.equal(isBadgeId("nope"), false);
});

test("catalog: level badge thresholds come from the real XP tiers", () => {
  const threshold = (id: string) => BADGE_DEFS.find((badge) => badge.id === id)?.threshold;
  assert.equal(
    threshold("levelExplorer"),
    LEARNER_LEVELS.find((l) => l.name === "Explorer")?.minXp,
  );
  assert.equal(
    threshold("levelAdvanced"),
    LEARNER_LEVELS.find((l) => l.name === "Advanced")?.minXp,
  );
});

test("newlyQualifiedBadges: a brand-new learner qualifies for nothing", () => {
  assert.deepEqual(newlyQualifiedBadges(EMPTY_BADGE_METRICS, none, none), []);
});

test("newlyQualifiedBadges: thresholds are inclusive and each stat maps to its own badges", () => {
  const ids = newlyQualifiedBadges(
    metrics({ longestStreak: 7, totalSentences: 100, lessonCount: 1, maxWpm: 30 }),
    none,
    none,
  );
  assert.deepEqual(
    [...ids].sort(),
    ["lessons1", "sentences100", "streak3", "streak7", "wpm30"].sort(),
  );
});

test("newlyQualifiedBadges: already-earned and admin-disabled badges are skipped", () => {
  const ids = newlyQualifiedBadges(
    metrics({ longestStreak: 30 }),
    new Set(["streak3"]),
    new Set(["streak30"]),
  );
  assert.deepEqual([...ids].sort(), ["streak7"]);
});

test("newlyQualifiedBadges: event badges are never derived from stats", () => {
  const ids = newlyQualifiedBadges(
    metrics({ longestStreak: 999, totalSentences: 99999, lessonCount: 999, xp: 99999 }),
    none,
    none,
  );
  for (const event of [
    "firstDictation",
    "firstFromMemory",
    "firstCard",
    "firstDailySession",
    "questDay",
  ]) {
    assert.equal(ids.includes(event as never), false);
  }
});

test("badgeProgress: capped at the target, event badges are all-or-nothing", () => {
  const streak30 = BADGE_DEFS.find((badge) => badge.id === "streak30")!;
  const half = badgeProgress(streak30, metrics({ longestStreak: 15 }), false);
  assert.deepEqual(half, { current: 15, target: 30, fraction: 0.5 });
  assert.equal(badgeProgress(streak30, metrics({ longestStreak: 400 }), true).fraction, 1);
  const event = BADGE_DEFS.find((badge) => badge.id === "firstCard")!;
  assert.equal(badgeProgress(event, EMPTY_BADGE_METRICS, false).fraction, 0);
  assert.equal(badgeProgress(event, EMPTY_BADGE_METRICS, true).fraction, 1);
});

test("summarizeNewBadges: a few are celebrated individually, a flood collapses into one summary", () => {
  assert.deepEqual(summarizeNewBadges(["streak3", "lessons1"]), {
    individual: ["streak3", "lessons1"],
    bulkCount: 0,
  });
  const many = BADGE_IDS.slice(0, MAX_INDIVIDUAL_BADGE_CELEBRATIONS + 1);
  assert.deepEqual(summarizeNewBadges(many), { individual: [], bulkCount: many.length });
  assert.deepEqual(summarizeNewBadges([]), { individual: [], bulkCount: 0 });
});

test("buildBadgeShelf: earned first (newest first), then locked by closeness; disabled unearned are hidden", () => {
  const shelf = buildBadgeShelf(
    metrics({ longestStreak: 20, lessonCount: 1 }),
    [
      { id: "lessons1", earnedAt: "2026-09-01T00:00:00Z", seen: true },
      { id: "streak3", earnedAt: "2026-09-05T00:00:00Z", seen: false },
    ],
    new Set(["wpm70"]),
  );
  const ids = shelf.map((item) => item.badge.id);
  assert.deepEqual(ids.slice(0, 2), ["streak3", "lessons1"]);
  assert.equal(ids.includes("wpm70"), false);
  assert.equal(shelf.find((item) => item.badge.id === "streak3")?.isNew, true);
  assert.equal(shelf.find((item) => item.badge.id === "lessons1")?.isNew, false);
  // Locked: streak7 (20/7 capped at 1?) is qualified-by-stats but unearned here; the closest locked badge leads the locked group.
  const locked = shelf.filter((item) => !item.earned);
  for (let i = 1; i < locked.length; i++) {
    assert.ok(locked[i - 1]!.progress.fraction >= locked[i]!.progress.fraction);
  }
});

test("buildBadgeShelf: a badge the admin later disabled stays visible if it was already earned", () => {
  const shelf = buildBadgeShelf(
    EMPTY_BADGE_METRICS,
    [{ id: "streak3", earnedAt: "2026-09-05T00:00:00Z", seen: true }],
    new Set(["streak3"]),
  );
  assert.equal(
    shelf.some((item) => item.badge.id === "streak3" && item.earned),
    true,
  );
});
