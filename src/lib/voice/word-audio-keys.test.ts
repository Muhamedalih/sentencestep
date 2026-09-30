import assert from "node:assert/strict";
import test from "node:test";

import { lessonWordRefs, sentenceWordRefs } from "@/lib/voice/word-audio-keys";

test("sentenceWordRefs: one ref per distinct word, raw token kept, keyed like the word click", () => {
  const refs = sentenceWordRefs({ id: "s1", en: "Reply to everything, then reply again." });
  assert.deepEqual(
    refs.map((ref) => [ref.contentId, ref.text]),
    [
      ["s1::reply", "Reply"],
      ["s1::to", "to"],
      ["s1::everything", "everything,"],
      ["s1::then", "then"],
      ["s1::again", "again."],
    ],
  );
});

test("sentenceWordRefs: skips tokens that aren't words", () => {
  const refs = sentenceWordRefs({ id: "s2", en: "Wait — 42 is ... fine!" });
  assert.deepEqual(
    refs.map((ref) => ref.contentId),
    ["s2::wait", "s2::is", "s2::fine"],
  );
});

test("lessonWordRefs: covers every sentence in order and honors the cap", () => {
  const sentences = [
    { id: "a", en: "One two." },
    { id: "b", en: "Three four five." },
  ];
  assert.deepEqual(
    lessonWordRefs(sentences).map((ref) => ref.contentId),
    ["a::one", "a::two", "b::three", "b::four", "b::five"],
  );
  assert.equal(lessonWordRefs(sentences, 3).length, 3);
  assert.deepEqual(lessonWordRefs([], 3), []);
});
