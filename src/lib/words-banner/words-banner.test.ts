import assert from "node:assert/strict";
import test from "node:test";

import { hasSpineColor, spineColor } from "@/lib/words-banner/colors";
import { wordsBannerStrings } from "@/lib/words-banner/strings";
import { MAX_SPINES, summarizeBanner } from "@/lib/words-banner/summary";
import type { WordGroupSummary } from "@/types/word-lists";

/**
 * The banner at the top of the Words page: what it counts, which books stand on the shelf and which
 * one leans, which button it offers, and the words around it.
 */

function group(
  id: string,
  level: number,
  order: number,
  words: number,
  extra: Partial<WordGroupSummary> = {},
): WordGroupSummary {
  return {
    id,
    level,
    order,
    title: id[0]!.toUpperCase() + id.slice(1),
    titleAr: `ع-${id}`,
    isFree: false,
    wordCount: words,
    wordIds: Array.from({ length: words }, (_, i) => `${id}-${i + 1}`),
    ...extra,
  };
}

const ids = (group: WordGroupSummary, n: number) => group.wordIds.slice(0, n);

test("a learner who has not begun has nothing counted and no book on the shelf", () => {
  const summary = summarizeBanner([group("family", 1, 1, 5, { isFree: true })], [], false);
  assert.equal(summary.learned, 0);
  assert.equal(summary.going, 0);
  assert.deepEqual(summary.shelf, []);
  assert.equal(summary.leanId, null);
  assert.equal(summary.startId, "family");
});

test("words are counted across topics, and a topic is going until all its words are done", () => {
  const family = group("family", 1, 1, 4);
  const colors = group("colors", 1, 2, 3);
  const animals = group("animals", 1, 3, 5);
  const summary = summarizeBanner(
    [family, colors, animals],
    [...ids(family, 4), ...ids(colors, 1)],
    true,
  );
  assert.equal(summary.learned, 5);
  assert.equal(summary.going, 1, "only colors is begun and not finished");
  assert.deepEqual(
    summary.shelf.map((topic) => topic.id),
    ["family", "colors"],
  );
  assert.equal(summary.shelf.find((topic) => topic.id === "family")?.ratio, 1);
  assert.equal(summary.shelf.find((topic) => topic.id === "colors")?.ratio, 1 / 3);
});

test("the book studied last leans and stands last; the others keep the library's order", () => {
  const a = group("alpha", 1, 1, 3);
  const b = group("beta", 1, 2, 3);
  const c = group("gamma", 2, 1, 3);
  // The most recent word is beta's: beta leans and moves to the end.
  const done = [...ids(c, 1), ...ids(a, 1), ...ids(b, 1)];
  const summary = summarizeBanner([c, b, a], done, true);
  assert.equal(summary.leanId, "beta");
  assert.deepEqual(
    summary.shelf.map((topic) => topic.id),
    ["alpha", "gamma", "beta"],
    "library order (level, then order), the leaning book last",
  );
});

test("typing a word again later is what makes its topic the leaning one (the list is oldest first)", () => {
  const a = group("alpha", 1, 1, 3);
  const b = group("beta", 1, 2, 3);
  assert.equal(summarizeBanner([a, b], [...ids(b, 1), ...ids(a, 1)], true).leanId, "alpha");
  assert.equal(summarizeBanner([a, b], [...ids(a, 1), ...ids(b, 1)], true).leanId, "beta");
});

test("the shelf holds nine books, and the leaning one always stays on it", () => {
  const groups = Array.from({ length: 12 }, (_, i) =>
    group(`t${String(i).padStart(2, "0")}`, 1, i + 1, 2),
  );
  const done = groups.flatMap((g) => ids(g, 1));
  const summary = summarizeBanner(groups, done, true);
  assert.equal(summary.shelf.length, MAX_SPINES);
  assert.equal(summary.leanId, "t11", "the last word typed belongs to the last topic");
  assert.equal(summary.shelf.at(-1)?.id, "t11");
  assert.deepEqual(
    summary.shelf.slice(0, -1).map((topic) => topic.id),
    groups.slice(0, MAX_SPINES - 1).map((g) => g.id),
  );
});

test("words of topics that are not in the list (hidden passage lists) are not counted", () => {
  const family = group("family", 1, 1, 3);
  const summary = summarizeBanner(
    [family],
    ["passage-x-1", "passage-x-2", ...ids(family, 1)],
    true,
  );
  assert.equal(summary.learned, 1);
  assert.equal(summary.leanId, "family");
});

test("the button that starts a learner opens the first topic they can open and have not begun", () => {
  const free = group("family", 1, 1, 3, { isFree: true });
  const premium = group("colors", 1, 2, 3);
  const later = group("friendship", 2, 1, 3, { isFree: true });
  // Not premium: colors is locked, so it is family; once family is begun, the next free one is friendship.
  assert.equal(summarizeBanner([premium, later, free], [], false).startId, "family");
  assert.equal(summarizeBanner([premium, later, free], ids(free, 1), false).startId, "friendship");
  // Premium: every topic can be opened, so the library's first one.
  assert.equal(summarizeBanner([premium, later, free], [], true).startId, "family");
  assert.equal(summarizeBanner([premium, later, free], [...ids(free, 3)], true).startId, "colors");
  // Everything begun: nothing to start.
  assert.equal(summarizeBanner([free], ids(free, 1), true).startId, null);
});

test("every published topic has a book colour of its own, and a new topic takes its level's", () => {
  for (const title of [
    "Family",
    "Colors",
    "Animals",
    "Food",
    "House",
    "Clothes",
    "Body",
    "Transportation",
    "Friendship",
    "Travel",
    "Health",
    "Shopping",
    "Weather",
    "Work",
    "Sports",
    "Emotions",
    "Politics",
    "Finance",
    "Technology",
    "Environment",
    "Education",
    "Media",
    "Law",
    "Science",
  ]) {
    assert.ok(hasSpineColor(title), title);
    assert.match(spineColor(title, 1), /^#[0-9a-f]{6}$/i);
  }
  assert.equal(hasSpineColor("Gaming"), false);
  assert.equal(spineColor("Gaming", 2), "#3f6fb0");
  assert.equal(
    spineColor("toString", 3),
    "#5b4fa6",
    "a name from Object's prototype is not a colour",
  );
});

test("the Arabic chip says the number the way Arabic counts, and every language has every word", () => {
  const ar = wordsBannerStrings("ar");
  assert.equal(ar.going(0), "لم تبدأ موضوعًا بعد");
  assert.equal(ar.going(1), "موضوع واحد جارٍ");
  assert.equal(ar.going(2), "موضوعان جاريان");
  assert.equal(ar.going(9), "9 مواضيع جارية");
  assert.equal(ar.going(11), "11 موضوعًا جاريًا");
  for (const locale of [null, "ar", "es", "tr"] as const) {
    const s = wordsBannerStrings(locale);
    for (const text of [s.sectionLabel, s.learned, s.review, s.resume, s.start, s.shelfLabel]) {
      assert.ok(text.length > 0);
    }
    assert.ok(s.going(3).includes("3"));
    assert.ok(s.spineTitle("Name", 4, 20).includes("4 / 20"));
  }
  assert.equal(wordsBannerStrings(null).going(1), "1 topic going");
});
