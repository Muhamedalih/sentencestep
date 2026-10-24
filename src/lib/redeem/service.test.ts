import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { AgentForBatch } from "./batch";
import { checkSymbol, formatCode, normalizeCode } from "./code";
import { hashAddress, hashCode } from "./generate";
import { issueBatch, redeemForLearner } from "./service";
import type {
  CreateBatchArgs,
  CreateBatchRpcResult,
  RedeemCalls,
  RedeemRpcResult,
} from "./service";

const PEPPER = "p".repeat(40);
const NOW = new Date("2026-11-01T12:00:00.000Z");

/** A real code, as a learner would type it: a body with its true check symbol. */
function realCode(): string {
  const body = "ABCDEFGHJKMNPQR";
  return body + checkSymbol(body);
}

function fakeCalls(patch: Partial<RedeemCalls> = {}) {
  const seen: { redeem: unknown[]; batch: CreateBatchArgs[] } = { redeem: [], batch: [] };
  const calls: RedeemCalls = {
    async redeemCode(args) {
      seen.redeem.push(args);
      return { result: "unknown" };
    },
    async createBatch(args) {
      seen.batch.push(args);
      return { result: "created", batch_id: "batch-1", batch_number: 7 };
    },
    ...patch,
  };
  return { calls, seen };
}

const redeemWith = (result: RedeemRpcResult) => fakeCalls({ redeemCode: async () => result }).calls;

describe("redeemForLearner", () => {
  const input = {
    userId: "u1",
    rawCode: formatCode(realCode()),
    country: "eg",
    address: "203.0.113.9",
  };

  it("turns a typo away without touching the database or counting an attempt", async () => {
    const { calls, seen } = fakeCalls();
    const outcome = await redeemForLearner(
      { ...input, rawCode: "ABCD-EFGH" },
      { pepper: PEPPER, calls },
    );
    assert.deepEqual(outcome, { status: "bad_format", reason: "length" });
    assert.equal(seen.redeem.length, 0);
  });

  it("sends the learner's id, the hash of the canonical code and a hashed address, never the code", async () => {
    const { calls, seen } = fakeCalls();
    await redeemForLearner(
      { ...input, rawCode: ` ${formatCode(realCode()).toLowerCase()} ` },
      { pepper: PEPPER, calls },
    );
    assert.deepEqual(seen.redeem, [
      {
        userId: "u1",
        codeHash: hashCode(realCode(), PEPPER),
        country: "eg",
        ipHash: hashAddress("203.0.113.9", PEPPER),
      },
    ]);
    assert.ok(!JSON.stringify(seen.redeem).includes(realCode()));
    assert.ok(!JSON.stringify(seen.redeem).includes("203.0.113.9"));
  });

  it("sends no address hash when the address is unknown", async () => {
    const { calls, seen } = fakeCalls();
    await redeemForLearner({ ...input, address: "unknown" }, { pepper: PEPPER, calls });
    assert.equal((seen.redeem[0] as { ipHash: unknown }).ipHash, null);
  });

  it("is unavailable, and asks nothing, without a long enough secret", async () => {
    for (const pepper of [undefined, "", "short"]) {
      const { calls, seen } = fakeCalls();
      assert.deepEqual(await redeemForLearner(input, { pepper, calls }), { status: "unavailable" });
      assert.equal(seen.redeem.length, 0);
    }
  });

  it("reports a redeemed code with its days and end date", async () => {
    const outcome = await redeemForLearner(input, {
      pepper: PEPPER,
      calls: redeemWith({
        result: "redeemed",
        days: 90,
        premium_period_end: "2027-02-01T12:00:00.000Z",
        extended_existing: true,
      }),
    });
    assert.deepEqual(outcome, {
      status: "redeemed",
      days: 90,
      premiumUntil: "2027-02-01T12:00:00.000Z",
      extendedExisting: true,
    });
  });

  it("maps every other answer of the database", async () => {
    const cases: [RedeemRpcResult, unknown][] = [
      [
        { result: "used_by_you", premium_period_end: "2027-02-01T00:00:00.000Z" },
        { status: "already_yours", premiumUntil: "2027-02-01T00:00:00.000Z" },
      ],
      [{ result: "used_by_you" }, { status: "already_yours", premiumUntil: null }],
      [{ result: "unlimited" }, { status: "unlimited" }],
      [{ result: "unknown" }, { status: "unknown" }],
      [{ result: "used" }, { status: "used" }],
      [{ result: "voided" }, { status: "voided" }],
      [{ result: "expired" }, { status: "expired" }],
      [
        { result: "throttled", retry_after_seconds: 240 },
        { status: "throttled", retryAfterSeconds: 240 },
      ],
      [{ result: "throttled" }, { status: "throttled", retryAfterSeconds: 60 }],
      [{ result: "user_not_found" }, { status: "unavailable" }],
      [{ result: "bad_request" }, { status: "unavailable" }],
      [{ result: "redeemed" }, { status: "unavailable" }],
      [{ result: "something_new" as never }, { status: "unavailable" }],
    ];
    for (const [result, expected] of cases) {
      assert.deepEqual(
        await redeemForLearner(input, { pepper: PEPPER, calls: redeemWith(result) }),
        expected,
        JSON.stringify(result),
      );
    }
  });

  it("is unavailable, and reports the error, when the database call fails", async () => {
    const errors: unknown[] = [];
    const outcome = await redeemForLearner(input, {
      pepper: PEPPER,
      calls: fakeCalls({
        redeemCode: async () => {
          throw new Error("function public.redeem_code does not exist");
        },
      }).calls,
      onError: (error) => errors.push(error),
    });
    assert.deepEqual(outcome, { status: "unavailable" });
    assert.equal(errors.length, 1);
  });
});

