import assert from "node:assert/strict";
import test from "node:test";

import {
  clipKey,
  pickWordClip,
  sentenceWordEntries,
  wordContentId,
  wordTextCandidates,
} from "@/lib/voice/sentence-word-plan";

test("wordContentId: the `${sentenceId}::${word}` reference every word cache already keys on", () => {
  assert.equal(wordContentId("s1", "went"), "s1::went");
});

test("sentenceWordEntries: one entry per distinct word, in reading order, keyed by the normalized word", () => {
  const entries = sentenceWordEntries("s1", "She went home, and she slept.");
  assert.deepEqual(
    entries.map((entry) => entry.key),
    ["she", "went", "home", "and", "slept"],
  );
  assert.deepEqual(
    entries.map((entry) => entry.contentId),
    ["s1::she", "s1::went", "s1::home", "s1::and", "s1::slept"],
  );
});

test("sentenceWordEntries: the raw token is the FIRST occurrence, punctuation and capitals intact", () => {
  const entries = sentenceWordEntries("s1", "She said: go home, she said.");
  const she = entries.find((entry) => entry.key === "she");
  const said = entries.find((entry) => entry.key === "said");
  const home = entries.find((entry) => entry.key === "home");
  assert.equal(she?.raw, "She");
  assert.equal(said?.raw, "said:");
  assert.equal(home?.raw, "home,");
});

test("sentenceWordEntries: punctuation-only tokens have no audio and are skipped", () => {
  const entries = sentenceWordEntries("s1", "Wait — really ... yes!");
  assert.deepEqual(
    entries.map((entry) => entry.key),
    ["wait", "really", "yes"],
  );
});

test("sentenceWordEntries: keeps apostrophes and hyphens inside a word, strips only the edges", () => {
  const entries = sentenceWordEntries("s1", "Don't go; it's well-known!");
  assert.deepEqual(
    entries.map((entry) => entry.key),
    ["don't", "go", "it's", "well-known"],
  );
});

test("sentenceWordEntries: empty and whitespace-only text has no words", () => {
  assert.deepEqual(sentenceWordEntries("s1", ""), []);
  assert.deepEqual(sentenceWordEntries("s1", "   "), []);
});

test("wordTextCandidates: the raw spelling first (existing clips keep winning), then the normalized one", () => {
  assert.deepEqual(wordTextCandidates("Hello,", "hello"), ["Hello,", "hello"]);
  assert.deepEqual(wordTextCandidates("went.", "went"), ["went.", "went"]);
});

test("wordTextCandidates: one candidate when the two spellings are the same", () => {
  assert.deepEqual(wordTextCandidates("went", "went"), ["went"]);
});

test("wordTextCandidates: whitespace is collapsed the way the cache key collapses it", () => {
  assert.deepEqual(wordTextCandidates("  ice   cream ", "ice cream"), ["ice cream"]);
});

test("pickWordClip: finds a backfilled clip cached under the normalized spelling for a capitalised, punctuated word", () => {
  // The bug this fixes: "Hello," was looked up as "Hello," only, but the backfill wrote "hello".
  const clips = new Map([[clipKey("edge-emma", "hello"), "https://clips.test/hello.mp3"]]);
  assert.equal(
    pickWordClip(wordTextCandidates("Hello,", "hello"), ["edge-emma"], clips),
    "https://clips.test/hello.mp3",
  );
});

test("pickWordClip: a clip already cached under the raw spelling keeps winning over the normalized one", () => {
  const clips = new Map([
    [clipKey("edge-emma", "Hello,"), "https://clips.test/raw.mp3"],
    [clipKey("edge-emma", "hello"), "https://clips.test/normalized.mp3"],
  ]);
  assert.equal(
    pickWordClip(wordTextCandidates("Hello,", "hello"), ["edge-emma"], clips),
    "https://clips.test/raw.mp3",
  );
});

test("pickWordClip: within a spelling the earlier voice (the narrator) wins over the word voice", () => {
  const clips = new Map([
    [clipKey("word-voice", "yes"), "https://clips.test/word.mp3"],
    [clipKey("narrator", "yes"), "https://clips.test/narrator.mp3"],
  ]);
  assert.equal(
    pickWordClip(["yes"], ["narrator", "word-voice"], clips),
    "https://clips.test/narrator.mp3",
  );
  assert.equal(
    pickWordClip(["yes"], ["word-voice", "narrator"], clips),
    "https://clips.test/word.mp3",
  );
});

test("pickWordClip: nothing cached under any spelling or voice is undefined, never a wrong clip", () => {
  const clips = new Map([[clipKey("other-voice", "hello"), "https://clips.test/other.mp3"]]);
  assert.equal(pickWordClip(["Hello,", "hello"], ["edge-emma"], clips), undefined);
  assert.equal(pickWordClip([], ["edge-emma"], clips), undefined);
});
