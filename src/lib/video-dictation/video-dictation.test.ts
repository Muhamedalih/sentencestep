import assert from "node:assert/strict";
import test from "node:test";

import { videoLessons } from "@/data/videos";
import { videoKinds } from "@/data/videos/kinds";

import {
  arrangeLessons,
  flattenSections,
  moveVideo,
  sameSections,
  sanitizeArrangement,
  shiftSection,
  shiftVideo,
} from "./arrange";
import type { VideoSection } from "./arrange";
import { arrangeVideoLessons, getVideoLessons, isTrialVideo, visibleVideoLessons } from "./content";
import { applyTimings, sanitizeTimings, timingsOf } from "./timings";
import {
  documentCookieHasVideoNewsSeen,
  isVideoNewsSeen,
  VIDEO_NEWS_COOKIE,
  videoNewsCookie,
} from "./news";
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
import { VIDEO_KINDS } from "./types";
import type { VideoKind, VideoLesson, VideoLevel } from "./types";
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

// ---- The library's arrangement: sections by kind (comedy first), and what an Admin saved ----

/** A bare video for the arrangement tests: only what arrangeLessons reads. */
function bare(id: string, level: VideoLevel, clipSeconds: number): VideoLesson {
  return {
    id,
    youtubeId: "aaaaaaaaaaa",
    title: id,
    channel: "channel",
    channelUrl: "https://www.youtube.com/@channel",
    level,
    durationSeconds: 100,
    clipStartSeconds: 0,
    clipEndSeconds: clipSeconds,
    textSource: "public-domain",
    sourceNote: "",
    sentences: [],
  };
}

const idsOf = (sections: readonly VideoSection[], kind: VideoKind): string[] =>
  sections.find((section) => section.kind === kind)?.ids ?? [];

test("arrange: with nothing saved the sections follow the default order, comedy first", () => {
  const sections = arrangeVideoLessons(videoLessons, null);
  assert.deepEqual(
    sections.map((section) => section.kind),
    [...VIDEO_KINDS],
  );
  assert.equal(sections[0]?.kind, "comedy");
  // Every video appears exactly once.
  const all = flattenSections(sections);
  assert.equal(all.length, videoLessons.length);
  assert.equal(new Set(all).size, videoLessons.length);
});

test("arrange: inside a section the easiest video comes first (level, then length)", () => {
  const rank = { A1: 0, A2: 1, B1: 2, B2: 3 } as const;
  const byId = new Map(videoLessons.map((lesson) => [lesson.id, lesson]));
  const length = (lesson: VideoLesson) => lesson.clipEndSeconds - lesson.clipStartSeconds;
  for (const section of arrangeVideoLessons(videoLessons, null)) {
    const lessons = section.ids.map((id) => byId.get(id) as VideoLesson);
    for (let index = 1; index < lessons.length; index += 1) {
      const before = lessons[index - 1] as VideoLesson;
      const after = lessons[index] as VideoLesson;
      assert.ok(
        rank[before.level] < rank[after.level] ||
          (rank[before.level] === rank[after.level] && length(before) <= length(after)),
        `${before.id} should not come before ${after.id} in ${section.kind}`,
      );
    }
  }
});

test("kinds: every entry names a real kind", () => {
  // An id that is not a prepared video is allowed on purpose: lessons are published one at a time, so
  // kinds.ts can list a video this branch does not have yet (the arrangement ignores ids it does not know).
  for (const [id, kind] of Object.entries(videoKinds)) {
    assert.ok((VIDEO_KINDS as readonly string[]).includes(kind), `${id}: unknown kind ${kind}`);
  }
});

test("arrange: a video with no entry in the kinds lands in the other section", () => {
  const lessons = [bare("a", "A2", 30), bare("b", "B1", 40)];
  const sections = arrangeLessons(lessons, { a: "comedy" }, null);
  assert.deepEqual(idsOf(sections, "comedy"), ["a"]);
  assert.deepEqual(idsOf(sections, "other"), ["b"]);
});

test("arrange: a saved arrangement sets the order of the sections and of the videos", () => {
  const lessons = [
    bare("a", "A2", 30),
    bare("b", "B1", 40),
    bare("c", "B1", 20),
    bare("d", "B2", 50),
  ];
  const kinds = { a: "comedy", b: "comedy", c: "animals", d: "animals" } as const;
  const sections = arrangeLessons(lessons, kinds, {
    sections: [
      { kind: "animals", ids: ["d", "c", "a"] },
      { kind: "comedy", ids: ["b"] },
    ],
  });
  // The saved sections come first in the saved order, the other kinds follow in the default order.
  assert.deepEqual(
    sections.map((section) => section.kind),
    ["animals", "comedy", "english", "science", "motivation", "other"],
  );
  assert.deepEqual(idsOf(sections, "animals"), ["d", "c", "a"]);
  assert.deepEqual(idsOf(sections, "comedy"), ["b"]);
});

