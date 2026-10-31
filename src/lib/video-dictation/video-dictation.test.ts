import assert from "node:assert/strict";
import test from "node:test";

import { videoLessons } from "@/data/videos";

import { getVideoLessons, isTrialVideo, visibleVideoLessons } from "./content";
import {
  isSameVideo,
  MAX_LEAD_SECONDS,
  nextLead,
  nextRate,
  replayPosition,
  segmentTick,
  START_LEAD_SECONDS,
} from "./segments";
import {
  cuesToSentences,
  parseTimestamp,
  parseTranscript,
  splitSentences,
} from "./transcript-import";
import type { VideoLesson } from "./types";
import { validateVideoLesson } from "./validate";
import { bareWord, splitWords } from "./words";

test("words: split on whitespace and match a word without its punctuation", () => {
  assert.deepEqual(splitWords("  Could I have a glass of water,  please? "), [
    "Could",
    "I",
    "have",
    "a",
    "glass",
    "of",
    "water,",
    "please?",
  ]);
  assert.equal(bareWord("water,"), "water");
  assert.equal(bareWord("“Hello!”"), "hello");
  assert.equal(bareWord("don’t"), "don't");
});

test("parseTimestamp reads the formats YouTube and subtitle files use", () => {
  assert.equal(parseTimestamp("0:03"), 3);
  assert.equal(parseTimestamp("1:05"), 65);
  assert.equal(parseTimestamp("1:02:03"), 3723);
  assert.equal(parseTimestamp("0:03.5"), 3.5);
  assert.equal(parseTimestamp("00:00:03,250"), 3.25);
  assert.equal(parseTimestamp("1:75"), null);
  assert.equal(parseTimestamp("abc"), null);
});

test("parseTranscript: a time on its own line, then the text", () => {
  const cues = parseTranscript(
    [
      "Transcript",
      "0:00",
      "[Music]",
      "0:03",
      "Welcome to the show.",
      "0:07",
      "Today we",
      "learn an idiom.",
    ].join("\r\n"),
  );
  assert.deepEqual(cues, [
    { startSeconds: 3, endSeconds: 7, text: "Welcome to the show." },
    { startSeconds: 7, endSeconds: null, text: "Today we learn an idiom." },
  ]);
});

test("parseTranscript: a time and the text on one line, in any order", () => {
  const cues = parseTranscript("0:05 second cue\n0:01 first cue\n");
  assert.deepEqual(
    cues.map((cue) => [cue.startSeconds, cue.endSeconds, cue.text]),
    [
      [1, 5, "first cue"],
      [5, null, "second cue"],
    ],
  );
});

test("parseTranscript: a .vtt file keeps its own end times and drops tags", () => {
  const vtt = [
    "WEBVTT",
    "",
    "00:00:01.000 --> 00:00:03.500",
    "<c>Hello</c> there.",
    "",
    "00:00:04.000 --> 00:00:06.000",
    "How are you?",
  ].join("\n");
  assert.deepEqual(parseTranscript(vtt), [
    { startSeconds: 1, endSeconds: 3.5, text: "Hello there." },
    { startSeconds: 4, endSeconds: 6, text: "How are you?" },
  ]);
});

test("splitSentences: leaves numbers, abbreviations and quotes alone", () => {
  assert.deepEqual(
    splitSentences("Hello there. How are you? I am fine!").map((span) => span.text),
    ["Hello there.", "How are you?", "I am fine!"],
  );
  assert.deepEqual(
    splitSentences("Mr. Smith paid 3.5 dollars. Then he left.").map((span) => span.text),
    ["Mr. Smith paid 3.5 dollars.", "Then he left."],
  );
  assert.deepEqual(
    splitSentences('He said "stop." Then he ran.').map((span) => span.text),
    ['He said "stop."', "Then he ran."],
  );
  assert.deepEqual(
    splitSentences("No ending here").map((span) => span.text),
    ["No ending here"],
  );
});

test("cuesToSentences: merges cues into sentences, spreads time inside a cue and keeps to the clip", () => {
  const cues = parseTranscript(
    [
      "0:02",
      "Welcome to English in a Minute.",
      "0:06",
      "Today we learn",
      "0:09",
      "an idiom. It is easy!",
      "0:14",
      "Ready?",
    ].join("\n"),
  );
  const sentences = cuesToSentences(cues, {
    clipStartSeconds: 0,
    clipEndSeconds: 16,
    idPrefix: "demo",
  });
  assert.deepEqual(
    sentences.map((sentence) => sentence.en),
    ["Welcome to English in a Minute.", "Today we learn an idiom.", "It is easy!", "Ready?"],
  );
  assert.equal(sentences[0]?.id, "demo-s1");
  assert.equal(sentences[0]?.startSeconds, 2);
  // "Today we learn an idiom." runs from the start of its cue to part-way through the next one.
  assert.equal(sentences[1]?.startSeconds, 6);
  const middle = sentences[1]?.endSeconds ?? 0;
  assert.ok(middle > 9 && middle < 14, `the sentence ends inside the third cue (${middle})`);
  for (let i = 1; i < sentences.length; i++) {
    assert.ok(
      (sentences[i]?.startSeconds ?? 0) >= (sentences[i - 1]?.endSeconds ?? 0),
      "sentences never overlap",
    );
  }

  const clipped = cuesToSentences(cues, {
    clipStartSeconds: 6,
    clipEndSeconds: 12,
    idPrefix: "demo",
  });
  assert.ok(clipped.length > 0);
  for (const sentence of clipped) {
    assert.ok(
      sentence.startSeconds >= 6 && sentence.endSeconds <= 12,
      "every sentence is inside the clip",
    );
  }
});

