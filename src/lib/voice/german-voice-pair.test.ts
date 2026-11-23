import { test } from "node:test";
import assert from "node:assert/strict";

import {
  GERMAN_FEMALE_VOICE_ID,
  GERMAN_MALE_VOICE_ID,
  secondVoiceFor,
  voiceForWordAt,
} from "./german-voice-pair";

test("the German woman has the German man as her pair, no other voice has one", () => {
  assert.equal(secondVoiceFor(GERMAN_FEMALE_VOICE_ID), GERMAN_MALE_VOICE_ID);
  assert.equal(secondVoiceFor("some-english-voice"), null);
  assert.equal(secondVoiceFor(null), null);
});

test("in a German topic the woman has the 1st, 3rd... word and the man the 2nd, 4th...", () => {
  const voices = [0, 1, 2, 3, 4, 5].map((i) => voiceForWordAt(GERMAN_FEMALE_VOICE_ID, i));
  assert.deepEqual(voices, [
    GERMAN_FEMALE_VOICE_ID,
    GERMAN_MALE_VOICE_ID,
    GERMAN_FEMALE_VOICE_ID,
    GERMAN_MALE_VOICE_ID,
    GERMAN_FEMALE_VOICE_ID,
    GERMAN_MALE_VOICE_ID,
  ]);
});

test("a round of four consecutive words has two of each voice", () => {
  for (const start of [0, 4, 8]) {
    const voices = [0, 1, 2, 3].map((i) => voiceForWordAt(GERMAN_FEMALE_VOICE_ID, start + i));
    assert.equal(voices.filter((v) => v === GERMAN_FEMALE_VOICE_ID).length, 2);
    assert.equal(voices.filter((v) => v === GERMAN_MALE_VOICE_ID).length, 2);
  }
});

test("any other topic keeps its one voice, and no voice stays no voice", () => {
  assert.equal(voiceForWordAt("english-voice", 0), "english-voice");
  assert.equal(voiceForWordAt("english-voice", 1), "english-voice");
  assert.equal(voiceForWordAt(null, 1), null);
});
