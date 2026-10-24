import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { summarizeAgent } from "./ledger";
import type { LedgerCode } from "./ledger";

const NOW = new Date("2026-11-30T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const iso = (ms: number) => new Date(ms).toISOString();

const code = (patch: Partial<LedgerCode> = {}): LedgerCode => ({
  status: "unused",
  batchStatus: "active",
  validUntil: iso(NOW.getTime() + 60 * DAY_MS),
  planId: "3m",
  wholesaleCents: 300,
  createdAt: iso(NOW.getTime() - 20 * DAY_MS),
  redeemedAt: null,
  ...patch,
});

const redeemed = (daysAfterIssue: number, patch: Partial<LedgerCode> = {}): LedgerCode =>
  code({
    status: "redeemed",
    redeemedAt: iso(NOW.getTime() - (20 - daysAfterIssue) * DAY_MS),
    ...patch,
  });

describe("summarizeAgent", () => {
  it("is empty and honest about it with no codes", () => {
    assert.deepEqual(summarizeAgent([], NOW), {
      issued: 0,
      redeemed: 0,
      voided: 0,
      expired: 0,
      outstanding: 0,
      wholesaleIssuedCents: 0,
      wholesaleRedeemedCents: 0,
      outstandingCents: 0,
      sellThrough: null,
      medianDaysToRedeem: null,
    });
  });

  it("counts each state and the money in each", () => {
    const summary = summarizeAgent(
      [
        redeemed(1),
        redeemed(2, { wholesaleCents: 150, planId: "1m" }),
        code(),
        code({ wholesaleCents: 500, planId: "6m" }),
        code({ status: "voided" }),
        code({ batchStatus: "voided" }),
        code({ validUntil: iso(NOW.getTime() - DAY_MS) }),
      ],
      NOW,
    );
    assert.equal(summary.issued, 7);
    assert.equal(summary.redeemed, 2);
    assert.equal(summary.voided, 2);
    assert.equal(summary.expired, 1);
    assert.equal(summary.outstanding, 2);
    assert.equal(summary.wholesaleIssuedCents, 300 + 150 + 300 + 500 + 300 + 300 + 300);
    assert.equal(summary.wholesaleRedeemedCents, 450);
    assert.equal(summary.outstandingCents, 800);
  });

  it("measures sell-through against what could be sold, leaving voided codes out", () => {
    const summary = summarizeAgent([redeemed(1), code(), code(), code({ status: "voided" })], NOW);
    assert.equal(summary.sellThrough, 1 / 3);
    assert.equal(summarizeAgent([code({ status: "voided" })], NOW).sellThrough, null);
  });

  it("gives a median time to redeem only from three redemptions", () => {
    assert.equal(summarizeAgent([redeemed(1), redeemed(5)], NOW).medianDaysToRedeem, null);
    assert.equal(
      summarizeAgent([redeemed(1), redeemed(5), redeemed(2)], NOW).medianDaysToRedeem,
      2,
    );
    assert.equal(
      summarizeAgent([redeemed(1), redeemed(5), redeemed(2), redeemed(4)], NOW).medianDaysToRedeem,
      3,
    );
  });
});
