import assert from "node:assert/strict";
import test from "node:test";

import { SUPPORT_LOCALES } from "@/lib/i18n/locales";
import { passagesBannerStrings } from "@/lib/passages/banner-strings";

/** The words of the banner at the top of the Passages list: every language has every line. */

test("every language has every line of the banner, filled in", () => {
  for (const locale of [null, ...SUPPORT_LOCALES]) {
    const strings = passagesBannerStrings(locale);
    for (const [key, value] of Object.entries(strings)) {
      assert.ok(value.trim().length > 0, `${locale ?? "en"}: ${key} is empty`);
    }
  }
});

test("a learner with no support language reads English", () => {
  assert.equal(passagesBannerStrings(null).start, "Start listening");
});

test("the three buttons differ, so a learner can tell begin, keep going and again apart", () => {
  for (const locale of [null, ...SUPPORT_LOCALES]) {
    const { start, resume, again } = passagesBannerStrings(locale);
    assert.equal(new Set([start, resume, again]).size, 3);
  }
});
