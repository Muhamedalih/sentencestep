import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { planBatch, wholesaleCentsFor } from "./batch";
import type { AgentForBatch, BatchRequest, WholesaleLadder } from "./batch";

const NOW = new Date("2026-11-01T12:00:00.000Z");

const agent = (patch: Partial<AgentForBatch> = {}): AgentForBatch => ({
  status: "active",
  maxOutstanding: 50,
  outstanding: 0,
  batchesBought: 2,
  ...patch,
});

const request = (patch: Partial<BatchRequest> = {}): BatchRequest => ({
  items: [{ planId: "3m", quantity: 10, wholesaleCentsEach: 300 }],
  receivedCents: 3000,
  validDays: 120,
  ...patch,
});

// An example only: the real ladder is the owner's to set.
const LADDER: WholesaleLadder = {
  "1m": [
    { minQuantity: 1, centsEach: 150 },
    { minQuantity: 20, centsEach: 130 },
  ],
  "3m": [
    { minQuantity: 1, centsEach: 300 },
    { minQuantity: 20, centsEach: 260 },
  ],
  "6m": [{ minQuantity: 1, centsEach: 520 }],
};

describe("wholesaleCentsFor", () => {
  it("takes the highest step the order reaches", () => {
    assert.equal(wholesaleCentsFor(LADDER, "1m", 1), 150);
    assert.equal(wholesaleCentsFor(LADDER, "1m", 19), 150);
    assert.equal(wholesaleCentsFor(LADDER, "1m", 20), 130);
    assert.equal(wholesaleCentsFor(LADDER, "1m", 150), 130);
    assert.equal(wholesaleCentsFor(LADDER, "6m", 80), 520);
  });

  it("is null when no step reaches the quantity", () => {
    assert.equal(wholesaleCentsFor(LADDER, "1m", 0), null);
    assert.equal(wholesaleCentsFor({ ...LADDER, "1m": [] }, "1m", 5), null);
  });

  it("does not depend on the order the steps are listed in", () => {
    const shuffled: WholesaleLadder = { ...LADDER, "1m": [...LADDER["1m"]].reverse() };
    assert.equal(wholesaleCentsFor(shuffled, "1m", 25), 130);
    assert.equal(wholesaleCentsFor(shuffled, "1m", 5), 150);
  });
});

