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
import { assignBoundaries, atPictureEnd, gapsOf, lastStopLimit, otsu, pictureEnd, placeStops, surroundings, voicedIntervals } from "../lib/envelope.mjs";
import {
  anchorsHint,
  groupByRuns,
  isWordByWord,
  joinByRate,
  layoutGroups,
  ownRuns,
  planAnchored,
  refused,
  sentenceSpans,
  whereIn,
  wordOnsets,
} from "../lib/anchors.mjs";
import { checkPairs, parseAuthoring } from "../cmd/fill.mjs";
import { checkLesson, diffWords } from "../cmd/check.mjs";
import { stopFlags } from "../cmd/verify.mjs";

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

test("checkLesson --update does not count the lesson being rebuilt as another lesson with the same video", () => {
  const own = { file: "demo-lesson.ts", lesson: { id: "demo-lesson", youtubeId: "msnOHuPep9I" } };
  const refused = checkLesson(goodLesson(), { others: [own] });
  assert.ok(refused.errors.some((e) => /already used by demo-lesson\.ts/.test(e)));
  assert.deepEqual(checkLesson(goodLesson(), { others: [own], update: true }).errors, []);
  // another lesson with the same video is still refused when updating
  const other = { file: "x.ts", lesson: { id: "other", youtubeId: "msnOHuPep9I" } };
  assert.ok(checkLesson(goodLesson(), { others: [own, other], update: true }).errors.some((e) => /already lesson other/.test(e)));
});

test("pictureEnd is where a capture that ran to the end stopped; atPictureEnd takes a stop near or past it as the end of the video", () => {
  const ran = { details: { duration: 43 }, to: null, samples: [[0, 0, 0], [30, 0.1, 0.1], [42.541, 0, 0]] };
  assert.equal(pictureEnd(ran), 42.54);
  assert.equal(pictureEnd({ ...ran, to: 80 }), Infinity); // cut short on purpose
  assert.equal(pictureEnd({ ...ran, samples: [[0, 0, 0], [30, 0.1, 0.1]] }), Infinity); // stopped long before the reported length
  assert.equal(pictureEnd({ ...ran, samples: [[0, 0, 0], [40, 0, 0]] }), Infinity); // 3 s short: a time limit, not the end
  assert.equal(pictureEnd({ ...ran, samples: [[0, 0, 0], [43.2, 0, 0]] }), Infinity); // the picture is not shorter than reported
  assert.equal(pictureEnd({ samples: ran.samples, to: null }), Infinity); // no reported length
  assert.equal(atPictureEnd(42.86, 42.54), true);
  assert.equal(atPictureEnd(42.44, 42.54), true); // the last stop plan asks for (0.10 s before the last frame)
  assert.equal(atPictureEnd(42.3, 42.54), false);
  assert.equal(lastStopLimit(42.54), 42.44);
  assert.equal(lastStopLimit(Infinity), Infinity);
  assert.equal(atPictureEnd(42.86, Infinity), false);
});

test("checkLesson takes a last stop at the end of the picture as the end of the video, not as a cut", () => {
  const lesson = goodLesson(); // sentences 0.5-3 and 3.4-6
  const toTheEnd = [{ s: 0.6, e: 1.8 }, { s: 5, e: 6.02 }]; // the last speech runs to the last frame
  assert.ok(checkLesson(lesson, { others: [], intervals: toTheEnd }).errors.some((e) => /s2: the stop at 6 s is INSIDE speech/.test(e)));
  const atEnd = checkLesson(lesson, { others: [], intervals: toTheEnd, pictureEnd: 6.01 });
  assert.deepEqual(atEnd.errors, []);
  assert.ok(atEnd.infos.some((i) => /s2: the stop is the end of the video/.test(i)));
  // only the last stop is exempt
  lesson.sentences[0].end = 1;
  assert.ok(checkLesson(lesson, { others: [], intervals: toTheEnd, pictureEnd: 6.01 }).errors.some((e) => /s1: the stop at 1 s is INSIDE speech/.test(e)));
});