test("arrange: a video the saved arrangement does not mention goes to the end of its own section", () => {
  const lessons = [
    bare("old", "B1", 30),
    bare("fresh-easy", "A2", 10),
    bare("fresh-hard", "B2", 10),
  ];
  const kinds = { old: "comedy", "fresh-easy": "comedy", "fresh-hard": "comedy" } as const;
  const sections = arrangeLessons(lessons, kinds, {
    sections: [{ kind: "comedy", ids: ["old"] }],
  });
  assert.deepEqual(idsOf(sections, "comedy"), ["old", "fresh-easy", "fresh-hard"]);
});

test("arrange: a saved id this viewer cannot open, an unknown id and a repeated id are skipped", () => {
  const lessons = [bare("a", "A2", 30), bare("b", "B1", 30)];
  const sections = arrangeLessons(
    lessons,
    {},
    {
      sections: [
        { kind: "comedy", ids: ["hidden-trial", "b", "b"] },
        { kind: "animals", ids: ["b", "a"] },
      ],
    },
  );
  assert.deepEqual(idsOf(sections, "comedy"), ["b"]);
  assert.deepEqual(idsOf(sections, "animals"), ["a"]);
});

test("arrange: an empty saved section keeps its place", () => {
  const lessons = [bare("a", "A2", 30)];
  const sections = arrangeLessons(
    lessons,
    { a: "comedy" },
    {
      sections: [
        { kind: "science", ids: [] },
        { kind: "comedy", ids: ["a"] },
      ],
    },
  );
  assert.deepEqual(
    sections.slice(0, 2).map((section) => section.kind),
    ["science", "comedy"],
  );
});

test("arrange: the next video follows the sections, then the next section", () => {
  const sections: VideoSection[] = [
    { kind: "comedy", ids: ["x", "y"] },
    { kind: "english", ids: [] },
    { kind: "animals", ids: ["z"] },
  ];
  assert.deepEqual(flattenSections(sections), ["x", "y", "z"]);
});

test("arrange: what a browser sends is checked, and what is wrong is refused whole", () => {
  const known = new Set(["a", "b", "c"]);
  assert.deepEqual(
    sanitizeArrangement({ sections: [{ kind: "comedy", ids: ["a", "gone", "b", "a"] }] }, known),
    { sections: [{ kind: "comedy", ids: ["a", "b"] }] },
  );
  // A video listed in two sections stays in the first.
  assert.deepEqual(
    sanitizeArrangement(
      {
        sections: [
          { kind: "comedy", ids: ["a"] },
          { kind: "animals", ids: ["a", "c"] },
        ],
      },
      known,
    ),
    {
      sections: [
        { kind: "comedy", ids: ["a"] },
        { kind: "animals", ids: ["c"] },
      ],
    },
  );
  for (const bad of [
    null,
    "comedy",
    {},
    { sections: "comedy" },
    { sections: [null] },
    { sections: [{ kind: "nonsense", ids: [] }] },
    { sections: [{ kind: "comedy", ids: "a" }] },
    { sections: [{ kind: "comedy", ids: [1] }] },
    // The same kind twice.
    {
      sections: [
        { kind: "comedy", ids: [] },
        { kind: "comedy", ids: [] },
      ],
    },
    // More sections than there are kinds.
    { sections: [...VIDEO_KINDS, "comedy"].map((kind) => ({ kind, ids: [] })) },
    // An absurd list of ids.
    { sections: [{ kind: "comedy", ids: Array.from({ length: 1001 }, () => "a") }] },
  ]) {
    assert.equal(sanitizeArrangement(bad, known), null, JSON.stringify(bad).slice(0, 80));
  }
});

test("arrange: moving a video changes only that video's place", () => {
  const start: VideoSection[] = [
    { kind: "comedy", ids: ["a", "b", "c"] },
    { kind: "animals", ids: ["d", "e"] },
  ];
  // To another section, at a place among ITS videos, and to the end.
  assert.deepEqual(moveVideo(start, "a", "animals", 1), [
    { kind: "comedy", ids: ["b", "c"] },
    { kind: "animals", ids: ["d", "a", "e"] },
  ]);
  assert.deepEqual(moveVideo(start, "a", "animals"), [
    { kind: "comedy", ids: ["b", "c"] },
    { kind: "animals", ids: ["d", "e", "a"] },
  ]);
  // Inside its own section the place counts the OTHER videos: a to the end, c to the front.
  assert.deepEqual(moveVideo(start, "a", "comedy", 2)[0]?.ids, ["b", "c", "a"]);
  assert.deepEqual(moveVideo(start, "c", "comedy", 0)[0]?.ids, ["c", "a", "b"]);
  // A place past the end is the end; a kind that is not there changes nothing; the input is never touched.
  assert.deepEqual(moveVideo(start, "d", "comedy", 99)[0]?.ids, ["a", "b", "c", "d"]);
  assert.deepEqual(moveVideo(start, "d", "other"), start);
  assert.deepEqual(start[0]?.ids, ["a", "b", "c"]);
});

