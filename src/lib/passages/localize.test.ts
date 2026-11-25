import assert from "node:assert/strict";
import test from "node:test";

import { PASSAGE_SEEDS } from "@/data/passages";
import { PASSAGE_EXAMS } from "@/data/passages/exams";
import esTexts from "@/data/passages/i18n/es.json";
import trTexts from "@/data/passages/i18n/tr.json";
import esVideo from "@/data/videos/i18n/es.json";
import trVideo from "@/data/videos/i18n/tr.json";
import { videoLessons } from "@/data/videos";
import { localizeVideoLesson } from "@/lib/video-dictation/localize";

import { expectedTextCount, localizePassage } from "./localize";
import type { Passage } from "./types";

/** A runtime passage built from a seed, the way the database read assembles it. */
function passageFromSeed(seed: (typeof PASSAGE_SEEDS)[number]): Passage {
  const lines = seed.sections.flatMap((s) => s.lines);
  return {
    id: seed.slug,
    order: seed.order,
    level: seed.level,
    tone: seed.tone,
    icon: seed.icon,
    title: seed.title,
    titleAr: seed.titleAr,
    summary: seed.summary,
    summaryAr: seed.summaryAr,
    isFree: true,
    sectionCount: seed.sections.length,
    sentenceCount: lines.length,
    estimatedMinutes: 5,
    wordGroupId: null,
    posterUrl: null,
    backgroundUrl: null,
    status: "published",
    wordGroupStatus: null,
    sections: seed.sections.map((section, si) => {
      const questions = [
        section.question,
        ...(si === seed.sections.length - 1 ? [seed.closing] : []),
      ];
      return {
        id: `${seed.slug}-p${si + 1}`,
        order: si + 1,
        title: section.title,
        titleAr: section.titleAr,
        sentences: section.lines.map((line, li) => ({
          id: `${seed.slug}-p${si + 1}-s${li + 1}`,
          order: li + 1,
          speaker: line.who ?? null,
          en: line.en,
          ar: line.ar,
          audioUrl: null,
        })),
        questions: questions.map((q, qi) => ({
          id: `${seed.slug}-p${si + 1}-q${qi + 1}`,
          prompt: q.en,
          promptAr: q.ar,
          options: q.options,
          answer: q.answer,
          evidence: -1,
        })),
      };
    }),
    words: seed.words.map((w) => ({
      id: w.word,
      word: w.word,
      hintAr: w.hintAr,
      contextEn: null,
      contextAr: null,
      audioUrl: null,
    })),
  };
}

test("every passage has a Spanish and a Turkish list that fits it, with no Arabic left in it", () => {
  for (const [name, table] of [
    ["es", esTexts],
    ["tr", trTexts],
  ] as const) {
    for (const seed of PASSAGE_SEEDS) {
      const passage = passageFromSeed(seed);
      const rows = (table as Record<string, string[]>)[seed.slug];
      assert.ok(rows, `${name}: no list for ${seed.slug}`);
      assert.equal(
        rows.length,
        expectedTextCount(passage, PASSAGE_EXAMS[seed.slug]),
        `${name}: ${seed.slug}`,
      );
      for (const text of rows) {
        assert.ok(text.trim().length > 0, `${name}: empty text in ${seed.slug}`);
        assert.ok(!/[؀-ۿ]/.test(text), `${name}: Arabic in ${seed.slug}: ${text}`);
      }
    }
  }
});

test("localizePassage swaps the Arabic fields for Spanish and Turkish, and leaves Arabic alone", () => {
  const seed = PASSAGE_SEEDS[0]!;
  const passage = passageFromSeed(seed);
  const es = localizePassage(passage, PASSAGE_EXAMS[seed.slug], "es");
  assert.equal(es.available, true);
  assert.equal(es.passage.titleAr, (esTexts as Record<string, string[]>)[seed.slug]![0]);
  assert.ok(
    es.passage.sections[0]!.sentences.every((s) => s.ar && s.ar !== seed.sections[0]!.lines[0]!.ar),
  );
  const tr = localizePassage(passage, PASSAGE_EXAMS[seed.slug], "tr");
  assert.equal(tr.available, true);
  assert.notEqual(tr.passage.titleAr, es.passage.titleAr);
  const ar = localizePassage(passage, PASSAGE_EXAMS[seed.slug], "ar");
  assert.equal(ar.passage, passage);
  assert.equal(localizePassage(passage, PASSAGE_EXAMS[seed.slug], null).available, false);
});

test("a passage whose lines no longer fit the list is not half translated", () => {
  const passage = passageFromSeed(PASSAGE_SEEDS[0]!);
  passage.sections[0]!.sentences.pop();
  assert.equal(localizePassage(passage, undefined, "es").available, false);
});

test("every video sentence has a Spanish and a Turkish meaning, one per word", () => {
  for (const [name, table] of [
    ["es", esVideo],
    ["tr", trVideo],
  ] as const) {
    for (const lesson of videoLessons) {
      const localized = localizeVideoLesson(lesson, name);
      for (const [index, sentence] of lesson.sentences.entries()) {
        const row = (table as Record<string, string[]>)[sentence.id];
        assert.ok(row, `${name}: no entry for ${sentence.id}`);
        assert.equal(row.length, sentence.wordTranslations.length + 1, `${name}: ${sentence.id}`);
        assert.equal(localized.sentences[index]!.ar, row[0]);
        assert.ok(row.every((text) => text.trim() && !/[؀-ۿ]/.test(text)));
      }
    }
  }
  assert.equal(localizeVideoLesson(videoLessons[0]!, "ar"), videoLessons[0]);
});