test("stopFlags: a stop that is the end of the video has no time to be late for, an end before the last sentence is an error", () => {
  const V = [{ s: 40, e: 42.56 }];
  const row = (changes) => ({ n: 9, end: 42.86, stoppedAt: 42.54, overshoot: -0.32, adSeen: false, resumeMs: null, resumeAdvance: null, resumeElapsed: null, ...changes });
  const hard = (r, ctx) => stopFlags(r, ctx).flags.filter((f) => /^(LATE|EARLY|CUT|LEAK|clipped|jumped|ENDED)/.test(f));
  // the player reached ENDED: no overshoot, no cut
  const ended = stopFlags(row({ ended: true }), { V, total: 9, videoEnd: 42.54 });
  assert.equal(ended.atEnd, true);
  assert.deepEqual(hard(row({ ended: true }), { V, total: 9, videoEnd: 42.54 }), []);
  assert.ok(ended.flags.some((f) => /^ends with the video/.test(f)));
  // the player's ENDED is the end of the video even when the capture says nothing about where the picture ends
  assert.equal(stopFlags(row({ ended: true }), { V, total: 9 }).atEnd, true);
  assert.deepEqual(hard(row({ ended: true }), { V, total: 9 }), []);
  // the same row with the video still playing and no known end is 0.32 s early inside speech
  const early = hard(row({}), { V, total: 9 });
  assert.ok(early.some((f) => /^EARLY/.test(f)) && early.some((f) => /^CUT/.test(f)));
  // a stop asked for at the end of the picture and polled normally is the end of the video too
  assert.deepEqual(hard(row({ end: 42.54, stoppedAt: 42.52, overshoot: -0.02 }), { V, total: 9, videoEnd: 42.54 }), []);
  // the video ending before the last sentence is an error, ended or not
  assert.ok(hard(row({ n: 4, ended: true }), { V, total: 9 }).some((f) => /^ENDED/.test(f)));
  // an ordinary stop keeps its flags
  assert.deepEqual(stopFlags(row({ n: 3, end: 10, stoppedAt: 10.02, overshoot: 0.02 }), { V: [{ s: 8, e: 9.6 }, { s: 11, e: 12 }], total: 9, videoEnd: 42.54 }).flags, []);
  assert.ok(hard(row({ n: 3, end: 10, stoppedAt: 10.4, overshoot: 0.4 }), { V: [], total: 9 }).some((f) => /^LATE/.test(f)));
});

test("bareWord matches a word and its meaning key the way the repo does", () => {
  assert.equal(bareWord("world."), "world");
  assert.equal(bareWord("It’s"), "it's");
  assert.equal(bareWord('"Hello,"'), "hello");
});

/** Roll-up caption states [[time, text]]: each word shows at its time and only the last `keep` words stay on screen. */
function rollUp(words, times, keep = 5) {
  const caps = [[0, ""]];
  words.forEach((w, k) => caps.push([times[k], words.slice(Math.max(0, k + 1 - keep), k + 1).join(" ")]));
  caps.push([times[times.length - 1] + 2, ""]);
  return caps;
}
const near = (actual, expected, tolerance = 0.05) => Math.abs(actual - expected) <= tolerance;

test("wordOnsets reads the new word of each roll-up state, through left trimming, blanks and revised punctuation", () => {
  const caps = [
    [0, ""],
    [0.7, "Dad,"],
    [1.7, "Dad, why"],
    [3.4, "Dad, why rain?"],
    [4.3, "Dad, why rain? Because"],
    [4.9, "Dad, why rain? Because son."],
    [5.4, "why rain? Because son."], // the oldest word leaves, nothing arrives
    [7.4, "rain? Because son. Why"], // one leaves and one arrives in the same state
    [9, ""],
    [10, "I don't know"],
    [10.4, "I don't know,"], // punctuation added later is not a new word
    [10.9, "I don't know, I don't know."], // repeated words are new words
  ];
  assert.deepEqual(
    wordOnsets(caps).map((o) => `${o.w}@${o.t}`),
    ["Dad,@0.7", "why@1.7", "rain?@3.4", "Because@4.3", "son.@4.9", "Why@7.4", "I@10", "don't@10", "know@10", "I@10.9", "don't@10.9", "know.@10.9"],
  );
  // sound tags and music notes are not words
  assert.deepEqual(wordOnsets([[1, "[Music] Hello"], [2, "[Music] Hello there ♪"]]).map((o) => o.w), ["Hello", "there"]);
});

test("isWordByWord tells roll-up captions from cues that appear whole, and anchorsHint only suggests --anchors for the first", () => {
  const rolling = rollUp("one two three four five six seven eight".split(" "), [1, 1.4, 1.8, 2.2, 2.6, 3, 3.4, 3.8]);
  assert.equal(isWordByWord(wordOnsets(rolling)), true);
  const whole = [[1, "Fine thanks and you"], [4, "I am okay today"], [8, "Thanks for asking me"]];
  assert.equal(isWordByWord(wordOnsets(whole)), false);
  assert.match(anchorsHint(rolling, "demo"), /--id demo --anchors/);
  assert.equal(anchorsHint(whole, "demo"), "");
  assert.equal(anchorsHint(undefined, "demo"), "");
});

