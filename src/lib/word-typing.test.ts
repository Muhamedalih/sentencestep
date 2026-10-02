import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_TYPE_AHEAD,
  appendedChars,
  createTypeAheadBuffer,
  keepPrefix,
} from "@/lib/word-typing";

test("appendedChars: only letters added at the end count as typing ahead", () => {
  assert.equal(appendedChars("aunt", "auntu"), "u");
  assert.equal(appendedChars("aunt", "auntuncle"), "uncle");
  assert.equal(appendedChars("", "u"), "u");
  // A deletion, an edit in the middle or no change is not typing ahead.
  assert.equal(appendedChars("aunt", "aun"), "");
  assert.equal(appendedChars("aunt", "aunt"), "");
  assert.equal(appendedChars("aunt", "xaunt"), "");
  assert.equal(appendedChars("aunt", "aXnt!"), "");
});

test("keepPrefix: a hinted first letter cannot be erased or replaced", () => {
  assert.equal(keepPrefix("au", "a"), "au");
  assert.equal(keepPrefix("Au", "a"), "Au");
  assert.equal(keepPrefix("", "a"), "a");
  assert.equal(keepPrefix("u", "a"), "a");
  // No hint, no constraint.
  assert.equal(keepPrefix("u", ""), "u");
});

test("the type-ahead buffer hands letters to the next word exactly once", () => {
  const buffer = createTypeAheadBuffer();
  assert.equal(buffer.take(), "");
  buffer.hold("un");
  buffer.hold("cl");
  assert.equal(buffer.take(), "uncl");
  assert.equal(buffer.take(), "");
});

test("the type-ahead buffer can be thrown away, and never grows without bound", () => {
  const buffer = createTypeAheadBuffer();
  buffer.hold("abc");
  buffer.clear();
  assert.equal(buffer.take(), "");

  buffer.hold("x".repeat(MAX_TYPE_AHEAD * 3));
  assert.equal(buffer.take().length, MAX_TYPE_AHEAD);
  const small = createTypeAheadBuffer(3);
  small.hold("abcdef");
  assert.equal(small.take(), "abc");
});
