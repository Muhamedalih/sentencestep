import assert from "node:assert/strict";
import test from "node:test";

import { parseTodayTest } from "@/lib/today/run-state";

const raw = (value: unknown) => JSON.stringify(value);

test("a stored test result is read back only for the day it was taken", () => {
  const stored = raw({ date: "2026-10-24", clean: 2, total: 3 });
  assert.deepEqual(parseTodayTest(stored, "2026-10-24"), { clean: 2, total: 3 });
  assert.equal(parseTodayTest(stored, "2026-10-25"), null);
});

test("nothing stored, unreadable text, or figures that make no sense give no result", () => {
  assert.equal(parseTodayTest(null, "2026-10-24"), null);
  assert.equal(parseTodayTest("{not json", "2026-10-24"), null);
  assert.equal(parseTodayTest(raw(null), "2026-10-24"), null);
  const bad = (clean: unknown, total: unknown) =>
    parseTodayTest(raw({ date: "2026-10-24", clean, total }), "2026-10-24");
  assert.equal(bad(4, 3), null);
  assert.equal(bad(-1, 3), null);
  assert.equal(bad(0, 0), null);
  assert.equal(bad(1.5, 3), null);
  assert.equal(bad("2", 3), null);
  assert.deepEqual(bad(0, 3), { clean: 0, total: 3 });
});