test("arrange: the arrows move a video or a section one step, and stop at the ends", () => {
  const start: VideoSection[] = [
    { kind: "comedy", ids: ["a", "b", "c"] },
    { kind: "animals", ids: ["d"] },
  ];
  assert.deepEqual(shiftVideo(start, "b", -1)[0]?.ids, ["b", "a", "c"]);
  assert.deepEqual(shiftVideo(start, "b", 1)[0]?.ids, ["a", "c", "b"]);
  assert.deepEqual(shiftVideo(start, "a", -1), start);
  assert.deepEqual(shiftVideo(start, "c", 1), start);
  assert.deepEqual(shiftVideo(start, "d", 1), start);
  assert.deepEqual(
    shiftSection(start, "animals", -1).map((section) => section.kind),
    ["animals", "comedy"],
  );
  assert.deepEqual(shiftSection(start, "comedy", -1), start);
  assert.deepEqual(shiftSection(start, "animals", 1), start);
});

test("arrange: two lists of sections are the same arrangement only when nothing differs", () => {
  const a: VideoSection[] = [{ kind: "comedy", ids: ["x", "y"] }];
  assert.equal(sameSections(a, [{ kind: "comedy", ids: ["x", "y"] }]), true);
  assert.equal(sameSections(a, [{ kind: "comedy", ids: ["y", "x"] }]), false);
  assert.equal(sameSections(a, [{ kind: "animals", ids: ["x", "y"] }]), false);
});

test("news: the «جديد» line is remembered by one cookie of a year, read back from document.cookie, Secure only on https", () => {
  assert.equal(VIDEO_NEWS_COOKIE, "ss_video_news");
  assert.equal(isVideoNewsSeen("1"), true);
  for (const other of [undefined, null, "", "0", "true"]) {
    assert.equal(isVideoNewsSeen(other), false, String(other));
  }

  const plain = videoNewsCookie(false);
  assert.match(plain, /^ss_video_news=1; /);
  assert.match(plain, /Max-Age=31536000/);
  assert.match(plain, /Path=\//);
  assert.match(plain, /SameSite=Lax/);
  assert.equal(/Secure/.test(plain), false);
  assert.match(videoNewsCookie(true), /; Secure$/);

  assert.equal(documentCookieHasVideoNewsSeen("a=1; ss_video_news=1; b=2"), true);
  assert.equal(documentCookieHasVideoNewsSeen("ss_video_news=1"), true);
  assert.equal(documentCookieHasVideoNewsSeen("xss_video_news=1; ss_video_news=0"), false);
  assert.equal(documentCookieHasVideoNewsSeen(""), false);
});

test("timings: what an Admin moved by hand replaces the file's times, and a bad row changes nothing", () => {
  const lesson = videoLessons[0]!;
  const same = timingsOf(lesson.sentences);
  assert.deepEqual(sanitizeTimings(same, lesson), same);

  const moved = same.map((timing, at) =>
    at === 0 ? { ...timing, endSeconds: timing.endSeconds + 0.126 } : timing,
  );
  const applied = applyTimings(lesson, moved);
  assert.equal(
    applied.sentences[0]!.endSeconds,
    Math.round((same[0]!.endSeconds + 0.126) * 100) / 100,
  );
  assert.equal(applied.sentences[0]!.en, lesson.sentences[0]!.en);

  // Nothing saved, a different video's row, a shorter list, a sentence under 0.3 s, stops out of order.
  assert.equal(applyTimings(lesson, null), lesson);
  assert.equal(applyTimings(lesson, same.slice(1)), lesson);
  assert.equal(
    applyTimings(
      lesson,
      same.map((t) => ({ ...t, id: "other" })),
    ),
    lesson,
  );
  assert.equal(
    applyTimings(
      lesson,
      same.map((t, at) => (at === 0 ? { ...t, endSeconds: t.startSeconds + 0.1 } : t)),
    ),
    lesson,
  );
  if (same.length > 1)
    assert.equal(
      applyTimings(
        lesson,
        same.map((t, at) => (at === 1 ? { ...t, endSeconds: same[0]!.endSeconds } : t)),
      ),
      lesson,
    );
});
