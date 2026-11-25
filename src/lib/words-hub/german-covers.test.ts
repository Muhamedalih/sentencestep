import assert from "node:assert/strict";
import test from "node:test";

import { hasCoverScene } from "@/components/words/word-cover-art";
import { englishTopicTitle } from "@/lib/english-topic-title";
import { hasSpineColor, spineColor } from "@/lib/words-banner/colors";

/** The 24 German word-list topics (scripts/german/wordlists): each is the twin of an English topic and wears its drawing and book colour. */
const GERMAN_TITLES = [
  "Familie",
  "Farben",
  "Tiere",
  "Freundschaft",
  "Reisen",
  "Gesundheit",
  "Politik",
  "Finanzen",
  "Technologie",
  "Essen",
  "Haus",
  "Kleidung",
  "Einkaufen",
  "Wetter",
  "Arbeit",
  "Umwelt",
  "Bildung",
  "Medien",
  "Körper",
  "Verkehr",
  "Sport",
  "Gefühle",
  "Recht",
  "Wissenschaft",
];

test("every German topic has the drawing and the book colour of its English twin", () => {
  for (const title of GERMAN_TITLES) {
    assert.ok(hasCoverScene(title), `${title} has no drawing`);
    assert.ok(hasSpineColor(title), `${title} has no book colour`);
    assert.equal(spineColor(title, 1), spineColor(englishTopicTitle(title), 1));
  }
  assert.equal(new Set(GERMAN_TITLES.map(englishTopicTitle)).size, GERMAN_TITLES.length);
});

test("an English or unknown title comes back unchanged", () => {
  assert.equal(englishTopicTitle("Family"), "Family");
  assert.equal(englishTopicTitle("Something new"), "Something new");
});