test("sentenceSpans finds each sentence in the caption words and estimates the words the captions lack", () => {
  const onsets = wordOnsets(rollUp("we saw 90 ducks today".split(" "), [1, 1.3, 1.6, 1.9, 2.2]));
  // "ninety" is not in the captions ("90" is): it takes a time between its neighbours
  const two = sentenceSpans(onsets, ["We saw ninety", "ducks today."]);
  assert.equal(two.matched, 4);
  assert.equal(two.total, 5);
  assert.deepEqual(two.spans.map((s) => [s.a, s.z, s.missing]), [[1, 1.6, 1], [1.9, 2.2, 0]]);
  // a first word the captions lack is placed 0.3 s before the next one
  assert.ok(near(sentenceSpans(onsets, ["Well we saw ducks today."]).spans[0].a, 0.7, 1e-9));
  // text that is not the captions' own is refused
  assert.throws(() => sentenceSpans(onsets, ["Completely different words entirely."]), /sentence words are in the captions/);
});

test("ownRuns gives a run to every sentence whose caption words overlap it", () => {
  const spans = [{ a: 1.2, z: 1.8 }, { a: 2.7, z: 2.9 }]; // windows [1.0, 2.3] and [2.5, 3.4]
  const runs = [{ s: 1, e: 2 }, { s: 2.6, e: 3 }, { s: 5, e: 5.2 }];
  assert.deepEqual(ownRuns(runs, spans), [[0], [1], []]);
  // the last word is still sounding 0.5 s after the caption showed it, the first was heard 0.2 s before
  assert.deepEqual(ownRuns([{ s: 2.1, e: 2.2 }, { s: 2.35, e: 2.45 }, { s: 0.7, e: 0.85 }, { s: 0.8, e: 1.15 }], [spans[0]]), [[0], [], [], [0]]);
  // a run that reaches into two windows is owned by both: there is no pause between the sentences
  assert.deepEqual(ownRuns([{ s: 1, e: 3 }], spans), [[0, 1]]);
  // a graze of under 0.1 s does not count, unless it is more than half of a short run
  assert.deepEqual(ownRuns([{ s: 0, e: 1.05 }], spans), [[]]);
  assert.deepEqual(ownRuns([{ s: 0.95, e: 1.07 }], spans), [[0]]);
  assert.deepEqual(ownRuns([{ s: 0.93, e: 1.05 }], spans), [[]]);
});

test("groupByRuns joins sentences that share a run, fills the gap between distant owners and merges groups that interleave", () => {
  const spans = ["a", "b", "c", "d", "e"].map((en) => ({ en }));
  const runs = [0, 1, 2, 3, 4].map((k) => ({ s: k * 2, e: k * 2 + 1 }));
  const members = (groups) => groups.map((g) => g.members.join("+"));
  const shared = groupByRuns(spans, [[0], [1], [2, 3], [4], []], runs);
  assert.deepEqual(members(shared), ["0", "1", "2+3", "4"]);
  assert.deepEqual([shared[2].en, shared[2].s, shared[2].e], ["c d", 4, 5]);
  assert.deepEqual(members(groupByRuns(spans, [[0, 2], [1], [3], [4], []], runs)), ["0+1+2", "3", "4"]);
  assert.deepEqual(members(groupByRuns(spans.slice(0, 4), [[0], [1], [0], [2], [3]], runs)), ["0+1", "2", "3"]);
  assert.throws(() => groupByRuns(spans, [[0], [1], [2], [3], []], runs), /no voice found for "e"/);
});

