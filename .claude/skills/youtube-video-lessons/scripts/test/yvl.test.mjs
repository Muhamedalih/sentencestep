/**
 * Unit tests of the skill's pure functions: node --test .claude/skills/youtube-video-lessons/scripts/test
 * No network, no browser, no repo needed.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { bareWord, normalizeLesson, slugify, youtubeIdFrom } from "../lib/util.mjs";
import { spellNumbers } from "../lib/numbers.mjs";
import {
  attachLonePunct,
  capsToCues,
  mergeContinuations,
  normalizeText,
  repairCueEnds,
  splitLong,
  typingProblems,
} from "../lib/text.mjs";
import { assignBoundaries, gapsOf, otsu, placeStops, surroundings, voicedIntervals } from "../lib/envelope.mjs";
import { checkPairs, parseAuthoring } from "../cmd/fill.mjs";
import { checkLesson, diffWords } from "../cmd/check.mjs";

test("youtubeIdFrom reads links and bare ids", () => {
  const id = "msnOHuPep9I";
  assert.equal(youtubeIdFrom(id), id);
  assert.equal(youtubeIdFrom(`https://www.youtube.com/watch?v=${id}&t=5`), id);
  assert.equal(youtubeIdFrom(`https://youtu.be/${id}?si=x`), id);
  assert.equal(youtubeIdFrom(`https://www.youtube.com/shorts/${id}`), id);
  assert.equal(youtubeIdFrom(`https://www.youtube-nocookie.com/embed/${id}`), id);
  assert.equal(youtubeIdFrom("https://example.com/watch?v=msnOHuPep9I"), null);
  assert.equal(youtubeIdFrom("not a link"), null);
});

test("slugify takes the part after the last colon", () => {
  assert.equal(slugify("NASA's Earth Minute: Sea Level Rise"), "sea-level-rise");
  assert.equal(slugify("On the Ball"), "on-the-ball");
});

test("numbers are written the way they are said", () => {
  const spell = (t) => spellNumbers(t).text;
  assert.equal(spell("more than 90% of the heat"), "more than ninety percent of the heat");
  assert.equal(spell("between 1 and 4 feet"), "between one and four feet");
  assert.equal(spell("nearly 5 million people"), "nearly five million people");
  assert.equal(spell("1,200 people"), "one thousand two hundred people");
  assert.equal(spell("it was 1.5 meters"), "it was one point five meters");
  assert.equal(spell("the 3rd time"), "the third time");
  assert.equal(spell("in 2026"), "in twenty twenty-six");
  assert.equal(spell("in 2005"), "in two thousand five");
  assert.equal(spell("in 1905"), "in nineteen oh five");
  assert.equal(spell("R2D2 is a robot"), "R2D2 is a robot");
});

test("normalizeText straightens quotes, removes sound tags and odd spaces", () => {
  assert.equal(normalizeText("It’s  “fine”… [Music] ♪"), 'It\'s "fine"...');
  assert.equal(normalizeText("a b"), "a b");
  assert.equal(attachLonePunct("wait — what"), "wait— what");
});

test("typingProblems finds what a US keyboard cannot type", () => {
  assert.deepEqual(typingProblems("A plain sentence, with punctuation!"), []);
  assert.ok(typingProblems("a café").some((p) => /cannot type/.test(p)));
  assert.ok(typingProblems("90% sure").some((p) => /digits/.test(p)));
});

test("caption cues: changes become cues, '...' continues, a missing period is added", () => {
  const caps = [
    [0, ""],
    [1, "NASA has observed the earth getting warmer..."],
    [4, "and the sea level getting higher."],
    [6, "What's the connection?"],
    [9, ""],
  ];
  const cues = capsToCues(caps);
  assert.equal(cues.length, 3);
  assert.equal(cues[2].endSeconds, 9);
  const merged = mergeContinuations(cues);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].text, "NASA has observed the earth getting warmer and the sea level getting higher.");
  const repaired = repairCueEnds([
    { startSeconds: 0, endSeconds: 3, text: "And the ocean takes in most of the heat from global warming" },
    { startSeconds: 3, endSeconds: 5, text: "That's a lot." },
  ]);
  assert.ok(repaired.cues[0].text.endsWith("warming."));
  assert.equal(repaired.notes.length, 1);
});

test("splitLong cuts at a comma or conjunction, never inside 'between one and four' or after 'is'", () => {
  const a = splitLong("Warmer temperatures also cause a lot of the ice to melt, and it ends up in the ocean.");
  assert.equal(a.length, 2);
  assert.equal(a[0].cut, "clause");
  const b = splitLong("A child born today can expect the ocean to rise between one and four feet in their lifetime.");
  assert.equal(b.length, 1);
  const c = splitLong("its salt water can mix with our rivers and ground water which is where many people get fresh water to drink.");
  assert.ok(c.every((p) => !/\bis$/.test(p.text)));
  assert.equal(splitLong("Short one.").length, 1);
});

/** Speech windows at 20 ms steps: loud inside, quiet outside. */
function envelope(windows, end, loud = 0.1, quiet = 0.001) {
  const samples = [];
  for (let t = 0; t <= end; t += 0.02) {
    const inside = windows.some(([s, e]) => t >= s && t <= e);
    samples.push([Math.round(t * 1000) / 1000, inside ? loud : quiet, inside ? loud : quiet]);
  }
  return samples;
}

