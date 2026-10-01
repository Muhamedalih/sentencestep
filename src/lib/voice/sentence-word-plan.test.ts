import assert from "node:assert/strict";
import test from "node:test";

import {
  clipKey,
  pickSentenceClips,
  rankWordVoices,
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

test("wordTextCandidates: raw first (existing clips keep winning), then the normalized word, then the Capitalized entry", () => {
  assert.deepEqual(wordTextCandidates("Hello,", "hello"), ["Hello,", "hello", "Hello"]);
  assert.deepEqual(wordTextCandidates("went.", "went"), ["went.", "went", "Went"]);
});

test("wordTextCandidates: spellings that coincide are listed once", () => {
  assert.deepEqual(wordTextCandidates("went", "went"), ["went", "Went"]);
  assert.deepEqual(wordTextCandidates("Went", "went"), ["Went", "went"]);
});

test("wordTextCandidates: whitespace is collapsed the way the cache key collapses it", () => {
  assert.deepEqual(wordTextCandidates("  ice   cream ", "ice cream"), ["ice cream", "Ice cream"]);
});

const voices = [
  { id: "edge-aria", gender: "female", accent: "American" },
  { id: "edge-emma", gender: "female", accent: "American" },
  { id: "edge-sonia", gender: "female", accent: "British" },
  { id: "edge-guy", gender: "male", accent: "American" },
  { id: "edge-ryan", gender: "male", accent: "British" },
];

test("rankWordVoices: the lesson's word voice first, then its gender (Word Lists voice ahead), American before other accents, the other gender after, the paid narrator last", () => {
  assert.deepEqual(
    rankWordVoices({
      wordVoiceId: "edge-aria",
      pronunciationVoiceId: "edge-emma",
      narratorVoiceId: "cartesia-skylar",
      voices,
    }),
    ["edge-aria", "edge-emma", "edge-sonia", "edge-guy", "edge-ryan", "cartesia-skylar"],
  );
});

test("rankWordVoices: a male word voice keeps the male voices ahead of the female Word Lists voice", () => {
  assert.deepEqual(
    rankWordVoices({
      wordVoiceId: "edge-guy",
      pronunciationVoiceId: "edge-emma",
      narratorVoiceId: "eleven-adam",
      voices,
    }),
    ["edge-guy", "edge-ryan", "edge-emma", "edge-aria", "edge-sonia", "eleven-adam"],
  );
});

test("rankWordVoices: still yields the word voice and narrator when the voice list couldn't be read", () => {
  assert.deepEqual(
    rankWordVoices({
      wordVoiceId: "edge-aria",
      pronunciationVoiceId: null,
      narratorVoiceId: "edge-aria",
      voices: [],
    }),
    ["edge-aria"],
  );
});

const query = (word: string, raw = word) => ({
  contentId: `s1::${word}`,
  candidates: wordTextCandidates(raw, word),
});

test("pickSentenceClips: finds a clip cached under the normalized spelling for a capitalised, punctuated word", () => {
  const clips = new Map([[clipKey("edge-emma", "hello"), "https://clips.test/hello.mp3"]]);
  const { urls } = pickSentenceClips([query("hello", "Hello,")], ["edge-emma"], clips);
  assert.deepEqual(urls, { "s1::hello": "https://clips.test/hello.mp3" });
});

test("pickSentenceClips: finds a Word Lists clip stored under the Capitalized entry", () => {
  const clips = new Map([[clipKey("edge-emma", "Hello"), "https://clips.test/entry.mp3"]]);
  const { urls } = pickSentenceClips([query("hello", "hello")], ["edge-emma"], clips);
  assert.deepEqual(urls, { "s1::hello": "https://clips.test/entry.mp3" });
});

test("pickSentenceClips: a clip already cached under the raw spelling keeps winning over the normalized one", () => {
  const clips = new Map([
    [clipKey("edge-emma", "Hello,"), "https://clips.test/raw.mp3"],
    [clipKey("edge-emma", "hello"), "https://clips.test/normalized.mp3"],
  ]);
  const { urls } = pickSentenceClips([query("hello", "Hello,")], ["edge-emma"], clips);
  assert.equal(urls["s1::hello"], "https://clips.test/raw.mp3");
});

test("pickSentenceClips: one voice speaks the sentence — the voice covering the most words, even when it isn't first in line", () => {
  // The whole inventory lives under Emma; Aria (first in line) has just one stray clip.
  const clips = new Map([
    [clipKey("edge-aria", "walked"), "https://clips.test/aria-walked.mp3"],
    [clipKey("edge-emma", "i"), "https://clips.test/emma-i.mp3"],
    [clipKey("edge-emma", "walked"), "https://clips.test/emma-walked.mp3"],
    [clipKey("edge-emma", "into"), "https://clips.test/emma-into.mp3"],
  ]);
  const choice = pickSentenceClips(
    [query("i"), query("walked"), query("into")],
    ["edge-aria", "edge-emma"],
    clips,
  );
  assert.equal(choice.primaryVoiceId, "edge-emma");
  assert.deepEqual(choice.coverage, { "edge-aria": 1, "edge-emma": 3 });
  assert.deepEqual(choice.urls, {
    "s1::i": "https://clips.test/emma-i.mp3",
    "s1::walked": "https://clips.test/emma-walked.mp3",
    "s1::into": "https://clips.test/emma-into.mp3",
  });
});

test("pickSentenceClips: a word the primary voice lacks is filled in from the next voice, not left without sound", () => {
  const clips = new Map([
    [clipKey("edge-emma", "i"), "https://clips.test/emma-i.mp3"],
    [clipKey("edge-emma", "went"), "https://clips.test/emma-went.mp3"],
    [clipKey("edge-aria", "home"), "https://clips.test/aria-home.mp3"],
  ]);
  const { urls, primaryVoiceId } = pickSentenceClips(
    [query("i"), query("went"), query("home")],
    ["edge-aria", "edge-emma"],
    clips,
  );
  assert.equal(primaryVoiceId, "edge-emma");
  assert.equal(urls["s1::home"], "https://clips.test/aria-home.mp3");
});

test("pickSentenceClips: a tie goes to the voice that ranks first", () => {
  const clips = new Map([
    [clipKey("edge-aria", "go"), "https://clips.test/aria.mp3"],
    [clipKey("edge-emma", "go"), "https://clips.test/emma.mp3"],
  ]);
  const { urls, primaryVoiceId } = pickSentenceClips(
    [query("go")],
    ["edge-aria", "edge-emma"],
    clips,
  );
  assert.equal(primaryVoiceId, "edge-aria");
  assert.equal(urls["s1::go"], "https://clips.test/aria.mp3");
});

test("pickSentenceClips: nothing cached anywhere is no clip and no primary voice — never a wrong clip", () => {
  const clips = new Map([[clipKey("other-voice", "hello"), "https://clips.test/other.mp3"]]);
  const choice = pickSentenceClips([query("hello", "Hello,")], ["edge-emma"], clips);
  assert.deepEqual(choice, { urls: {}, primaryVoiceId: null, coverage: {} });
});