test("segmentTick: a stale read right after a seek never stops the sentence", () => {
  let sawBefore = false;
  // The playhead still says 9.0 for a moment after a seek back to 4.2; the sentence ends at 6.0.
  let tick = segmentTick(sawBefore, 9.0, 6.0);
  assert.equal(tick.stop, false);
  sawBefore = tick.sawBefore;
  tick = segmentTick(sawBefore, 4.2, 6.0);
  assert.equal(tick.stop, false);
  sawBefore = tick.sawBefore;
  tick = segmentTick(sawBefore, 5.95, 6.0);
  assert.equal(tick.stop, false);
  tick = segmentTick(tick.sawBefore, 6.02, 6.0);
  assert.equal(tick.stop, true);
});

test("replay, slow button and the ad check", () => {
  assert.equal(replayPosition(10), 9.8);
  assert.equal(replayPosition(0.1), 0);
  assert.equal(nextRate(1), 0.75);
  assert.equal(nextRate(0.75), 0.5);
  assert.equal(nextRate(0.5), 1);
  assert.equal(nextRate(2), 1);
  assert.equal(isSameVideo(60, 60), true);
  assert.equal(isSameVideo(59.2, 60), true);
  assert.equal(isSameVideo(15, 60), false);
  assert.equal(isSameVideo(0, 60), false);
  assert.equal(isSameVideo(Number.NaN, 60), false);
});

test("nextLead: a late stop asks for an earlier one, an early stop for a later one, and it settles", () => {
  // A device that always stops 0.12 s after the time it is asked for.
  let lead = START_LEAD_SECONDS;
  for (let i = 0; i < 12; i++) {
    const stoppedAt = 10 - lead + 0.12;
    lead = nextLead(lead, stoppedAt, 10);
  }
  assert.ok(Math.abs(lead - 0.12) < 0.005, `settled at ${lead}`);
  // A stop that came 0.1 s early gives the lead back.
  assert.ok(nextLead(0.12, 9.9, 10) < 0.12);
  // Never negative, never more than the cap.
  assert.equal(nextLead(0, 9.5, 10), 0);
  assert.equal(nextLead(0.2, 10.6, 10), MAX_LEAD_SECONDS);
  assert.equal(nextLead(0.24, 10.9, 10), MAX_LEAD_SECONDS);
  // A reading far from the end (an ad, a seek) changes nothing.
  assert.equal(nextLead(0.1, 14, 10), 0.1);
  assert.equal(nextLead(0.1, Number.NaN, 10), 0.1);
});

const sample: VideoLesson = {
  id: "sample",
  youtubeId: "DLi2txV9IVc",
  title: "Sample",
  channel: "Sample channel",
  channelUrl: "https://www.youtube.com/@sample",
  level: "A2",
  durationSeconds: 60,
  clipStartSeconds: 0,
  clipEndSeconds: 60,
  textSource: "public-domain",
  sourceNote: "test",
  sentences: [
    {
      id: "sample-s1",
      startSeconds: 2,
      endSeconds: 5,
      en: "Hello, my friend.",
      ar: "مرحباً يا صديقي.",
      wordTranslations: [
        { en: "Hello", ar: "مرحباً" },
        { en: "my", ar: "يا" },
        { en: "friend", ar: "صديقي" },
      ],
    },
    {
      id: "sample-s2",
      startSeconds: 5,
      endSeconds: 8,
      en: "How are you?",
      ar: "كيف حالك؟",
      wordTranslations: [
        { en: "How", ar: "كيف" },
        { en: "are", ar: "حالك" },
        { en: "you", ar: "أنت" },
      ],
    },
  ],
};

test("validateVideoLesson accepts a sound video", () => {
  assert.deepEqual(validateVideoLesson(sample), []);
});

test("validateVideoLesson catches shifted meanings, overlaps and a clip that runs past the video", () => {
  const shifted: VideoLesson = {
    ...sample,
    sentences: [
      {
        ...sample.sentences[0]!,
        wordTranslations: [
          { en: "my", ar: "يا" },
          { en: "Hello", ar: "مرحباً" },
          { en: "friend", ar: "صديقي" },
        ],
      },
      { ...sample.sentences[1]!, startSeconds: 4 },
    ],
    clipEndSeconds: 70,
  };
  const problems = validateVideoLesson(shifted);
  assert.ok(problems.some((p) => p.includes("meaning 1 is for")));
  assert.ok(problems.some((p) => p.includes("overlaps")));
  assert.ok(problems.some((p) => p.includes("runs past the video")));

  const missing: VideoLesson = {
    ...sample,
    sentences: [{ ...sample.sentences[0]!, wordTranslations: [{ en: "Hello", ar: "مرحباً" }] }],
  };
  assert.ok(validateVideoLesson(missing).some((p) => p.includes("1 meanings for 3 words")));
});

test("every video listed in src/data/videos is sound", () => {
  const ids = new Set<string>();
  for (const lesson of videoLessons) {
    assert.deepEqual(validateVideoLesson(lesson), [], lesson.id);
    assert.equal(ids.has(lesson.id), false, `${lesson.id} is listed twice`);
    ids.add(lesson.id);
  }
});

test("a trial video (a creator's text with no permission) is hidden from everyone but an Admin", () => {
  assert.equal(visibleVideoLessons(true).length, getVideoLessons().length);
  assert.equal(visibleVideoLessons(false).some(isTrialVideo), false);
  assert.equal(
    visibleVideoLessons(false).length,
    getVideoLessons().filter((lesson) => !isTrialVideo(lesson)).length,
  );
});