test("voicedIntervals finds speech, merges a tiny dip and reports how clear the split is", () => {
  const samples = envelope([[0.5, 2.0], [2.06, 3.0], [4.0, 5.5]], 7);
  const v = voicedIntervals(samples);
  assert.equal(v.intervals.length, 2);
  assert.ok(Math.abs(v.intervals[0].s - 0.5) < 0.06 && Math.abs(v.intervals[0].e - 3.0) < 0.08);
  assert.ok(v.separability > 0.6);
  const o = otsu(samples.map((s) => 20 * Math.log10(s[2])));
  assert.ok(o.threshold > -60 && o.threshold < -20);
});

test("assignBoundaries puts boundaries in the real pauses, not the micro gaps", () => {
  // three sentences of about 1.5 s with micro gaps (0.12 s) inside them and real pauses (0.7 s, 0.5 s) between
  const windows = [[0.5, 1.2], [1.32, 2.0], [2.7, 3.4], [3.52, 4.2], [4.7, 5.4], [5.52, 6.2]];
  const v = voicedIntervals(envelope(windows, 7));
  const res = assignBoundaries([140, 140, 140], v.intervals, { minGap: 0.1 });
  assert.equal(res.chosen.length, 2);
  assert.ok(Math.abs(res.chosen[0].a - 2.0) < 0.1, `first boundary at ${res.chosen[0].a}`);
  assert.ok(Math.abs(res.chosen[1].a - 4.2) < 0.1, `second boundary at ${res.chosen[1].a}`);
});

test("assignBoundaries honours a caption window", () => {
  const windows = [[0.5, 1.2], [1.32, 2.0], [2.7, 3.4], [3.52, 4.2], [4.7, 5.4], [5.52, 6.2]];
  const v = voicedIntervals(envelope(windows, 7));
  const res = assignBoundaries([140, 140, 140], v.intervals, { minGap: 0.1, windows: [[2.5, 3.0], [4.5, 5.0]] });
  assert.ok(Math.abs(res.chosen[0].b - 2.7) < 0.1);
  assert.ok(Math.abs(res.chosen[1].b - 4.7) < 0.1);
});

test("placeStops: 0.30 s after the last sound, never nearer than 0.10 s to the next, flags a pause with no room", () => {
  const roomy = placeStops({ a: 10, b: 10.6, d: 0.6 });
  assert.ok(Math.abs(roomy.end - 10.3) < 1e-9 && Math.abs(roomy.start - 10.5) < 1e-9);
  const small = placeStops({ a: 10, b: 10.2, d: 0.2 });
  assert.ok(Math.abs(small.end - 10.1) < 1e-9 && small.tight && !small.noRoom);
  assert.ok(placeStops({ a: 10, b: 10.1, d: 0.1 }).noRoom);
});

test("surroundings says inside speech, and the distance to the nearest sounds", () => {
  const iv = [{ s: 1, e: 2 }, { s: 3, e: 4 }];
  assert.equal(surroundings(iv, 1.5).inside, true);
  const out = surroundings(iv, 2.4);
  assert.ok(Math.abs(out.sinceSound - 0.4) < 1e-9 && Math.abs(out.untilSound - 0.6) < 1e-9);
  assert.equal(gapsOf(iv)[0].d, 1);
});

test("authoring file: header, blocks, and the word=meaning pairs are checked against the sentence", () => {
  const parsed = parseAuthoring("level: B1\ntextSource: public-domain\n\n1\nar: مرحبا\ng: Hello=مرحبا|world.=عالم\n");
  assert.equal(parsed.header.level, "B1");
  assert.equal(parsed.blocks.get(1).ar, "مرحبا");
  assert.deepEqual(checkPairs("Hello world.", parsed.blocks.get(1).g), []);
  assert.ok(checkPairs("Hello big world.", parsed.blocks.get(1).g)[0].includes("2 meanings for 3 words"));
  assert.ok(checkPairs("Hello world.", "Hello=مرحبا|word=عالم")[0].includes("pair is for"));
  assert.ok(checkPairs("Hello world.", "Hello=مرحبا|world=")[0].includes("no meaning"));
});

