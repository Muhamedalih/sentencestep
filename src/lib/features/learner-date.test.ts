import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { localISODateInTimeZone } from "@/lib/features/learner-date";

describe("localISODateInTimeZone", () => {
  // 22:30 UTC on 15 March — already the 16th in Riyadh (UTC+3), still the 15th in New York.
  const instant = new Date("2026-03-15T22:30:00Z");

  it("returns the learner's own calendar date, not the server's", () => {
    assert.equal(localISODateInTimeZone("Asia/Riyadh", instant), "2026-03-16");
    assert.equal(localISODateInTimeZone("America/New_York", instant), "2026-03-15");
    assert.equal(localISODateInTimeZone("UTC", instant), "2026-03-15");
  });

  it("returns null for a missing or unknown zone so the caller falls back to the browser", () => {
    assert.equal(localISODateInTimeZone(undefined, instant), null);
    assert.equal(localISODateInTimeZone(null, instant), null);
    assert.equal(localISODateInTimeZone("", instant), null);
    assert.equal(localISODateInTimeZone("Not/AZone", instant), null);
  });

  it("rejects values that are not shaped like an IANA name", () => {
    assert.equal(localISODateInTimeZone("Asia/Riyadh; drop table", instant), null);
    assert.equal(localISODateInTimeZone("x".repeat(65), instant), null);
  });
});
