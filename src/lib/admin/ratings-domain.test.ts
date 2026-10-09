// Run with `npm run test:admin`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { parseRatingsFilter, ratingsFilterParams, summarizeDistribution } from "./ratings-domain";

test("no query string means the default view: active, every star, everyone, page 1", () => {
  assert.deepEqual(parseRatingsFilter({}), {
    view: "active",
    stars: null,
    userType: null,
    commentOnly: false,
    page: 1,
  });
});

test("each filter is read from its query parameter", () => {
  assert.deepEqual(
    parseRatingsFilter({ view: "public", stars: "4", type: "guest", comments: "1", page: "3" }),
    { view: "public", stars: 4, userType: "guest", commentOnly: true, page: 3 },
  );
  assert.equal(parseRatingsFilter({ view: "archived" }).view, "archived");
  assert.equal(parseRatingsFilter({ type: "member" }).userType, "member");
});

test("nonsense in the query string falls back to the default instead of failing", () => {
  const filter = parseRatingsFilter({
    view: "everything",
    stars: "9",
    type: "robot",
    comments: "yes",
    page: "-2",
  });
  assert.deepEqual(filter, {
    view: "active",
    stars: null,
    userType: null,
    commentOnly: false,
    page: 1,
  });
  assert.equal(parseRatingsFilter({ stars: "2.5" }).stars, null);
  assert.equal(parseRatingsFilter({ page: "abc" }).page, 1);
});

test("a repeated parameter uses its first value", () => {
  assert.equal(parseRatingsFilter({ stars: ["5", "1"] }).stars, 5);
});

test("the filter round-trips through its query-string form, leaving defaults out", () => {
  assert.deepEqual(ratingsFilterParams(parseRatingsFilter({})), {
    view: undefined,
    stars: undefined,
    type: undefined,
    comments: undefined,
  });
  const filter = parseRatingsFilter({
    view: "archived",
    stars: "1",
    type: "member",
    comments: "1",
  });
  assert.deepEqual(ratingsFilterParams(filter), {
    view: "archived",
    stars: "1",
    type: "member",
    comments: "1",
  });
});

test("the summary counts every star and averages to one decimal", () => {
  const summary = summarizeDistribution([
    { rating: 5, rating_count: 3 },
    { rating: 4, rating_count: 1 },
    { rating: 1, rating_count: 1 },
  ]);
  assert.deepEqual(summary.perStar, [1, 0, 0, 1, 3]);
  assert.equal(summary.count, 5);
  assert.equal(summary.average, 4); // (5*3 + 4 + 1) / 5
  assert.equal(
    summarizeDistribution([
      { rating: 5, rating_count: 2 },
      { rating: 4, rating_count: 1 },
    ]).average,
    4.7,
  );
});

test("no ratings means no average, not zero or NaN", () => {
  const summary = summarizeDistribution([]);
  assert.equal(summary.count, 0);
  assert.equal(summary.average, null);
  assert.deepEqual(summary.perStar, [0, 0, 0, 0, 0]);
});

test("a row outside 1 to 5 is ignored rather than corrupting the figures", () => {
  const summary = summarizeDistribution([
    { rating: 0, rating_count: 9 },
    { rating: 6, rating_count: 9 },
    { rating: 3, rating_count: 2 },
  ]);
  assert.equal(summary.count, 2);
  assert.equal(summary.average, 3);
});
