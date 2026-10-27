import assert from "node:assert/strict";
import test from "node:test";

import { bankFormFor } from "@/lib/word-bank/forms";
import type { BankForm } from "@/lib/word-bank/forms";

const everything = { otherSentence: true, clip: true };
const nothing = { otherSentence: false, clip: false };

test("the stronger the word, the less the screen gives away", () => {
  const forms = [0, 1, 2, 3, 4, 5].map((strength) => bankFormFor(strength, everything));
  assert.deepEqual(forms, ["meaning", "meaning", "context", "context", "audio", "audio"]);
});

test("a word nothing else can build a form for stays on the meaning form", () => {
  for (const strength of [0, 1, 2, 3, 4, 5]) {
    assert.equal(bankFormFor(strength, nothing), "meaning");
  }
});

test("without another sentence the form steps down, never sideways", () => {
  const noSentence = { otherSentence: false, clip: true };
  assert.equal(bankFormFor(3, noSentence), "meaning");
  assert.equal(bankFormFor(4, noSentence), "audio");
});

test("without a recorded clip the audio form steps down to the sentence form", () => {
  const noClip = { otherSentence: true, clip: false };
  assert.equal(bankFormFor(5, noClip), "context");
  assert.equal(bankFormFor(2, noClip), "context");
  assert.equal(bankFormFor(1, noClip), "meaning");
});

test("a strength outside the ladder is read as the nearest end of it", () => {
  const expected: Record<number, BankForm> = { [-3]: "meaning", 9: "audio" };
  for (const [strength, form] of Object.entries(expected)) {
    assert.equal(bankFormFor(Number(strength), everything), form);
  }
});
