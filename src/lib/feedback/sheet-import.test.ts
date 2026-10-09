// Run with `npm run test:feedback`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  filterNewRatings,
  parseCsv,
  parseSheetTimestamp,
  ratingKey,
  rowsToRatings,
} from "./sheet-import";

test("parseCsv: quoted fields keep commas, doubled quotes and line breaks", () => {
  const rows = parseCsv('a,"b, c","say ""hi""","line1\nline2"\r\nd,e,f,g\n');
  assert.deepEqual(rows, [
    ["a", "b, c", 'say "hi"', "line1\nline2"],
    ["d", "e", "f", "g"],
  ]);
});

test("parseCsv: drops a leading BOM and blank lines, and keeps Arabic text and empty cells", () => {
  const rows = parseCsv(
    "\uFEFF09/10/2026 21:41:03,5,حلو اوي,normal-1\n\n,,,\n10/10/2026 10:00:00,4,,story-80\n",
  );
  assert.deepEqual(rows, [
    ["09/10/2026 21:41:03", "5", "حلو اوي", "normal-1"],
    ["10/10/2026 10:00:00", "4", "", "story-80"],
  ]);
});

test("parseSheetTimestamp: day/month/year in the given offset, as a UTC instant", () => {
  assert.equal(parseSheetTimestamp("09/10/2026 20:42:55", "+03:00"), "2026-10-09T17:42:55.000Z");
  assert.equal(parseSheetTimestamp("9/1/2026 0:05:00", "+00:00"), "2026-01-09T00:05:00.000Z");
  assert.equal(parseSheetTimestamp("09/10/2026", "+03:00"), "2026-10-08T21:00:00.000Z");
});

test("parseSheetTimestamp: month-first, impossible dates and bad offsets are refused", () => {
  assert.equal(parseSheetTimestamp("10/13/2026 10:00:00", "+03:00"), null);
  assert.equal(parseSheetTimestamp("31/02/2026 10:00:00", "+03:00"), null);
  assert.equal(parseSheetTimestamp("yesterday", "+03:00"), null);
  assert.equal(parseSheetTimestamp("09/10/2026 20:42:55", "Baghdad"), null);
});

const HEADER = [
  "Timestamp",
  "Rating",
  "Comment",
  "LessonId",
  "Mode",
  "Locale",
  "UserType",
  "AnonId",
];

test("rowsToRatings: maps the sheet's columns, skipping a header row", () => {
  const { records, skipped } = rowsToRatings(
    [
      HEADER,
      ["09/10/2026 21:41:03", "5", " حلو اوي ", "normal-1", "normal", "ar", "member", "82236baf"],
      ["09/10/2026 21:45:08", "4", "", "story-80", "stories", "ar", "guest", "9bd527dd"],
    ],
    "+03:00",
  );
  assert.deepEqual(skipped, []);
  assert.equal(records.length, 2);
  assert.deepEqual(records[0], {
    rating: 5,
    comment: "حلو اوي",
    lesson_id: "normal-1",
    mode: "normal",
    locale: "ar",
    user_type: "member",
    anon_id: "82236baf",
    status: "read",
    created_at: "2026-10-09T18:41:03.000Z",
    updated_at: "2026-10-09T18:41:03.000Z",
  });
  assert.equal(records[1]!.user_type, "guest");
  assert.equal(records[1]!.comment, "");
});

test("rowsToRatings: works without a header row too", () => {
  const { records } = rowsToRatings(
    [["09/10/2026 21:41:03", "5", "", "normal-1", "normal", "ar", "guest", "x"]],
    "+03:00",
  );
  assert.equal(records.length, 1);
});

test("rowsToRatings: a row it can't trust is skipped with its line number, not guessed at", () => {
  const { records, skipped } = rowsToRatings(
    [
      HEADER,
      ["09/10/2026 21:41:03", "7", "", "n", "n", "ar", "guest", "a"],
      ["not a date", "5", "", "n", "n", "ar", "guest", "b"],
      ["09/10/2026 21:41:03", "5", "", "n", "n", "ar", "guest", "c"],
    ],
    "+03:00",
  );
  assert.equal(records.length, 1);
  assert.deepEqual(
    skipped.map((s) => s.line),
    [2, 3],
  );
});

test("rowsToRatings: a missing locale is English and an unknown user type is a guest", () => {
  const { records } = rowsToRatings(
    [["09/10/2026 21:41:03", "3", "", "n", "n", "", "visitor", "a"]],
    "+03:00",
  );
  assert.equal(records[0]!.locale, "en");
  assert.equal(records[0]!.user_type, "guest");
});

test("filterNewRatings: ratings already stored, or repeated in the file, are not added again", () => {
  const { records } = rowsToRatings(
    [
      ["09/10/2026 21:41:03", "5", "", "n", "n", "ar", "guest", "a"],
      ["09/10/2026 21:42:00", "4", "", "n", "n", "ar", "guest", "b"],
      ["09/10/2026 21:42:00", "4", "", "n", "n", "ar", "guest", "b"],
      ["09/10/2026 21:43:00", "3", "", "n", "n", "ar", "guest", "c"],
    ],
    "+03:00",
  );
  // The database hands timestamps back in its own format; the key must still match.
  const existing = new Set([ratingKey("a", "2026-10-09T18:41:03+00:00")]);
  const fresh = filterNewRatings(records, existing);
  assert.deepEqual(
    fresh.map((r) => r.anon_id),
    ["b", "c"],
  );
  assert.equal(
    filterNewRatings(fresh, new Set(fresh.map((r) => ratingKey(r.anon_id, r.created_at)))).length,
    0,
  );
});