test("layoutGroups puts the stop in the first pause, looks further when it has no room, and keeps the last stop off a sound behind it", () => {
  const spans = [{ en: "one" }, { en: "two" }];
  const lay = (runs, owners, duration = 100) => layoutGroups(groupByRuns(spans, owners, runs), runs, { duration });
  const times = (l) => l.timed.map((t) => [t.start, t.end]);
  // 0.30 s after the last sound, the next start 0.10 s before its sound
  assert.deepEqual(times(lay([{ s: 1, e: 2 }, { s: 3, e: 4 }], [[0], [1]])), [[0.9, 2.3], [2.9, 4.3]]);
  // a sound no sentence owns in the pause moves neither the stop nor the next start into speech
  assert.deepEqual(times(lay([{ s: 1, e: 2 }, { s: 2.6, e: 2.9 }, { s: 4, e: 5 }], [[0], [], [1]])), [[0.9, 2.3], [3.9, 5.3]]);
  // ... and when it sits right behind the last word (no room for a stop) the longest pause is used
  const crowded = lay([{ s: 1, e: 2 }, { s: 2.1, e: 2.4 }, { s: 4, e: 5 }], [[0], [], [1]]);
  assert.deepEqual(times(crowded), [[0.9, 2.7], [3.9, 5.3]]);
  assert.ok(near(crowded.placed[0].gap.d, 1.6, 1e-9));
  // the last stop stays 0.10 s off a sound after it, and inside the video
  const one = (duration) => layoutGroups(groupByRuns([{ en: "one" }], [[0], []], [{ s: 1, e: 2 }, { s: 2.2, e: 2.6 }]), [{ s: 1, e: 2 }, { s: 2.2, e: 2.6 }], { duration });
  assert.deepEqual(times(one(100)), [[0.9, 2.1]]);
  assert.deepEqual(times(one(2.05)), [[0.9, 2.05]]);
});

test("refused is the rule of check: under 0.2 s of speech, or under 1.8 or over 11 syllables a second", () => {
  assert.equal(refused({ rate: 1.8, voiced: 1 }), false);
  assert.equal(refused({ rate: 11, voiced: 1 }), false);
  assert.equal(refused({ rate: 1.7, voiced: 1 }), true);
  assert.equal(refused({ rate: 11.1, voiced: 1 }), true);
  assert.equal(refused({ rate: 5, voiced: 0.19 }), true);
});

test("joinByRate joins a refused sentence to the neighbour that makes the shorter sentence, and reports one left alone", () => {
  const runs = [{ s: 1, e: 2 }, { s: 3, e: 4 }, { s: 5, e: 6 }];
  const spans = [{ en: "a b c" }, { en: "d e" }, { en: "f g h i" }];
  const join = (rates, fallback = { rate: 4, voiced: 1 }) =>
    joinByRate(groupByRuns(spans, [[0], [1], [2]], runs), runs, {
      layout: (gs) => layoutGroups(gs, runs),
      measure: (lay) => lay.timed.map((t) => rates[t.group.en] ?? fallback),
    });
  const texts = (r) => r.groups.map((g) => g.en);
  // the middle sentence is too fast: the one before (3 + 2 words) is shorter than the one after (2 + 4)
  const mid = join({ "d e": { rate: 12, voiced: 0.3 } });
  assert.deepEqual(texts(mid), ["a b c d e", "f g h i"]);
  assert.deepEqual([mid.joins[0].first, mid.joins[0].second, mid.joins[0].rate], ["a b c", "d e", 12]);
  assert.ok(near(mid.joins[0].pause, 1, 1e-9));
  // the first can only join the next, the last only the one before
  assert.deepEqual(texts(join({ "a b c": { rate: 1.2, voiced: 2 } })), ["a b c d e", "f g h i"]);
  assert.deepEqual(texts(join({ "f g h i": { rate: 1.2, voiced: 3 } })), ["a b c", "d e f g h i"]);
  // too little speech is refused too
  assert.deepEqual(texts(join({ "d e": { rate: 5, voiced: 0.1 } })), ["a b c d e", "f g h i"]);
  // when nothing helps everything ends up as one sentence, still refused
  const all = join({}, { rate: 12, voiced: 1 });
  assert.equal(all.groups.length, 1);
  assert.equal(all.joins.length, 2);
  assert.deepEqual(all.stillRefused, [0]);
});

test("whereIn says if a moment is inside a sentence or in the pause between a stop and the next start", () => {
  const timed = [{ start: 1, end: 3 }, { start: 4, end: 6 }];
  assert.deepEqual(whereIn(timed, 2), { during: 1 });
  assert.deepEqual(whereIn(timed, 3.5), { between: [1, 2] });
  assert.deepEqual(whereIn(timed, 5), { during: 2 });
  assert.deepEqual(whereIn(timed, 0.5), { during: 1 });
});

/** Six caption sentences: 3 and 4 run on without a pause, 5 is a 0.3 s mumble (13 syllables a second), a laugh nobody captioned sits between 2 and 3. */
function demoSpeech() {
  const texts = ["Hello there my friend.", "How are you today?", "Fine thanks.", "And you?", "I do not know.", "Yes I do know."];
  const words = texts.flatMap((t) => t.split(" "));
  const caps = rollUp(words, [1.1, 1.5, 1.9, 2.3, 3.5, 3.9, 4.3, 4.7, 6.1, 6.4, 6.9, 7.2, 10, 10.08, 10.16, 10.24, 12.1, 12.4, 12.7, 13]);
  const samples = envelope([[1, 2.6], [3.4, 5], [5.5, 5.8], [6, 7.6], [10, 10.3], [12, 13.2]], 16);
  return { texts, caps, samples };
}

