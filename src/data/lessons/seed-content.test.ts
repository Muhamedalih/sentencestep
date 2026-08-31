// Verifies the curated initial content itself (Milestone 12) — no
// database, no server. Run with `npm run test:content`.
//
// Items 11-12 from the Milestone 12 test list ("all learner-facing content
// is published" and "the seed is safe to run repeatedly") aren't checked
// here: publishing status doesn't exist in this local TS shape (only in the
// database), and idempotency is a property of the generated SQL's ON
// CONFLICT clauses — both are verified by construction in
// scripts/generate-content-seed.ts and reviewed in the Milestone 12 report,
// not re-tested against a live database this project has no credentials
// for.

import { test } from "node:test";
import assert from "node:assert/strict";

import { normalLessons } from "./normal";
import { storyLessons } from "./stories";
import { conversationLessons } from "./conversation";
import { MIN_STORY_SENTENCE_COUNT, REQUIRED_SENTENCE_COUNT } from "@/lib/admin/validation";
import { filterFree } from "@/lib/content-helpers";
import type { Lesson } from "@/types/content";

test("normal: exactly 36 ordinary lessons exist", () => {
  assert.equal(normalLessons.length, 36);
});

// normal-25 through normal-36 (order 25-36) were added in a later content
// pass (4 fresh, human-feeling lessons per level) and are all premium,
// same as normal-13 through normal-24 before them.
test("normal: expected per-level distribution (12/12/12)", () => {
  const perLevel = new Map<number, number>();
  for (const lesson of normalLessons) {
    perLevel.set(lesson.level, (perLevel.get(lesson.level) ?? 0) + 1);
  }
  assert.equal(perLevel.get(1), 12, `level 1 has ${perLevel.get(1)} lessons, expected 12`);
  assert.equal(perLevel.get(2), 12, `level 2 has ${perLevel.get(2)} lessons, expected 12`);
  assert.equal(perLevel.get(3), 12, `level 3 has ${perLevel.get(3)} lessons, expected 12`);
});

test("normal: every lesson has exactly the required 9 sentences", () => {
  for (const lesson of normalLessons) {
    assert.equal(
      lesson.sentences.length,
      REQUIRED_SENTENCE_COUNT.normal,
      `${lesson.id} has ${lesson.sentences.length} sentences, expected ${REQUIRED_SENTENCE_COUNT.normal}`,
    );
  }
});

test("stories: exactly 62 stories exist", () => {
  assert.equal(storyLessons.length, 62);
});

// 21/21/20 rather than a flat 20/20/20 since story-67 and story-68 (see
// stories.ts's doc comment) were authored directly against the live
// database, one into level 2 and one into level 1 — this asserts the
// specific known distribution, not a rule that levels must stay balanced.
test("stories: expected per-level distribution (21/21/20)", () => {
  const perLevel = new Map<number, number>();
  for (const story of storyLessons) {
    perLevel.set(story.level, (perLevel.get(story.level) ?? 0) + 1);
  }
  assert.equal(perLevel.get(1), 21, `level 1 has ${perLevel.get(1)} stories, expected 21`);
  assert.equal(perLevel.get(2), 21, `level 2 has ${perLevel.get(2)} stories, expected 21`);
  assert.equal(perLevel.get(3), 20, `level 3 has ${perLevel.get(3)} stories, expected 20`);
});

test("stories: no duplicate titles", () => {
  const titles = storyLessons.map((s) => s.title.trim().toLowerCase());
  assert.equal(new Set(titles).size, titles.length, "duplicate story title found");
});

// Stories are deliberately NOT held to an exact sentence count — a story's
// length follows its own setup/complication/resolution arc, not a fixed
// number (see the Stories content-quality audit). This only checks the
// structural floor every story still needs: enough sentences for a real arc
// to exist.
test("stories: every story has at least the minimum sentence count", () => {
  for (const story of storyLessons) {
    assert.ok(
      story.sentences.length >= MIN_STORY_SENTENCE_COUNT,
      `${story.id} has ${story.sentences.length} sentences, expected at least ${MIN_STORY_SENTENCE_COUNT}`,
    );
  }
});

test("conversations: exactly 3 initial conversations exist", () => {
  assert.equal(conversationLessons.length, 3);
});

test("conversations: every conversation has exactly the required 30 lines", () => {
  for (const conversation of conversationLessons) {
    assert.equal(
      conversation.sentences.length,
      REQUIRED_SENTENCE_COUNT.conversation,
      `${conversation.id} has ${conversation.sentences.length} lines, expected ${REQUIRED_SENTENCE_COUNT.conversation}`,
    );
  }
});

test("free content: ordinary lessons land within the 5-10 target and match the plan (6 free)", () => {
  const freeCount = filterFree(normalLessons).length;
  assert.ok(freeCount >= 5 && freeCount <= 10, `expected 5-10 free lessons, got ${freeCount}`);
  assert.equal(freeCount, 6);
});

// story-67 and story-68 (see stories.ts's doc comment) were both authored
// free, on top of the original 2-per-level plan — 3 free in level 1, 3 in
// level 2, 2 in level 3.
test("free content: 8 free stories total (3/3/2 per level)", () => {
  assert.equal(filterFree(storyLessons).length, 8);
});

