import { test } from "node:test";
import assert from "node:assert/strict";

import {
  computeMigrationDailyProgress,
  computeMigrationXp,
  hasMigratableGuestState,
  mergeStreak,
  selectCompletionsToMigrate,
} from "./guest-migration";
import { emptyProgressState, emptyStreak } from "./types";
import type { ValidatedGuestCompletion } from "./guest-migration";

function completion(overrides: Partial<ValidatedGuestCompletion> = {}): ValidatedGuestCompletion {
  return {
    lessonId: "lesson-1",
    mode: "normal",
    accuracy: 1,
    completedAt: "2026-08-10T12:00:00.000Z",
    sentenceCount: 5,
    ...overrides,
  };
}

test("selectCompletionsToMigrate: a lesson already completed server-side is excluded", () => {
  const validated = [completion({ lessonId: "a" }), completion({ lessonId: "b" })];
  const result = selectCompletionsToMigrate(validated, new Set(["a"]));
  assert.deepEqual(
    result.map((c) => c.lessonId),
    ["b"],
  );
});

test("selectCompletionsToMigrate: nothing on the server yet keeps every guest completion", () => {
  const validated = [completion({ lessonId: "a" }), completion({ lessonId: "b" })];
  const result = selectCompletionsToMigrate(validated, new Set());
  assert.equal(result.length, 2);
});

test("selectCompletionsToMigrate: everything already on the server migrates nothing (idempotent re-run)", () => {
  const validated = [completion({ lessonId: "a" }), completion({ lessonId: "b" })];
  const result = selectCompletionsToMigrate(validated, new Set(["a", "b"]));
  assert.deepEqual(result, []);
});

test("computeMigrationXp: no completions to migrate earns no XP", () => {
  assert.equal(computeMigrationXp([]), 0);
});

test("computeMigrationXp: sums each migrated completion as a first completion, accuracy-bonus included, no daily-goal bonus", () => {
  const toMigrate = [
    completion({ accuracy: 1 }), // high accuracy: base 20 + high-accuracy 10 + first-completion 15 = 45
    completion({ accuracy: 0.5 }), // base 20 + first-completion 15 = 35
  ];
  assert.equal(computeMigrationXp(toMigrate), 45 + 35);
});

test("computeMigrationDailyProgress: only counts completions that happened today", () => {
  const toMigrate = [
    completion({ completedAt: "2026-08-10T09:00:00.000Z", sentenceCount: 5 }),
    completion({ completedAt: "2026-08-09T09:00:00.000Z", sentenceCount: 7 }),
  ];
  assert.equal(computeMigrationDailyProgress(toMigrate, "2026-08-10"), 5);
});

test("computeMigrationDailyProgress: sums multiple completions from today", () => {
  const toMigrate = [
    completion({ completedAt: "2026-08-10T09:00:00.000Z", sentenceCount: 5 }),
    completion({ completedAt: "2026-08-10T18:00:00.000Z", sentenceCount: 3 }),
  ];
  assert.equal(computeMigrationDailyProgress(toMigrate, "2026-08-10"), 8);
});

test("computeMigrationDailyProgress: nothing from today contributes nothing", () => {
  const toMigrate = [completion({ completedAt: "2026-08-01T09:00:00.000Z", sentenceCount: 5 })];
  assert.equal(computeMigrationDailyProgress(toMigrate, "2026-08-10"), 0);
});

test("mergeStreak: no server streak and no guest streak is a no-op", () => {
  const result = mergeStreak(null, emptyStreak);
  assert.equal(result.changed, false);
});

test("mergeStreak: no server streak adopts the guest's streak wholesale", () => {
  const guestStreak = { currentStreak: 4, longestStreak: 6, lastActiveDate: "2026-08-10" };
  const result = mergeStreak(null, guestStreak);
  assert.equal(result.changed, true);
  assert.deepEqual(result.streak, guestStreak);
});

test("mergeStreak: an existing server streak keeps its own current streak and last-active date", () => {
  const serverStreak = { currentStreak: 2, longestStreak: 2, lastActiveDate: "2026-08-10" };
  const guestStreak = { currentStreak: 9, longestStreak: 9, lastActiveDate: "2026-07-01" };
  const result = mergeStreak(serverStreak, guestStreak);
  assert.equal(result.changed, true);
  assert.deepEqual(result.streak, {
    currentStreak: 2,
    longestStreak: 9,
    lastActiveDate: "2026-08-10",
  });
});

test("mergeStreak: a guest streak no longer than the server's changes nothing", () => {
  const serverStreak = { currentStreak: 5, longestStreak: 10, lastActiveDate: "2026-08-10" };
  const guestStreak = { currentStreak: 3, longestStreak: 3, lastActiveDate: "2026-08-01" };
  const result = mergeStreak(serverStreak, guestStreak);
  assert.equal(result.changed, false);
  assert.deepEqual(result.streak, serverStreak);
});

test("mergeStreak: an equal guest longestStreak changes nothing (never overwrites with an equal-or-weaker value)", () => {
  const serverStreak = { currentStreak: 5, longestStreak: 10, lastActiveDate: "2026-08-10" };
  const guestStreak = { currentStreak: 10, longestStreak: 10, lastActiveDate: "2026-08-01" };
  const result = mergeStreak(serverStreak, guestStreak);
  assert.equal(result.changed, false);
});

test("hasMigratableGuestState: a guest with no completions and no chosen starting level has nothing to migrate", () => {
  assert.equal(hasMigratableGuestState(emptyProgressState), false);
});

test("hasMigratableGuestState: any completion makes a guest worth migrating", () => {
  assert.equal(
    hasMigratableGuestState({
      ...emptyProgressState,
      completions: [
        { lessonId: "a", mode: "normal", completedAt: "2026-08-10T00:00:00.000Z", accuracy: 1 },
      ],
    }),
    true,
  );
});

test("hasMigratableGuestState: a chosen (non-null) starting level alone is worth migrating", () => {
  assert.equal(hasMigratableGuestState({ ...emptyProgressState, startingLevel: 2 }), true);
});

test("hasMigratableGuestState: a skipped starting level (0) still counts — 0 is a real choice, not 'never asked'", () => {
  assert.equal(hasMigratableGuestState({ ...emptyProgressState, startingLevel: 0 }), true);
});
