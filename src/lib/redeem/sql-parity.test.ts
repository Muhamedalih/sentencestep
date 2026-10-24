import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { PLAN_IDS } from "@/lib/billing/plans";

import {
  DEFAULT_AGENT_MAX_OUTSTANDING,
  FIRST_BATCH_MAX,
  IP_FAILURE_LIMITS,
  MAX_BATCH_SIZE,
  MAX_VALID_DAYS,
  MIN_VALID_DAYS,
  USER_FAILURE_LIMITS,
} from "./constants";

// The rules live twice on purpose: in TypeScript, where they can be read and tested, and in the
// database function, where they are enforced under a lock. This reads the migration and fails the
// day a number in one of them is changed without the other.

const sql = readFileSync(
  path.resolve(process.cwd(), "supabase/migrations/20250349000000_redeem_codes.sql"),
  "utf8",
);

const UNIT_MS: Record<string, number> = {
  minute: 60 * 1000,
  minutes: 60 * 1000,
  hour: 60 * 60 * 1000,
  hours: 60 * 60 * 1000,
};

function limitsFor(scope: "user" | "ip"): { windowMs: number; max: number }[] {
  const pattern = new RegExp(`\\('${scope}'::text, interval '(\\d+) (\\w+)', (\\d+)\\)`, "g");
  return [...sql.matchAll(pattern)].map((match) => ({
    windowMs: Number(match[1]) * UNIT_MS[match[2]!]!,
    max: Number(match[3]),
  }));
}

describe("the redeem_code limits match constants.ts", () => {
  it("per learner", () => {
    assert.deepEqual(limitsFor("user"), [...USER_FAILURE_LIMITS]);
  });

  it("per address", () => {
    assert.deepEqual(limitsFor("ip"), [...IP_FAILURE_LIMITS]);
  });
});

describe("the create_redeem_batch rules match constants.ts", () => {
  it("batch size, first order, and how long codes live", () => {
    assert.match(sql, new RegExp(`v_count < 1 or v_count > ${MAX_BATCH_SIZE}\\b`));
    assert.match(sql, new RegExp(`v_batches = 0 and v_count > ${FIRST_BATCH_MAX}\\b`));
    assert.match(sql, new RegExp(`code_count between 1 and ${MAX_BATCH_SIZE}\\b`));
    // The database allows a day of slack either side: its clock runs a moment after the server that built the date.
    assert.match(sql, new RegExp(`v_now \\+ interval '${MIN_VALID_DAYS - 1} days'`));
    assert.match(sql, new RegExp(`v_now \\+ interval '${MAX_VALID_DAYS + 1} days'`));
  });

  it("the default holding limit", () => {
    assert.match(
      sql,
      new RegExp(`max_outstanding integer not null default ${DEFAULT_AGENT_MAX_OUTSTANDING}\\b`),
    );
  });

  it("the plans a code can be for", () => {
    const listed = sql.match(/plan_id text not null check \(plan_id in \(([^)]*)\)\)/);
    assert.ok(listed, "plan_id check not found");
    const ids = [...listed![1]!.matchAll(/'(\w+)'/g)].map((match) => match[1]);
    assert.deepEqual(ids, [...PLAN_IDS]);
  });
});
