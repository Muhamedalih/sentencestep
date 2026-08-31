import { test } from "node:test";
import assert from "node:assert/strict";

import {
  auditCollectionDiversity,
  auditStory,
  extractCharacterNames,
  findDuplicateSentences,
} from "./stories-quality";
import type { Lesson } from "@/types/content";

function story(
  id: string,
  title: string,
  englishSentences: string[],
  level = 1,
): Pick<Lesson, "id" | "title" | "sentences" | "level"> {
  return {
    id,
    title,
    level,
    sentences: englishSentences.map((en, i) => ({ id: `${id}-s${i + 1}`, en, ar: "x" })),
  };
}

test("extractCharacterNames: finds mid-sentence proper nouns, ignores sentence-initial capitals", () => {
  const names = extractCharacterNames([
    { en: "Ali was late for school." },
    { en: "He found Sara in the kitchen." },
  ]);
  assert.ok(names.includes("Sara"));
  assert.ok(!names.includes("Ali"), "sentence-initial word shouldn't be extracted as a name");
  assert.ok(!names.includes("He"), "common pronoun should be excluded");
});

test("findDuplicateSentences: flags a repeated sentence, case-insensitively", () => {
  const dupes = findDuplicateSentences([
    { en: "He looked around." },
    { en: "She smiled." },
    { en: "he looked around." },
  ]);
  assert.equal(dupes.length, 1);
});

test("auditStory: flags a generic 'was happy' ending", () => {
  const audit = auditStory(
    story("s1", "Test", [
      "Ali walked into the room.",
      "He saw his friend waiting.",
      "They talked for a while.",
      "Ali was very happy.",
    ]),
  );
  assert.equal(audit.hasWeakEnding, true);
});

test("auditStory: does not flag a concrete, action-based ending", () => {
  const audit = auditStory(
    story("s1", "Test", [
      "Ali walked into the room.",
      "He saw his friend waiting.",
      "They talked for a while.",
      "Ali handed him the letter and left without a word.",
    ]),
  );
  assert.equal(audit.hasWeakEnding, false);
});

test("auditStory: flags a 'was ADJ because' telling construction", () => {
  const audit = auditStory(
    story("s1", "Test", [
      "Sara was nervous because the exam started in five minutes.",
      "She opened her book one last time.",
    ]),
  );
  assert.equal(audit.tellingSentences.length, 1);
});

test("auditCollectionDiversity: flags a name reused above the threshold", () => {
  const lessons = Array.from({ length: 5 }, (_, i) =>
    story(`s${i}`, `Story ${i}`, ["Something happened.", "Then Maya arrived to help."]),
  );
  const report = auditCollectionDiversity(lessons, { nameOveruseThreshold: 3 });
  assert.ok(report.overusedNames.some((n) => n.name === "Maya"));
});

test("auditCollectionDiversity: does not flag a name used once or twice", () => {
  const lessons = [
    story("s1", "Story 1", ["Something happened.", "Then Maya arrived."]),
    story("s2", "Story 2", ["Something else happened.", "Then Omar arrived."]),
  ];
  const report = auditCollectionDiversity(lessons, { nameOveruseThreshold: 3 });
  assert.equal(report.overusedNames.length, 0);
});

test("auditCollectionDiversity: flags a verbatim shared opening across stories", () => {
  const lessons = [
    story("s1", "Story 1", ["It was a quiet afternoon in the city.", "Then something changed."]),
    story("s2", "Story 2", ["It was a quiet morning by the sea.", "Then something changed."]),
  ];
  const report = auditCollectionDiversity(lessons);
  assert.ok(
    report.repeatedOpenings.some((o) => o.opening === "it was a" && o.lessonIds.length === 2),
  );
});
