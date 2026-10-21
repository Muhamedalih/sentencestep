import { test } from "node:test";
import assert from "node:assert/strict";

import {
  assignFirstRunVariant,
  decideFirstRunVariant,
  isFirstRunVariant,
  parseFirstRunCookie,
  sharePercentFromConfig,
  variantFromSearch,
} from "./variant";

test("assignFirstRunVariant: the share of visitors below the cut-off get the short first run", () => {
  assert.equal(assignFirstRunVariant(0, 0.5), "short");
  assert.equal(assignFirstRunVariant(0.499, 0.5), "short");
  assert.equal(assignFirstRunVariant(0.5, 0.5), "classic");
  assert.equal(assignFirstRunVariant(0.999, 0.5), "classic");
});

test("assignFirstRunVariant: a share of 0 or 1 gives everyone the same variant, and the split follows the share", () => {
  for (const random of [0, 0.25, 0.5, 0.75, 0.999]) {
    assert.equal(assignFirstRunVariant(random, 0), "classic");
    assert.equal(assignFirstRunVariant(random, 1), "short");
  }
  let short = 0;
  for (let index = 0; index < 10_000; index++) {
    if (assignFirstRunVariant((index + 0.5) / 10_000, 0.3) === "short") short++;
  }
  assert.equal(short, 3000);
});

test("decideFirstRunVariant: an address variant or a stored one wins and is remembered", () => {
  const base = { sharePercent: 100, random: 0 };
  assert.deepEqual(decideFirstRunVariant({ ...base, forced: "classic", stored: "short" }), {
    variant: "classic",
    remember: true,
  });
  assert.deepEqual(decideFirstRunVariant({ ...base, forced: null, stored: "classic" }), {
    variant: "classic",
    remember: true,
  });
});

test("decideFirstRunVariant: with the share at 0 nobody is randomized and nothing is remembered", () => {
  assert.deepEqual(
    decideFirstRunVariant({ forced: null, stored: null, sharePercent: 0, random: 0 }),
    { variant: "classic", remember: false },
  );
});

test("decideFirstRunVariant: with a share, a new visitor is randomized by it and remembered", () => {
  const input = { forced: null, stored: null, sharePercent: 40 };
  assert.deepEqual(decideFirstRunVariant({ ...input, random: 0.39 }), {
    variant: "short",
    remember: true,
  });
  assert.deepEqual(decideFirstRunVariant({ ...input, random: 0.4 }), {
    variant: "classic",
    remember: true,
  });
});

test("sharePercentFromConfig: reads the public route's answer and ignores anything else", () => {
  assert.equal(sharePercentFromConfig({ shortFirstRun: { share: 50 } }), 50);
  assert.equal(sharePercentFromConfig({ shortFirstRun: { share: 250 } }), 100);
  assert.equal(sharePercentFromConfig({ shortFirstRun: { share: -4 } }), 0);
  assert.equal(sharePercentFromConfig({ shortFirstRun: { share: "50" } }), 0);
  assert.equal(sharePercentFromConfig({}), 0);
  assert.equal(sharePercentFromConfig(null), 0);
});

test("variantFromSearch: reads ?first_run= and ignores anything else", () => {
  assert.equal(variantFromSearch("?first_run=short"), "short");
  assert.equal(variantFromSearch("?utm_source=fb&first_run=classic"), "classic");
  assert.equal(variantFromSearch("?first_run=other"), null);
  assert.equal(variantFromSearch(""), null);
});

test("parseFirstRunCookie and isFirstRunVariant: only the two known variants pass", () => {
  assert.equal(parseFirstRunCookie("short"), "short");
  assert.equal(parseFirstRunCookie("SHORT"), null);
  assert.equal(parseFirstRunCookie(undefined), null);
  assert.equal(isFirstRunVariant("classic"), true);
  assert.equal(isFirstRunVariant(7), false);
});
