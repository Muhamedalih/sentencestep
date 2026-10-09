// Run with `npm run test:feedback`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { buildAppRatingRecord, MAX_RATING_COMMENT_LENGTH } from "./rating-record";

const base = {
  rating: 5,
  comment: "  Great app  ",
  lessonId: "normal-1",
  mode: "normal",
  locale: "ar",
  anonId: "8cb48835-7b7d-47fb-893b-c53345bcf0fa",
};

test("a guest's rating keeps what they wrote, trimmed, and has no account", () => {
  const record = buildAppRatingRecord(base, null);
  assert.ok(record);
  assert.equal(record.rating, 5);
  assert.equal(record.comment, "Great app");
  assert.equal(record.user_type, "guest");
  assert.equal(record.user_id, null);
  assert.equal(record.contact_email, null);
  assert.equal(record.locale, "ar");
  assert.equal(record.anon_id, base.anonId);
});

test("a guest can leave an email to be answered at; it is lower-cased", () => {
  const record = buildAppRatingRecord({ ...base, contactEmail: "  Sara@Example.COM " }, null);
  assert.equal(record?.contact_email, "sara@example.com");
});

test("a guest's email that isn't an address is dropped, not stored", () => {
  for (const bad of ["", "   ", "not-an-email", "a@b", "two words@x.com"]) {
    assert.equal(buildAppRatingRecord({ ...base, contactEmail: bad }, null)?.contact_email, null);
  }
});

test("a member's reply address is their account email, never what the browser sent", () => {
  const record = buildAppRatingRecord(
    { ...base, contactEmail: "someone-else@example.com" },
    { id: "user-1", email: "Me@Example.com" },
  );
  assert.equal(record?.user_type, "member");
  assert.equal(record?.user_id, "user-1");
  assert.equal(record?.contact_email, "me@example.com");
});

test("the rating is rounded, and anything outside 1 to 5 is refused", () => {
  assert.equal(buildAppRatingRecord({ ...base, rating: 4.6 }, null)?.rating, 5);
  assert.equal(buildAppRatingRecord({ ...base, rating: 3.4 }, null)?.rating, 3);
  for (const bad of [0, 0.4, 5.5, 6, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(buildAppRatingRecord({ ...base, rating: bad }, null), null, String(bad));
  }
});

test("long text is cut to what the table allows", () => {
  const record = buildAppRatingRecord(
    {
      ...base,
      comment: "x".repeat(MAX_RATING_COMMENT_LENGTH + 500),
      lessonId: "l".repeat(300),
      mode: "m".repeat(300),
      anonId: "a".repeat(300),
    },
    null,
  );
  assert.equal(record?.comment?.length, MAX_RATING_COMMENT_LENGTH);
  assert.equal(record?.lesson_id?.length, 100);
  assert.equal(record?.mode?.length, 40);
  assert.equal(record?.anon_id?.length, 100);
});

test("no locale means the un-prefixed English default", () => {
  assert.equal(buildAppRatingRecord({ ...base, locale: null }, null)?.locale, "en");
});
