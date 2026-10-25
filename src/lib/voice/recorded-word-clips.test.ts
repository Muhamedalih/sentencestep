import assert from "node:assert/strict";
import test from "node:test";

import { pickAnyWordClips, pickStoryWordClips } from "@/lib/voice/recorded-word-clips";
import type { WordClipRow } from "@/lib/voice/recorded-word-clips";

const hashes = new Map<string, string[]>([
  ["balloon", ["h-balloon", "h-Balloon"]],
  ["rain", ["h-rain", "h-Rain"]],
  ["ghost", ["h-ghost"]],
]);

function row(
  voice: string,
  hash: string,
  url: string | null,
  version = "story-vocab:v1",
): WordClipRow {
  return { voice_id: voice, text_hash: hash, audio_url: url, generation_version: version };
}

test("a story's word plays the clip in the story's own narrator voice", () => {
  const picked = pickStoryWordClips(
    hashes,
    [
      row("jessa", "h-balloon", "https://clips/jessa-balloon.mp3"),
      row("nichalia", "h-balloon", "https://clips/nichalia-balloon.mp3"),
    ],
    "nichalia",
  );
  assert.equal(picked.get("balloon"), "https://clips/nichalia-balloon.mp3");
});

test("a story whose voice changed after its words were made keeps the story-word clips it already had", () => {
  const rows = [row("jessa", "h-balloon", "https://clips/jessa-balloon.mp3")];
  assert.equal(
    pickStoryWordClips(hashes, rows, "nichalia").get("balloon"),
    "https://clips/jessa-balloon.mp3",
  );
  // And with no narrator voice resolved at all.
  assert.equal(
    pickStoryWordClips(hashes, rows, null).get("balloon"),
    "https://clips/jessa-balloon.mp3",
  );
});

test("a clip of another kind under another voice is never handed out as a story word's", () => {
  const picked = pickStoryWordClips(
    hashes,
    [
      row("emma", "h-rain", "https://clips/emma-rain.mp3", "word-list:v2"),
      row("aria", "h-rain", "https://clips/aria-rain.mp3", "edge-tts:sentence-word:v1"),
    ],
    "nichalia",
  );
  assert.equal(picked.has("rain"), false);
});

test("the other spelling of the word is tried when the first has no usable clip", () => {
  const picked = pickStoryWordClips(
    hashes,
    [
      row("emma", "h-rain", "https://clips/emma-rain.mp3", "word-list:v2"),
      row("nichalia", "h-Rain", "https://clips/nichalia-Rain.mp3"),
    ],
    "nichalia",
  );
  assert.equal(picked.get("rain"), "https://clips/nichalia-Rain.mp3");
});

test("a row without a file, and a word nobody recorded, give nothing", () => {
  const picked = pickStoryWordClips(
    hashes,
    [row("nichalia", "h-balloon", null), row("nichalia", "h-other", "https://clips/other.mp3")],
    "nichalia",
  );
  assert.equal(picked.size, 0);
  assert.equal(pickStoryWordClips(hashes, [], "nichalia").size, 0);
});

test("any recording of the word will do for the last stop: the newest one, the exact spelling first", () => {
  const rows = [
    // newest first, as they are read
    row("andrew", "h-rain", "https://clips/andrew-rain.mp3", "edge-tts:sentence-word:v1"),
    row("aria", "h-rain", "https://clips/aria-rain.mp3", "edge-tts:sentence-word:v1"),
    row("jessa", "h-Balloon", "https://clips/jessa-Balloon.mp3"),
  ];
  const picked = pickAnyWordClips(hashes, rows);
  assert.equal(picked.get("rain"), "https://clips/andrew-rain.mp3");
  assert.equal(picked.get("balloon"), "https://clips/jessa-Balloon.mp3");
  assert.equal(picked.has("ghost"), false);
});

test("the last stop never hands out a row without a file", () => {
  const picked = pickAnyWordClips(hashes, [
    row("aria", "h-rain", null),
    row("andrew", "h-Rain", "https://clips/andrew-Rain.mp3"),
  ]);
  assert.equal(picked.get("rain"), "https://clips/andrew-Rain.mp3");
  assert.equal(pickAnyWordClips(hashes, []).size, 0);
});

test("a later version of the story-word clips (story-vocab:v2) is still a story-word clip", () => {
  const picked = pickStoryWordClips(
    hashes,
    [row("jessa", "h-balloon", "https://clips/jessa-balloon-v2.mp3", "story-vocab:v2")],
    "nichalia",
  );
  assert.equal(picked.get("balloon"), "https://clips/jessa-balloon-v2.mp3");
});
