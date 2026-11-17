// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { checkBalanceChain, compareOperations, formatPounds } from "./balance";
import type { BalanceObservation } from "./balance";

const at = "2026-11-17T10:00:00.000Z";
const obs = (
  patch: Partial<BalanceObservation> & { transactionId: string },
): BalanceObservation => ({
  kind: "in",
  amountPiasters: null,
  feePiasters: null,
  balancePiasters: null,
  at,
  seenAt: at,
  ...patch,
});

test("operation numbers order by length, then as text", () => {
  assert.equal(compareOperations("025878179077", "025880002823") < 0, true);
  assert.equal(compareOperations("025900585759", "025880002823") > 0, true);
  assert.equal(compareOperations("99", "100") < 0, true);
  assert.equal(compareOperations("5", "5"), 0);
});

test("texts that follow from each other raise nothing, and the first balance is only a starting point", () => {
  const chain = [
    obs({ transactionId: "1", kind: "in", amountPiasters: 21_500, balancePiasters: 29_987 }),
    obs({ transactionId: "2", kind: "in", amountPiasters: 37_600, balancePiasters: 67_587 }),
    obs({
      transactionId: "3",
      kind: "out",
      amountPiasters: 2_000,
      feePiasters: 100,
      balancePiasters: 65_487,
    }),
  ];
  assert.deepEqual(checkBalanceChain(chain), []);
  assert.deepEqual(checkBalanceChain([chain[2]!]), []);
});

test("a balance that moved by more than the texts explain is reported with how much", () => {
  const chain = [
    obs({ transactionId: "1", kind: "in", amountPiasters: 10_000, balancePiasters: 30_000 }),
    obs({
      transactionId: "2",
      kind: "out",
      amountPiasters: 2_000,
      feePiasters: 100,
      balancePiasters: 27_000,
    }),
  ];
  const [step, ...rest] = checkBalanceChain(chain);
  assert.equal(rest.length, 0);
  assert.equal(step!.operation, "2");
  assert.equal(step!.after, "1");
  assert.equal(step!.expectedPiasters, 27_900);
  assert.equal(step!.diffPiasters, -900);
});

test("money in that no text announced shows as more than the texts explain", () => {
  const chain = [
    obs({ transactionId: "1", kind: "in", amountPiasters: 10_000, balancePiasters: 30_000 }),
    obs({
      transactionId: "2",
      kind: "out",
      amountPiasters: 2_000,
      feePiasters: 100,
      balancePiasters: 28_800,
    }),
  ];
  assert.equal(checkBalanceChain(chain)[0]!.diffPiasters, 900);
});

test("a text of a kind we do not read is flagged only when the balance moved, then the chain goes on from it", () => {
  const chain = [
    obs({ transactionId: "1", kind: "in", amountPiasters: 10_000, balancePiasters: 30_000 }),
    obs({ transactionId: "2", kind: "other", balancePiasters: 30_000 }),
    obs({ transactionId: "3", kind: "other", balancePiasters: 25_000 }),
    obs({
      transactionId: "4",
      kind: "out",
      amountPiasters: 1_000,
      feePiasters: 0,
      balancePiasters: 24_000,
    }),
  ];
  const steps = checkBalanceChain(chain);
  assert.deepEqual(
    steps.map((step) => step.operation),
    ["3"],
  );
  assert.equal(steps[0]!.diffPiasters, -5_000);
});

test("a transfer out whose text has no balance is carried into the next step", () => {
  const chain = [
    obs({ transactionId: "1", kind: "in", amountPiasters: 10_000, balancePiasters: 30_000 }),
    obs({
      transactionId: "2",
      kind: "out",
      amountPiasters: 2_000,
      feePiasters: 100,
      balancePiasters: null,
    }),
    obs({ transactionId: "3", kind: "in", amountPiasters: 5_000, balancePiasters: 32_900 }),
  ];
  assert.deepEqual(checkBalanceChain(chain), []);
});

test("the order of the list does not matter, only the operation numbers", () => {
  const chain = [
    obs({ transactionId: "2", kind: "in", amountPiasters: 5_000, balancePiasters: 35_000 }),
    obs({ transactionId: "1", kind: "in", amountPiasters: 10_000, balancePiasters: 30_000 }),
  ];
  assert.deepEqual(checkBalanceChain(chain), []);
});

test("pounds are shown with two decimals", () => {
  assert.equal(formatPounds(66_387), "663.87");
  assert.equal(formatPounds(-900), "-9.00");
});