describe("planBatch", () => {
  it("plans an ordinary batch and dates its end", () => {
    const plan = planBatch(agent(), request(), NOW);
    assert.equal(plan.ok, true);
    if (plan.ok) {
      assert.deepEqual(plan.lines, [
        { planId: "3m", days: 90, quantity: 10, wholesaleCentsEach: 300 },
      ]);
      assert.equal(plan.totalCodes, 10);
      assert.equal(plan.totalCents, 3000);
      assert.equal(plan.excessCents, 0);
      assert.equal(plan.validUntil, "2027-03-01T12:00:00.000Z");
    }
  });

  it("adds several plans together and reports any overpayment as an excess", () => {
    const plan = planBatch(
      agent(),
      request({
        items: [
          { planId: "1m", quantity: 4, wholesaleCentsEach: 150 },
          { planId: "6m", quantity: 2, wholesaleCentsEach: 500 },
        ],
        receivedCents: 1700,
      }),
      NOW,
    );
    assert.equal(plan.ok, true);
    if (plan.ok) {
      assert.equal(plan.totalCodes, 6);
      assert.equal(plan.totalCents, 1600);
      assert.equal(plan.excessCents, 100);
    }
  });

  it("makes the agent pay first: no credit, to the cent", () => {
    const plan = planBatch(agent(), request({ receivedCents: 2999 }), NOW);
    assert.equal(plan.ok, false);
    if (!plan.ok) assert.match(plan.error, /pays first/);
    assert.equal(planBatch(agent(), request({ receivedCents: 0 }), NOW).ok, false);
  });

  it("serves only an active agent", () => {
    for (const status of ["candidate", "paused", "ended"] as const) {
      assert.equal(planBatch(agent({ status }), request(), NOW).ok, false, status);
    }
  });

  it("keeps a first order small and lets the next ones grow", () => {
    const big = request({
      items: [{ planId: "1m", quantity: 6, wholesaleCentsEach: 150 }],
      receivedCents: 900,
    });
    assert.equal(planBatch(agent({ batchesBought: 0 }), big, NOW).ok, false);
    const five = request({
      items: [{ planId: "1m", quantity: 5, wholesaleCentsEach: 150 }],
      receivedCents: 750,
    });
    assert.equal(planBatch(agent({ batchesBought: 0 }), five, NOW).ok, true);
    assert.equal(planBatch(agent({ batchesBought: 1 }), big, NOW).ok, true);
  });

  it("stops an agent from holding more unsold codes than allowed", () => {
    assert.equal(planBatch(agent({ outstanding: 40 }), request(), NOW).ok, true);
    assert.equal(planBatch(agent({ outstanding: 41 }), request(), NOW).ok, false);
    assert.equal(planBatch(agent({ maxOutstanding: 5 }), request(), NOW).ok, false);
  });

  it("caps one batch at 200 codes", () => {
    const huge = request({
      items: [{ planId: "1m", quantity: 201, wholesaleCentsEach: 150 }],
      receivedCents: 201 * 150,
    });
    assert.equal(planBatch(agent({ maxOutstanding: 1000 }), huge, NOW).ok, false);
  });

  it("refuses a price far from the list price as a typo", () => {
    // 3m lists at 400 (tier A) and 600 (tier B): the floor is 200 and the ceiling is 600.
    assert.equal(
      planBatch(
        agent(),
        request({
          items: [{ planId: "3m", quantity: 1, wholesaleCentsEach: 199 }],
          receivedCents: 199,
        }),
        NOW,
      ).ok,
      false,
    );
    assert.equal(
      planBatch(
        agent(),
        request({
          items: [{ planId: "3m", quantity: 1, wholesaleCentsEach: 200 }],
          receivedCents: 200,
        }),
        NOW,
      ).ok,
      true,
    );
    assert.equal(
      planBatch(
        agent(),
        request({
          items: [{ planId: "3m", quantity: 1, wholesaleCentsEach: 601 }],
          receivedCents: 601,
        }),
        NOW,
      ).ok,
      false,
    );
    assert.equal(
      planBatch(
        agent(),
        request({
          items: [{ planId: "3m", quantity: 1, wholesaleCentsEach: 3.5 }],
          receivedCents: 4,
        }),
        NOW,
      ).ok,
      false,
    );
  });

  it("refuses empty, repeated, unknown or non-whole items", () => {
    assert.equal(planBatch(agent(), request({ items: [] }), NOW).ok, false);
    const twice = [
      { planId: "3m" as const, quantity: 1, wholesaleCentsEach: 300 },
      { planId: "3m" as const, quantity: 1, wholesaleCentsEach: 300 },
    ];
    assert.equal(planBatch(agent(), request({ items: twice, receivedCents: 600 }), NOW).ok, false);
    const unknown = [{ planId: "9m" as never, quantity: 1, wholesaleCentsEach: 300 }];
    assert.equal(planBatch(agent(), request({ items: unknown }), NOW).ok, false);
    for (const quantity of [0, -1, 1.5, Number.NaN]) {
      const items = [{ planId: "3m" as const, quantity, wholesaleCentsEach: 300 }];
      assert.equal(planBatch(agent(), request({ items }), NOW).ok, false, String(quantity));
    }
  });

  it("limits how long codes stay valid", () => {
    assert.equal(planBatch(agent(), request({ validDays: 29 }), NOW).ok, false);
    assert.equal(planBatch(agent(), request({ validDays: 30 }), NOW).ok, true);
    assert.equal(planBatch(agent(), request({ validDays: 365 }), NOW).ok, true);
    assert.equal(planBatch(agent(), request({ validDays: 366 }), NOW).ok, false);
    assert.equal(planBatch(agent(), request({ validDays: 90.5 }), NOW).ok, false);
  });
});
