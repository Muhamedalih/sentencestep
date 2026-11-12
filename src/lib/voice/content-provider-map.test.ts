import assert from "node:assert/strict";
import test from "node:test";

import {
  FISH_AUDIO_MODEL,
  isWordListGroupProvider,
  isWordListProvider,
  WORD_LIST_ELEVENLABS_MODEL,
  WORD_LIST_ELEVENLABS_STABILITY,
  wordListModelFor,
} from "@/lib/voice/content-provider-map";

test("ElevenLabs is a voice a word GROUP may have, but never the site default or an on-demand voice", () => {
  assert.equal(isWordListGroupProvider("elevenlabs"), true);
  assert.equal(isWordListProvider("elevenlabs"), false);
  for (const source of ["edge-tts", "fish-audio"]) {
    assert.equal(isWordListProvider(source), true, source);
    assert.equal(isWordListGroupProvider(source), true, source);
  }
});

test("providers Word Lists never used stay out of both lists", () => {
  for (const source of ["cartesia", "hume", "", "ElevenLabs", "toString"]) {
    assert.equal(isWordListGroupProvider(source), false, source);
    assert.equal(isWordListProvider(source), false, source);
  }
});

test("each provider's word clips carry its own pinned model", () => {
  assert.equal(wordListModelFor("edge-tts"), "edge-tts");
  assert.equal(wordListModelFor("fish-audio"), FISH_AUDIO_MODEL);
  assert.equal(wordListModelFor("elevenlabs"), WORD_LIST_ELEVENLABS_MODEL);
  assert.equal(WORD_LIST_ELEVENLABS_MODEL, "eleven_multilingual_v2");
});

test("an ElevenLabs word clip is steadier than a sentence (stability above the sentence default of 0.5)", () => {
  assert.ok(WORD_LIST_ELEVENLABS_STABILITY > 0.5 && WORD_LIST_ELEVENLABS_STABILITY <= 1);
});