test("planAnchored joins sentences that share sound or speak at a rate check refuses, and lists what only an ear can judge", () => {
  const { texts, caps, samples } = demoSpeech();
  for (const threshold of [-40, null]) {
    const plan = planAnchored({ caps, samples, texts, duration: 16, threshold });
    assert.deepEqual(plan.sentences.map((s) => s.text), ["Hello there my friend.", "How are you today?", "Fine thanks. And you?", "I do not know. Yes I do know."]);
    const stops = [[0.9, 2.9], [3.3, 5.3], [5.9, 7.9], [9.9, 13.5]];
    plan.sentences.forEach((s, i) => assert.ok(near(s.start, stops[i][0]) && near(s.end, stops[i][1]), `sentence ${i + 1}: ${s.start}-${s.end}`));
    assert.deepEqual(plan.sentences.map((s) => s.members), [[0], [1], [2, 3], [4, 5]]);
    assert.deepEqual([plan.clip.start, plan.clip.end], [0, 13.6]);
    assert.ok(plan.notes.some((n) => /joined 2 caption sentences with no pause between them.*"Fine thanks\." \+ "And you\?"/.test(n)));
    assert.ok(plan.notes.some((n) => /joined "I do not know\." \+ "Yes I do know\." \(speech rate 13\.\d syl\/s was outside 1\.8-11/.test(n)));
    assert.deepEqual(plan.warns, []);
    // the LISTEN list: the sound between 2 and 3, both joined sentences
    assert.equal(plan.listen.length, 3);
    assert.match(plan.listen[0].flags[0], /^uncaptioned sound 5\.\d\d-5\.\d\d$/);
    assert.deepEqual(plan.listen[0].between, [2, 3]);
    assert.deepEqual([plan.listen[1].after, plan.listen[2].after], [3, 4]);
    assert.ok(plan.listen[1].flags.includes("joined2") && plan.listen[2].flags.includes("joined2"));
    assert.equal(plan.listen[2].pause, null);
    assert.equal(plan.unowned.length, 1);
  }
  // cues that appear whole give every word of a line one time: the plan still runs but says its windows are coarse
  const whole = texts.map((t, i) => [[1, 3.4, 6, 6.8, 10, 12][i], t]);
  assert.ok(planAnchored({ caps: whole, samples, texts, duration: 16, threshold: -40 }).warns.some((w) => /one word at a time/.test(w)));
  assert.throws(() => planAnchored({ caps: [[0, ""]], samples, texts }), /no caption words/);
  assert.throws(() => planAnchored({ caps, samples: envelope([[1, 2.6]], 16), texts }), /fewer than two voiced intervals/);
});

test("planAnchored keeps the last stop and the clip end 0.10 s before the last frame", () => {
  const { texts, caps, samples } = demoSpeech();
  // the speech runs to 13.2 s and would be stopped at 13.5 s; the picture ends at 13.25 s
  const open = planAnchored({ caps, samples, texts, duration: 16, threshold: -40 });
  assert.ok(near(open.sentences[3].end, 13.5) && open.clip.end >= 13.5);
  const capped = planAnchored({ caps, samples, texts, duration: 16, pictureEnd: 13.25, threshold: -40 });
  assert.equal(capped.sentences[3].end, 13.15);
  assert.ok(capped.clip.end <= 13.15);
  // the earlier stops are where they were
  assert.deepEqual(capped.sentences.slice(0, 3).map((x) => [x.start, x.end]), open.sentences.slice(0, 3).map((x) => [x.start, x.end]));
});

test("planAnchored warns when the voice is still going where its search stops (a closing chant)", () => {
  const { texts, caps } = demoSpeech();
  const chant = envelope([[1, 2.6], [3.4, 5], [5.5, 5.8], [6, 7.6], [10, 10.3], [12, 15.99]], 20); // the last words go on for four seconds
  const warned = planAnchored({ caps, samples: chant, texts, duration: 20, threshold: -40 }).warns;
  assert.ok(warned.some((w) => /still going where the search for it stops \(16\.0 s\).*--window 0-20/.test(w)), warned.join(" | "));
  const { samples } = demoSpeech();
  assert.ok(!planAnchored({ caps, samples, texts, duration: 16, threshold: -40 }).warns.some((w) => /still going/.test(w)));
});
