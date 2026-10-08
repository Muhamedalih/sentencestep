// Run with `npm test`. No database: the lookup is a stub returning what row-level
// security would (the row for an entitled caller, nothing otherwise).

import { test } from "node:test";
import assert from "node:assert/strict";

import { canReadSentence } from "./sentence-access";
import type { SentenceLookup } from "./sentence-access";

function stub(result: { data: { id: string } | null; error: unknown }): {
  lookup: SentenceLookup;
  asked: string[];
} {
  const asked: string[] = [];
  const lookup: SentenceLookup = async (id) => {
    asked.push(id);
    return result;
  };
  return { lookup, asked };
}

test("canReadSentence: true when row-level security returns the sentence", async () => {
  const { lookup, asked } = stub({ data: { id: "story-40-s1" }, error: null });
  assert.equal(await canReadSentence(lookup, "story-40-s1"), true);
  assert.deepEqual(asked, ["story-40-s1"]);
});

test("canReadSentence: false when the caller can't see the row (a premium sentence for a free visitor) or it doesn't exist", async () => {
  const { lookup } = stub({ data: null, error: null });
  assert.equal(await canReadSentence(lookup, "story-40-s1"), false);
});

test("canReadSentence: a database error is thrown, never treated as allowed or silently as not found", async () => {
  const { lookup } = stub({ data: null, error: new Error("boom") });
  await assert.rejects(() => canReadSentence(lookup, "story-40-s1"), /boom/);
});
