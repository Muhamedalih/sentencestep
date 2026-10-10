// Run with `npm run test:feedback`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MAX_DISPLAY_SECONDS,
  PUBLIC_REVIEWS_MAX,
  SHORT_COMMENT_CHARS,
  autoDisplaySeconds,
  nextReviewIndex,
  parseDisplaySeconds,
  parseReviewsResponse,
  resolveDisplaySeconds,
  textDirection,
  toReviewItems,
} from "./reviews-display";

test("autoDisplaySeconds: a short comment is 1 second, a longer one 2", () => {
  assert.equal(autoDisplaySeconds("حلو اوي"), 1);
  assert.equal(autoDisplaySeconds("x".repeat(SHORT_COMMENT_CHARS)), 1);
  assert.equal(autoDisplaySeconds("x".repeat(SHORT_COMMENT_CHARS + 1)), 2);
  assert.equal(autoDisplaySeconds(`  ${"x".repeat(SHORT_COMMENT_CHARS)}  `), 1);
});

test("resolveDisplaySeconds: an admin's number wins, otherwise the automatic time", () => {
  assert.equal(resolveDisplaySeconds("short", 7), 7);
  assert.equal(resolveDisplaySeconds("short", null), 1);
  assert.equal(resolveDisplaySeconds("x".repeat(100), undefined), 2);
});

test("resolveDisplaySeconds: a stored number outside 1 to 30 is held to it, and a non-number is ignored", () => {
  assert.equal(resolveDisplaySeconds("short", 0), 1);
  assert.equal(resolveDisplaySeconds("short", 999), MAX_DISPLAY_SECONDS);
  assert.equal(resolveDisplaySeconds("short", 2.5), 1);
  assert.equal(resolveDisplaySeconds("short", Number.NaN), 1);
});

test("parseDisplaySeconds: empty means automatic, a whole number 1 to 30 is kept", () => {
  for (const empty of [null, undefined, "", "   "]) {
    assert.deepEqual(parseDisplaySeconds(empty), { ok: true, value: null }, String(empty));
  }
  assert.deepEqual(parseDisplaySeconds("5"), { ok: true, value: 5 });
  assert.deepEqual(parseDisplaySeconds(" 12 "), { ok: true, value: 12 });
  assert.deepEqual(parseDisplaySeconds(1), { ok: true, value: 1 });
  assert.deepEqual(parseDisplaySeconds(30), { ok: true, value: 30 });
});

test("parseDisplaySeconds: anything else is refused with a message", () => {
  for (const bad of ["0", "31", "-3", "2.5", "abc", "1e1", 0, 31, 2.5, Number.NaN, {}, [], true]) {
    const result = parseDisplaySeconds(bad);
    assert.equal(result.ok, false, String(bad));
    if (!result.ok) assert.match(result.error, /1 to 30/);
  }
});

const rating = (id: string, comment: string, displaySeconds: number | null = null, stars = 5) => ({
  id,
  rating: stars,
  comment,
  displaySeconds,
});

test("toReviewItems: keeps only ratings with words, each with its resolved seconds", () => {
  const items = toReviewItems([
    rating("a", "حلو"),
    rating("b", ""),
    rating("c", "   "),
    rating("d", "x".repeat(100)),
    rating("e", "pinned", 9),
  ]);
  assert.deepEqual(
    items.map((i) => [i.id, i.seconds]),
    [
      ["a", 1],
      ["d", 2],
      ["e", 9],
    ],
  );
});

test("toReviewItems: no more than the cap, and it is ten", () => {
  assert.equal(PUBLIC_REVIEWS_MAX, 10);
  const many = Array.from({ length: PUBLIC_REVIEWS_MAX + 4 }, (_, n) => rating(`r${n}`, "ok"));
  const items = toReviewItems(many);
  assert.equal(items.length, PUBLIC_REVIEWS_MAX);
  // the first ones (the newest, as the query orders them) are the ones kept
  assert.equal(items[0]!.id, "r0");
  assert.equal(items.at(-1)!.id, `r${PUBLIC_REVIEWS_MAX - 1}`);
});

