// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import type { EmailUsageStore } from "@/lib/email/usage";
import { createWarmupBudget, warmupDay, warmupLimit } from "./warmup";

test("warmup: the daily room grows with the days since the first send", () => {
  assert.equal(warmupLimit(1), 50);
  assert.equal(warmupLimit(2), 50);
  assert.equal(warmupLimit(3), 100);
  assert.equal(warmupLimit(5), 100);
  assert.equal(warmupLimit(6), 150);
  assert.equal(warmupLimit(9), 150);
  assert.equal(warmupLimit(10), 250);
  assert.equal(warmupLimit(14), 250);
  assert.equal(warmupLimit(15), 350);
  assert.equal(warmupLimit(21), 350);
  assert.equal(warmupLimit(22), 500);
  assert.equal(warmupLimit(400), 500);
});

test("warmup: before anything was sent, and for a nonsense day, it is the smallest step", () => {
  assert.equal(warmupLimit(0), 50);
  assert.equal(warmupLimit(-3), 50);
});

test("warmup: the first sending day is day 1, the next day is day 2", () => {
  assert.equal(warmupDay(null, "2026-11-10"), 1);
  assert.equal(warmupDay("2026-11-10", "2026-11-10"), 1);
  assert.equal(warmupDay("2026-11-10", "2026-11-11"), 2);
  assert.equal(warmupDay("2026-11-10", "2026-12-01"), 22);
  assert.equal(warmupDay("2026-11-10", "2026-11-01"), 1);
});

test("warmup: the budget reads the first day once it exists and remembers it", async () => {
  let lookups = 0;
  let first: string | null = null;
  const store = {
    async firstPeriod() {
      lookups += 1;
      return first;
    },
  } as unknown as EmailUsageStore;
  let today = new Date("2026-11-10T08:00:00Z");
  const room = createWarmupBudget(store, () => today);

  assert.equal(await room(), 50);
  first = "2026-11-10";
  today = new Date("2026-11-20T08:00:00Z");
  assert.equal(await room(), 250);
  const before = lookups;
  today = new Date("2026-12-05T08:00:00Z");
  assert.equal(await room(), 500);
  assert.equal(lookups, before);
});
