import { test } from "node:test";
import assert from "node:assert/strict";

import { deriveChapterStates, isSectionUnlocked } from "./chapter-state";
import type { BookSection } from "@/types/library";

function section(id: string, orderIndex: number): BookSection {
  return { id, bookId: "book-1", orderIndex, title: `Section ${orderIndex}`, description: null };
}

// A 20-section book, to match the spec's own worked example.
const twenty = Array.from({ length: 20 }, (_, i) => section(`s${i + 1}`, i));

test("a never-started book: only the first section is available, every other section is locked", () => {
  const states = deriveChapterStates(twenty, { currentSectionId: "s1", isComplete: false });
  assert.equal(states[0]!.state, "available");
  assert.ok(states.slice(1).every((entry) => entry.state === "locked"));
});

test("completing section 1 unlocks section 2, section 3+ stay locked", () => {
  const states = deriveChapterStates(twenty, { currentSectionId: "s2", isComplete: false });
  assert.equal(states[0]!.state, "completed");
  assert.equal(states[1]!.state, "available");
  assert.ok(states.slice(2).every((entry) => entry.state === "locked"));
});

test("completing section 2 unlocks section 3, previously completed sections stay accessible", () => {
  const states = deriveChapterStates(twenty, { currentSectionId: "s3", isComplete: false });
  assert.equal(states[0]!.state, "completed");
  assert.equal(states[1]!.state, "completed");
  assert.equal(states[2]!.state, "available");
  assert.ok(states.slice(3).every((entry) => entry.state === "locked"));
});

test("a fully completed book: every section is completed, regardless of currentSectionId", () => {
  const states = deriveChapterStates(twenty, { currentSectionId: null, isComplete: true });
  assert.ok(states.every((entry) => entry.state === "completed"));
});

test("the rule holds generically for a 5-section book, not just 20", () => {
  const five = Array.from({ length: 5 }, (_, i) => section(`f${i + 1}`, i));
  const states = deriveChapterStates(five, { currentSectionId: "f4", isComplete: false });
  assert.deepEqual(
    states.map((entry) => entry.state),
    ["completed", "completed", "completed", "available", "locked"],
  );
});

test("a stale currentSectionId (pointing at a deleted section) fails closed: only the first section is available", () => {
  const states = deriveChapterStates(twenty, {
    currentSectionId: "does-not-exist",
    isComplete: false,
  });
  assert.equal(states[0]!.state, "available");
  assert.ok(states.slice(1).every((entry) => entry.state === "locked"));
});

test("isSectionUnlocked: locked sections are rejected, completed and available sections are allowed", () => {
  const progress = { currentSectionId: "s3", isComplete: false };
  assert.equal(isSectionUnlocked(twenty, progress, "s1"), true); // completed
  assert.equal(isSectionUnlocked(twenty, progress, "s3"), true); // available
  assert.equal(isSectionUnlocked(twenty, progress, "s4"), false); // locked
  assert.equal(isSectionUnlocked(twenty, progress, "s20"), false); // locked
});

test("isSectionUnlocked: an unknown section id is never unlocked", () => {
  const progress = { currentSectionId: "s3", isComplete: false };
  assert.equal(isSectionUnlocked(twenty, progress, "not-a-real-section"), false);
});
