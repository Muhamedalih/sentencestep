// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { fallbackDictionary, getDictionary } from "@/lib/i18n/dictionary";

import { guideSegments } from "./guide";

const VALUES = { id: "1239354913", amount: "4", code: "SS-7XGH2" };

test("guideSegments: the learner's own numbers go in, and what was in brackets becomes a chip", () => {
  assert.deepEqual(guideSegments("Paste the ID [{id}] (copy it from above).", VALUES), [
    { text: "Paste the ID ", chip: false },
    { text: "1239354913", chip: true },
    { text: " (copy it from above).", chip: false },
  ]);
});

test("guideSegments: several chips in one step, and a step that starts or ends with one", () => {
  assert.deepEqual(guideSegments("[Send] then [Send to Binance User]", VALUES), [
    { text: "Send", chip: true },
    { text: " then ", chip: false },
    { text: "Send to Binance User", chip: true },
  ]);
});

test("guideSegments: a step with no brackets is one plain piece, and nothing is left unfilled", () => {
  assert.deepEqual(guideSegments("Come back to this page.", VALUES), [
    { text: "Come back to this page.", chip: false },
  ]);
  const filled = guideSegments("[{id}] [{amount}] [{code}]", VALUES).map((piece) => piece.text);
  assert.ok(filled.every((text) => !text.includes("{")));
});

test("the guide is complete in every language: seven steps, each of the learner's figures where it belongs", () => {
  const dictionaries = [
    ["en", fallbackDictionary],
    ["ar", getDictionary("ar")],
    ["es", getDictionary("es")],
    ["tr", getDictionary("tr")],
  ] as const;

  for (const [locale, t] of dictionaries) {
    const steps = t.binancePay.guideSteps;
    assert.equal(steps.length, 7, `${locale}: seven steps`);
    assert.ok(steps[2]!.includes("[{id}]"), `${locale}: step 3 carries the Binance ID`);
    assert.ok(steps[3]!.includes("[{amount}]"), `${locale}: step 4 carries the amount`);
    assert.ok(steps[3]!.includes("[USDT]"), `${locale}: step 4 names the coin`);
    assert.ok(steps[4]!.includes("[{code}]"), `${locale}: step 5 carries the order code`);
    for (const step of steps) {
      assert.equal(
        (step.match(/\[/g) ?? []).length,
        (step.match(/\]/g) ?? []).length,
        `${locale}: balanced brackets in "${step}"`,
      );
      const rendered = guideSegments(step, VALUES)
        .map((piece) => piece.text)
        .join("");
      assert.equal(/[{}]/.test(rendered), false, `${locale}: nothing left unfilled in "${step}"`);
    }
  }
});
