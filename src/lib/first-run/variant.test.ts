import { test } from "node:test";
import assert from "node:assert/strict";

import {
  FIRST_RUN_SHORT_SHARE,
  assignFirstRunVariant,
  isFirstRunVariant,
  parseFirstRunCookie,
  variantFromSearch,
} from "./variant";

test("assignFirstRunVariant: the share of visitors below the cut-off get the short first run", () => {
  assert.equal(assignFirstRunVariant(0), "short");
  assert.equal(assignFirstRunVariant(FIRST_RUN_SHORT_SHARE - 0.001), "short");
  assert.equal(assignFirstRunVariant(FIRST_RUN_SHORT_SHARE), "classic");
  assert.equal(assignFirstRunVariant(0.999), "classic");
});

test("assignFirstRunVariant: a share of 0 or 1 gives everyone the same variant", () => {
  for (const random of [0, 0.25, 0.5, 0.75, 0.999]) {
    assert.equal(assignFirstRunVariant(random, 0), "classic");
    assert.equal(assignFirstRunVariant(random, 1), "short");
  }
});

test("assignFirstRunVariant: the split is close to the share over many visitors", () => {
  let short = 0;
  const visitors = 10_000;
  for (let index = 0; index < visitors; index++) {
    if (assignFirstRunVariant((index + 0.5) / visitors, 0.3) === "short") short++;
  }
  assert.equal(short, 3000);
});

test("variantFromSearch: reads ?first_run= and ignores anything else", () => {
  assert.equal(variantFromSearch("?first_run=short"), "short");
  assert.equal(variantFromSearch("?utm_source=fb&first_run=classic"), "classic");
  assert.equal(variantFromSearch("?first_run=other"), null);
  assert.equal(variantFromSearch("?first_run="), null);
  assert.equal(variantFromSearch(""), null);
});

test("parseFirstRunCookie and isFirstRunVariant: only the two known variants pass", () => {
  assert.equal(parseFirstRunCookie("short"), "short");
  assert.equal(parseFirstRunCookie("classic"), "classic");
  assert.equal(parseFirstRunCookie("SHORT"), null);
  assert.equal(parseFirstRunCookie(""), null);
  assert.equal(parseFirstRunCookie(undefined), null);
  assert.equal(parseFirstRunCookie(null), null);
  assert.equal(isFirstRunVariant("short"), true);
  assert.equal(isFirstRunVariant(7), false);
});
