import { test } from "node:test";
import assert from "node:assert/strict";

import { startingLevelFromOpeningLesson } from "./starting-level";

function done(lessonId: string, completedAt = "2026-10-20T10:00:00.000Z") {
  return { lessonId, completedAt };
}

test("startingLevelFromOpeningLesson: finishing the Intermediate opening lesson means Intermediate was chosen", () => {
  assert.equal(startingLevelFromOpeningLesson([done("onboarding-intermediate")]), 2);
});

test("startingLevelFromOpeningLesson: finishing the Advanced opening lesson means Advanced was chosen", () => {
  assert.equal(startingLevelFromOpeningLesson([done("normal-1"), done("onboarding-advanced")]), 3);
});

test("startingLevelFromOpeningLesson: the Beginner opening lesson says nothing, it is also a catalog card", () => {
  assert.equal(startingLevelFromOpeningLesson([done("onboarding-beginner")]), null);
});

test("startingLevelFromOpeningLesson: no opening lesson, or no completions, gives null", () => {
  assert.equal(startingLevelFromOpeningLesson([]), null);
  assert.equal(startingLevelFromOpeningLesson([done("normal-1"), done("story-81")]), null);
});

test("startingLevelFromOpeningLesson: with both finished, the one finished first is the choice", () => {
  const both = [
    done("onboarding-advanced", "2026-10-21T09:00:00.000Z"),
    done("onboarding-intermediate", "2026-10-20T09:00:00.000Z"),
  ];
  assert.equal(startingLevelFromOpeningLesson(both), 2);
});