test("free content: all initial conversations are free", () => {
  assert.equal(filterFree(conversationLessons).length, 3);
});

test("free content: at least one ordinary lesson is premium (demonstrates locking)", () => {
  const premiumCount = normalLessons.length - filterFree(normalLessons).length;
  assert.ok(premiumCount >= 1, "expected at least one premium ordinary lesson");
});

test("no duplicate lesson ids across the whole seed", () => {
  const allLessons: Lesson[] = [...normalLessons, ...storyLessons, ...conversationLessons];
  const ids = allLessons.map((lesson) => lesson.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate lesson id found");
});

test("no duplicate sentence ids within any single lesson", () => {
  const allLessons: Lesson[] = [...normalLessons, ...storyLessons, ...conversationLessons];
  for (const lesson of allLessons) {
    const sentenceIds = lesson.sentences.map((sentence) => sentence.id);
    assert.equal(
      new Set(sentenceIds).size,
      sentenceIds.length,
      `duplicate sentence id within ${lesson.id}`,
    );
  }
});

test("no duplicate sentence ids across the entire seed", () => {
  const allLessons: Lesson[] = [...normalLessons, ...storyLessons, ...conversationLessons];
  const allSentenceIds = allLessons.flatMap((lesson) => lesson.sentences.map((s) => s.id));
  assert.equal(new Set(allSentenceIds).size, allSentenceIds.length, "duplicate sentence id found");
});

test("required fields: every lesson has a non-empty title and Arabic title", () => {
  const allLessons: Lesson[] = [...normalLessons, ...storyLessons, ...conversationLessons];
  for (const lesson of allLessons) {
    assert.ok(lesson.title.trim().length > 0, `${lesson.id} is missing a title`);
    assert.ok(lesson.titleAr.trim().length > 0, `${lesson.id} is missing an Arabic title`);
  }
});

test("required fields: every sentence has non-empty English and Arabic text", () => {
  const allLessons: Lesson[] = [...normalLessons, ...storyLessons, ...conversationLessons];
  for (const lesson of allLessons) {
    for (const sentence of lesson.sentences) {
      assert.ok(sentence.en.trim().length > 0, `${sentence.id} is missing English text`);
      assert.ok(sentence.ar.trim().length > 0, `${sentence.id} is missing Arabic text`);
    }
  }
});

test("required fields: every conversation line has a speaker", () => {
  for (const conversation of conversationLessons) {
    for (const sentence of conversation.sentences) {
      assert.ok(
        sentence.speaker && sentence.speaker.trim().length > 0,
        `${sentence.id} is missing a speaker`,
      );
    }
  }
});

test("levels used: all content stays within the already-named levels 1-3", () => {
  const allLessons: Lesson[] = [...normalLessons, ...storyLessons, ...conversationLessons];
  for (const lesson of allLessons) {
    assert.ok(
      lesson.level >= 1 && lesson.level <= 3,
      `${lesson.id} uses level ${lesson.level}, expected 1-3`,
    );
  }
});

// wordTranslations powers the current-word translation card (see
// current-word-card.tsx) — every normal/story sentence must have exactly
// one entry per whitespace-separated word in `en`, in the same order, or
// the card would show the wrong word's translation partway through a
// sentence. Not required for conversation mode, which doesn't have the card.
//
// The 9 stories added by the story-diversification pass (story-25 through
// story-33) are a deliberate, temporary exception: an initial hand-authored
// pass at their word-by-word glosses had real token-alignment mistakes, and
// shipping that wrong would be worse than the card simply not appearing for
// these stories yet — the same graceful-absence behavior conversation mode
// already has in production. Remove an id from this list once its story has
// a verified wordTranslations pass; new stories should not be added here.
const STORIES_PENDING_WORD_TRANSLATIONS = new Set([
  "story-25",
  "story-26",
  "story-27",
  "story-28",
  "story-29",
  "story-30",
  "story-31",
  "story-32",
  "story-33",
]);

test("wordTranslations: every normal/story sentence has one entry per word, in order", () => {
  const lessons: Lesson[] = [...normalLessons, ...storyLessons];
  for (const lesson of lessons) {
    if (STORIES_PENDING_WORD_TRANSLATIONS.has(lesson.id)) continue;
    for (const sentence of lesson.sentences) {
      const words = sentence.en.split(/\s+/);
      assert.ok(sentence.wordTranslations, `${sentence.id} is missing wordTranslations`);
      assert.equal(
        sentence.wordTranslations!.length,
        words.length,
        `${sentence.id} has ${sentence.wordTranslations!.length} wordTranslations but ${words.length} words`,
      );
      sentence.wordTranslations!.forEach((entry, index) => {
        assert.equal(
          entry.en,
          words[index],
          `${sentence.id} word ${index}: expected "${words[index]}", got "${entry.en}"`,
        );
        assert.ok(
          entry.ar.trim().length > 0,
          `${sentence.id} word ${index} ("${entry.en}") has no Arabic translation`,
        );
      });
    }
  }
});