describe("issueBatch", () => {
  const agent: AgentForBatch = {
    status: "active",
    maxOutstanding: 50,
    outstanding: 0,
    batchesBought: 2,
  };
  const base = {
    agentId: "agent-1",
    agent,
    items: [
      { planId: "1m" as const, quantity: 2, wholesaleCentsEach: 150 },
      { planId: "6m" as const, quantity: 1, wholesaleCentsEach: 500 },
    ],
    receivedCents: 800,
    validDays: 120,
    paymentMethod: "Binance Pay",
    paymentReference: " tx-9 ",
    note: "",
    createdBy: "admin-1",
  };

  it("hands the database only hashes, and returns the codes once on success", async () => {
    const { calls, seen } = fakeCalls();
    const result = await issueBatch(base, { pepper: PEPPER, calls, now: NOW });
    assert.ok(result.ok);
    if (!result.ok) return;

    assert.equal(result.batchNumber, 7);
    assert.equal(result.totalCodes, 3);
    assert.equal(result.totalCents, 800);
    assert.equal(result.excessCents, 0);
    assert.equal(result.validUntil, "2027-03-01T12:00:00.000Z");
    assert.deepEqual(
      result.codes.map((code) => [code.serial, code.planId, code.days]),
      [
        [1, "1m", 30],
        [2, "1m", 30],
        [3, "6m", 180],
      ],
    );

    const sent = seen.batch[0]!;
    assert.equal(sent.p_agent_id, "agent-1");
    assert.equal(sent.p_received_cents, 800);
    assert.equal(sent.p_payment_reference, "tx-9");
    assert.equal(sent.p_created_by, "admin-1");
    assert.equal(sent.p_codes.length, 3);
    for (const [index, issued] of result.codes.entries()) {
      const normalized = normalizeCode(issued.code);
      assert.ok(normalized.ok, "an issued code is a valid code");
      if (!normalized.ok) continue;
      const row = sent.p_codes[index]!;
      assert.equal(row.code_hash, hashCode(normalized.code, PEPPER));
      assert.equal(row.serial, issued.serial);
      assert.equal(row.plan_id, issued.planId);
      assert.equal(row.days, issued.days);
    }
    assert.equal(new Set(result.codes.map((code) => code.code)).size, 3);
    // Not one plain code travels to the database.
    const wire = JSON.stringify(sent);
    for (const issued of result.codes) {
      const normalized = normalizeCode(issued.code);
      if (normalized.ok) assert.ok(!wire.includes(normalized.code));
    }
  });

  it("applies the dealing rules before drawing a single code", async () => {
    const { calls, seen } = fakeCalls();
    const result = await issueBatch(
      { ...base, receivedCents: 799 },
      { pepper: PEPPER, calls, now: NOW },
    );
    assert.equal(result.ok, false);
    assert.equal(seen.batch.length, 0);
  });

  it("needs the secret and a payment method", async () => {
    const { calls, seen } = fakeCalls();
    assert.equal((await issueBatch(base, { pepper: undefined, calls, now: NOW })).ok, false);
    assert.equal(
      (await issueBatch({ ...base, paymentMethod: "  " }, { pepper: PEPPER, calls, now: NOW })).ok,
      false,
    );
    assert.equal(seen.batch.length, 0);
  });

  it("returns no code when the database refuses, with the reason", async () => {
    const cases: [CreateBatchRpcResult, RegExp][] = [
      [{ result: "agent_not_active" }, /active agent/],
      [{ result: "first_batch_too_big" }, /first order/],
      [{ result: "too_many_outstanding" }, /unsold/],
      [{ result: "underpaid" }, /pays first/],
      [{ result: "bad_validity" }, /30 to 365/],
      [{ result: "created" }, /could not be saved/],
    ];
    for (const [rpc, message] of cases) {
      const result = await issueBatch(base, {
        pepper: PEPPER,
        calls: fakeCalls({ createBatch: async () => rpc }).calls,
        now: NOW,
      });
      assert.equal(result.ok, false, rpc.result);
      if (!result.ok) assert.match(result.error, message, rpc.result);
      assert.ok(!("codes" in result));
    }
  });

  it("returns no code when the call itself fails", async () => {
    const errors: unknown[] = [];
    const result = await issueBatch(base, {
      pepper: PEPPER,
      calls: fakeCalls({
        createBatch: async () => {
          throw new Error("boom");
        },
      }).calls,
      now: NOW,
      onError: (error) => errors.push(error),
    });
    assert.equal(result.ok, false);
    assert.ok(!("codes" in result));
    assert.equal(errors.length, 1);
  });

  it("draws different codes every time", async () => {
    const first = await issueBatch(base, { pepper: PEPPER, calls: fakeCalls().calls, now: NOW });
    const second = await issueBatch(base, { pepper: PEPPER, calls: fakeCalls().calls, now: NOW });
    assert.ok(first.ok && second.ok);
    if (first.ok && second.ok) {
      const overlap = first.codes.filter((a) => second.codes.some((b) => b.code === a.code));
      assert.equal(overlap.length, 0);
    }
  });
});
