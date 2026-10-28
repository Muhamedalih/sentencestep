// Run with `npm run test:library-open` (also part of `npm test`).

import { test } from "node:test";
import assert from "node:assert/strict";

import { libraryOpenFor } from "./open-rule";

test("an admin always opens the Library, whatever the permission says", () => {
  for (const giftOpen of [true, false]) {
    for (const isPremium of [true, false]) {
      assert.equal(libraryOpenFor({ isAdmin: true, giftOpen, isPremium }), true);
    }
  }
});

test("a subscriber opens it only while the permission is open for them", () => {
  assert.equal(libraryOpenFor({ isAdmin: false, giftOpen: true, isPremium: true }), true);
  assert.equal(libraryOpenFor({ isAdmin: false, giftOpen: false, isPremium: true }), false);
});

test("a learner without a subscription never opens it, even with the permission open", () => {
  assert.equal(libraryOpenFor({ isAdmin: false, giftOpen: true, isPremium: false }), false);
  assert.equal(libraryOpenFor({ isAdmin: false, giftOpen: false, isPremium: false }), false);
});
