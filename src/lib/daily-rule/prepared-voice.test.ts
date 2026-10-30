import assert from "node:assert/strict";
import test from "node:test";

import { ALL_RULES } from "@/lib/daily-rule/levels";
import { preparedItems, preparedSentenceId } from "@/lib/daily-rule/prepared";
import {
  PREPARED_FREE_VOICE_ID,
  PREPARED_PREMIUM_VOICE_ID,
  preparedNarratorAt,
  preparedVoiceIdFor,
} from "@/lib/daily-rule/prepared-voice";

test("the premium voice reads the 1st, 3rd and 5th sentence of a rule and Emma the others", () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4, 5].map((place) => preparedNarratorAt(place)),
    ["premium", "free", "premium", "free", "premium", "free"],
  );
});

test("the voice of a sentence comes from its id", () => {
  assert.equal(preparedVoiceIdFor(preparedSentenceId("a1-05", 0)), PREPARED_PREMIUM_VOICE_ID);
  assert.equal(preparedVoiceIdFor(preparedSentenceId("a1-05", 1)), PREPARED_FREE_VOICE_ID);
  assert.equal(preparedVoiceIdFor(preparedSentenceId("b2-45", 4)), PREPARED_PREMIUM_VOICE_ID);
  assert.equal(preparedVoiceIdFor(preparedSentenceId("b2-45", 5)), PREPARED_FREE_VOICE_ID);
  assert.equal(
    preparedVoiceIdFor("prep:a1-05"),
    PREPARED_FREE_VOICE_ID,
    "an id without a place falls to Emma",
  );
});

test("the two voices are the registered ones: the Stories narrator and Emma", () => {
  assert.equal(PREPARED_PREMIUM_VOICE_ID, "elevenlabs-j2fglqg8gd7x8uedt2h8");
  assert.equal(PREPARED_FREE_VOICE_ID, "edge-tts-en-us-emma");
});

test("across the whole course the two voices read about half of the sentences each, and every rule has both", () => {
  let premium = 0;
  let free = 0;
  for (const rule of ALL_RULES) {
    const voices = preparedItems(rule).map((item) => preparedVoiceIdFor(item.sentenceId));
    premium += voices.filter((voice) => voice === PREPARED_PREMIUM_VOICE_ID).length;
    free += voices.filter((voice) => voice === PREPARED_FREE_VOICE_ID).length;
    assert.ok(voices.includes(PREPARED_PREMIUM_VOICE_ID), `${rule.id} has a premium sentence`);
    assert.ok(voices.includes(PREPARED_FREE_VOICE_ID), `${rule.id} has an Emma sentence`);
  }
  const share = premium / (premium + free);
  assert.ok(
    share >= 0.5 && share <= 0.56,
    `premium share ${share.toFixed(3)} (${premium} / ${free})`,
  );
});