test("toReviewItems: trims the comment and drops a rating whose stars aren't 1 to 5", () => {
  const items = toReviewItems([
    rating("a", "  nice  "),
    rating("b", "bad", null, 0),
    rating("c", "bad", null, 6),
  ]);
  assert.deepEqual(items, [{ id: "a", rating: 5, comment: "nice", seconds: 1 }]);
});

test("toReviewItems: nothing approved means nothing to show", () => {
  assert.deepEqual(toReviewItems([]), []);
});

test("nextReviewIndex: moves on and wraps to the first after the last", () => {
  assert.equal(nextReviewIndex(0, 3), 1);
  assert.equal(nextReviewIndex(2, 3), 0);
  assert.equal(nextReviewIndex(0, 1), 0);
  assert.equal(nextReviewIndex(0, 0), 0);
});

test("parseReviewsResponse: well-formed reviews come through, with their seconds held to 1 to 30", () => {
  const items = parseReviewsResponse({
    reviews: [
      { id: "a", rating: 5, comment: "حلو", seconds: 4 },
      { id: "b", rating: 4, comment: "x".repeat(100), seconds: 999 },
      { id: "c", rating: 3, comment: "no seconds given" },
    ],
  });
  assert.deepEqual(
    items.map((i) => [i.id, i.rating, i.seconds]),
    [
      ["a", 5, 4],
      ["b", 4, 30],
      ["c", 3, 1],
    ],
  );
});

test("parseReviewsResponse: anything malformed is dropped, never shown", () => {
  for (const bad of [null, undefined, "x", 5, [], {}, { reviews: "no" }, { reviews: {} }]) {
    assert.deepEqual(parseReviewsResponse(bad), [], String(bad));
  }
  const items = parseReviewsResponse({
    reviews: [
      null,
      "x",
      { id: 1, rating: 5, comment: "id is not a string" },
      { id: "a", rating: 9, comment: "stars out of range" },
      { id: "b", rating: 4.5, comment: "stars not whole" },
      { id: "c", rating: 5, comment: "   " },
      { id: "d", rating: 5, comment: 42 },
      { id: "ok", rating: 5, comment: "fine" },
    ],
  });
  assert.deepEqual(
    items.map((i) => i.id),
    ["ok"],
  );
});

test("parseReviewsResponse: no more than the cap, and a very long comment is cut", () => {
  const many = Array.from({ length: PUBLIC_REVIEWS_MAX + 4 }, (_, n) => ({
    id: `r${n}`,
    rating: 5,
    comment: "ok",
  }));
  assert.equal(parseReviewsResponse({ reviews: many }).length, PUBLIC_REVIEWS_MAX);
  const [long] = parseReviewsResponse({
    reviews: [{ id: "a", rating: 5, comment: "x".repeat(5000) }],
  });
  assert.equal(long!.comment.length, 2000);
});

test("textDirection: right-to-left scripts read right to left, everything else left to right", () => {
  assert.equal(textDirection("حلو اوي"), "rtl");
  assert.equal(textDirection("שלום"), "rtl");
  assert.equal(textDirection("سلام"), "rtl");
  assert.equal(textDirection("Perfecto"), "ltr");
  assert.equal(textDirection("Çok güzel"), "ltr");
});

test("textDirection: digits, punctuation and emoji don't decide it, the first letter does", () => {
  assert.equal(textDirection("5 نجوم ممتاز"), "rtl");
  assert.equal(textDirection("!!! ممتاز"), "rtl");
  assert.equal(textDirection("😀 great app"), "ltr");
  assert.equal(textDirection("10/10 تطبيق"), "rtl");
  assert.equal(textDirection("ممتاز app"), "rtl");
  assert.equal(textDirection("app ممتاز"), "ltr");
});

test("textDirection: nothing to go on means left to right", () => {
  assert.equal(textDirection(""), "ltr");
  assert.equal(textDirection("123 !!!"), "ltr");
});
