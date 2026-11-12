import assert from "node:assert/strict";
import test from "node:test";

import { faceLabel, facesStrings } from "@/lib/feedback/faces-strings";
import { SUPPORT_LOCALES } from "@/lib/i18n/locales";

const LOCALES = [null, ...SUPPORT_LOCALES] as const;

test("faceLabel names the face of a star count: 5 is the loved face, 1 the hated one", () => {
  const strings = facesStrings(null);
  assert.equal(faceLabel(strings, 5), "Love it");
  assert.equal(faceLabel(strings, 3), "It's okay");
  assert.equal(faceLabel(strings, 1), "Hate it");
});

test("faceLabel keeps a stray value inside the five faces", () => {
  const strings = facesStrings(null);
  assert.equal(faceLabel(strings, 0), "Hate it");
  assert.equal(faceLabel(strings, 9), "Love it");
  assert.equal(faceLabel(strings, 4.4), "Like it");
});

test("every language has five different face names and all the card's words", () => {
  for (const locale of LOCALES) {
    const strings = facesStrings(locale);
    assert.equal(strings.labels.length, 5, `${locale} labels`);
    assert.equal(new Set(strings.labels).size, 5, `${locale} labels are all different`);
    for (const [key, value] of Object.entries(strings)) {
      if (key === "labels") continue;
      assert.ok(typeof value === "string" && value.trim().length > 0, `${locale} ${key}`);
    }
  }
});

test("the card never talks about stars: it shows faces", () => {
  for (const locale of LOCALES) {
    const strings = facesStrings(locale);
    const words = [strings.subtitle, ...strings.labels].join(" ");
    assert.doesNotMatch(words, /star|نجم|estrella|yıldız/i, `${locale}`);
  }
});