test("diffWords reports replaced, lost and added words", () => {
  const a = "the ocean takes in more heat".split(" ");
  const b = "the sea takes in heat today".split(" ");
  const edits = diffWords(a, b);
  assert.ok(edits.some((e) => e.from === "ocean" && e.to === "sea"));
  assert.ok(edits.some((e) => e.from === "more" && !e.to));
  assert.ok(edits.some((e) => e.to === "today"));
});

function goodLesson() {
  return normalizeLesson({
    id: "demo-lesson",
    youtubeId: "msnOHuPep9I",
    title: "Demo",
    channel: "Some channel",
    channelUrl: "https://www.youtube.com/@some",
    level: "B1",
    durationSeconds: 60,
    clipStart: 0,
    clipEnd: 20,
    textSource: "public-domain",
    sourceNote: "Made by NASA; NASA content is generally not subject to copyright (https://www.nasa.gov/nasa-brand-center/images-and-media/).",
    sentences: [
      { start: 0.5, end: 3, en: "Hello big world.", ar: "مرحبا أيها العالم الكبير.", g: "Hello=مرحبا|big=كبير|world.=عالم" },
      { start: 3.4, end: 6, en: "How are you?", ar: "كيف حالك؟", g: "How=كيف|are=حالك|you?=أنت" },
    ],
  });
}

test("checkLesson passes a sound lesson and catches the usual mistakes", () => {
  const ok = checkLesson(goodLesson(), { others: [] });
  assert.deepEqual(ok.errors, []);

  const bad = goodLesson();
  bad.sentences[1].start = 2.5; // overlaps the sentence before
  bad.sentences[0].en = "Hello big café."; // a letter a US keyboard cannot type
  bad.sentences[0].pairs.pop(); // one meaning short
  bad.textSource = "";
  const r = checkLesson(bad, { others: [] });
  assert.ok(r.errors.some((e) => /overlaps the sentence before/.test(e)));
  assert.ok(r.errors.some((e) => /cannot type/.test(e)));
  assert.ok(r.errors.some((e) => /2 meanings for 3 words/.test(e)));
  assert.ok(r.errors.some((e) => /textSource/.test(e)));

  const dup = checkLesson(goodLesson(), { others: [{ file: "x.ts", lesson: { id: "other", youtubeId: "msnOHuPep9I" } }] });
  assert.ok(dup.errors.some((e) => /already lesson other/.test(e)));
});

test("checkLesson compares the stops with the recorded speech", () => {
  const lesson = goodLesson();
  // speech 0.6-1.8 (4 syllables) and 3.5-4.5 (3 syllables): both stops (3.0 and 6.0) sit in silence
  const clean = checkLesson(lesson, { others: [], intervals: [{ s: 0.6, e: 1.8 }, { s: 3.5, e: 4.5 }] });
  assert.deepEqual(clean.errors, []);
  // speech runs through the first stop: the stop is inside a word
  const cut = checkLesson(lesson, { others: [], intervals: [{ s: 0.6, e: 3.2 }, { s: 3.5, e: 4.5 }] });
  assert.ok(cut.errors.some((e) => /INSIDE speech/.test(e)));
  // the next sound begins right after the stop: a leak
  const leak = checkLesson(lesson, { others: [], intervals: [{ s: 0.6, e: 1.8 }, { s: 3.01, e: 4.5 }] });
  assert.ok(leak.errors.some((e) => /next sentence begin/.test(e)));
  // speech between two sentences that no sentence contains
  const hole = checkLesson(lesson, { others: [], intervals: [{ s: 0.6, e: 1.8 }, { s: 3.04, e: 3.38 }, { s: 3.45, e: 4.5 }] });
  assert.ok(hole.errors.length + hole.warns.length > 0);
  // far too much speech for the words (a sentence of 4 syllables over 2.4 s of speech)
  const tooMuch = checkLesson(lesson, { others: [], intervals: [{ s: 0.5, e: 2.9 }, { s: 3.5, e: 4.5 }] });
  assert.ok(tooMuch.errors.some((e) => e.includes("syllables/s")));
});

test("bareWord matches a word and its meaning key the way the repo does", () => {
  assert.equal(bareWord("world."), "world");
  assert.equal(bareWord("It’s"), "it's");
  assert.equal(bareWord('"Hello,"'), "hello");
});
