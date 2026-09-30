import assert from "node:assert/strict";
import test from "node:test";

import { buildFromMemoryItems } from "@/lib/features/from-memory";
import type { Sentence } from "@/types/content";

function sentence(overrides: Partial<Sentence>): Sentence {
  return { id: "s1", en: "I like tea", ar: "أحب الشاي", ...overrides };
}

test("buildFromMemoryItems: uses the locale-resolved supportText when it is a real translation", () => {
  const items = buildFromMemoryItems([sentence({ supportText: "Me gusta el té" })], "es");
  assert.equal(items.length, 1);
  assert.equal(items[0]?.prompt, "Me gusta el té");
});

test("buildFromMemoryItems: never uses the English itself as the prompt", () => {
  const items = buildFromMemoryItems([sentence({ supportText: "I like tea" })], "es");
  assert.equal(items.length, 0);
});

test("buildFromMemoryItems: falls back to Arabic only for an Arabic-interface learner", () => {
  assert.equal(buildFromMemoryItems([sentence({})], "ar")[0]?.prompt, "أحب الشاي");
  assert.equal(buildFromMemoryItems([sentence({})], "es").length, 0);
  assert.equal(buildFromMemoryItems([sentence({})], null).length, 0);
});

test("buildFromMemoryItems: skips sentences with nothing to prompt with and keeps the rest in order", () => {
  const items = buildFromMemoryItems(
    [
      sentence({ id: "a", supportText: "uno" }),
      sentence({ id: "b", supportText: "  " }),
      sentence({ id: "c", supportText: "tres" }),
    ],
    "es",
  );
  assert.deepEqual(
    items.map((item) => item.sentence.id),
    ["a", "c"],
  );
});
