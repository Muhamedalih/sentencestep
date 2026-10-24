// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  countsRow,
  foldSmallCountries,
  isWeakRegion,
  methodOfClick,
  outcomeOf,
  regionOf,
  sumCounts,
  tallyOrders,
  upgradeFunnel,
  upgradeFunnelRows,
} from "./funnel-readout";
import type { ReadoutOrder, UpgradeEvent } from "./funnel-readout";

const order = (overrides: Partial<ReadoutOrder> = {}): ReadoutOrder => ({
  reference_id: "ss_x",
  user_id: "u1",
  provider: "wayl",
  pricing_tier: "A",
  pricing_country: "iq",
  status: "expired",
  provider_payment_id: "link_1",
  price_usd_cents: 300,
  ...overrides,
});

test("outcomeOf: paid, to review, no link, waiting, left", () => {
  assert.equal(outcomeOf(order({ status: "fulfilled" })), "paid");
  assert.equal(outcomeOf(order({ status: "needs_review" })), "needs_review");
  assert.equal(outcomeOf(order({ status: "failed", provider_payment_id: null })), "no_link");
  assert.equal(outcomeOf(order({ status: "failed", provider_payment_id: "link_1" })), "left");
  assert.equal(outcomeOf(order({ status: "created", provider_payment_id: null })), "waiting");
  assert.equal(outcomeOf(order({ status: "pending" })), "waiting");
  assert.equal(outcomeOf(order({ status: "expired" })), "left");
  assert.equal(outcomeOf(order({ status: "cancelled" })), "left");
});

test("regionOf: the groups of the October reports, case and spaces ignored, null is unknown", () => {
  assert.equal(regionOf("iq"), "iraq");
  assert.equal(regionOf(" IQ "), "iraq");
  assert.equal(regionOf("sa"), "gulf_jordan");
  assert.equal(regionOf("jo"), "gulf_jordan");
  assert.equal(regionOf("eg"), "egypt");
  assert.equal(regionOf("ma"), "maghreb");
  assert.equal(regionOf("sy"), "levant");
  assert.equal(regionOf("ye"), "sudan_yemen");
  assert.equal(regionOf("de"), "abroad");
  assert.equal(regionOf(null), "unknown");
  assert.equal(regionOf(""), "unknown");
  assert.equal(isWeakRegion("egypt"), true);
  assert.equal(isWeakRegion("iraq"), false);
  assert.equal(isWeakRegion("unknown"), false);
});

test("tallyOrders: counts every outcome, adds revenue only for paid orders, busiest group first", () => {
  const rows = tallyOrders(
    [
      order({ pricing_country: "iq", status: "fulfilled", price_usd_cents: 500 }),
      order({ pricing_country: "iq", status: "fulfilled", price_usd_cents: 300 }),
      order({ pricing_country: "iq", status: "expired" }),
      order({ pricing_country: "eg", status: "expired" }),
      order({ pricing_country: "eg", status: "pending" }),
      order({ pricing_country: "eg", status: "failed", provider_payment_id: null }),
      order({ pricing_country: "eg", status: "needs_review" }),
      order({ pricing_country: "de", status: "cancelled" }),
    ],
    (o) => o.pricing_country ?? "?",
  );
  assert.deepEqual(
    rows.map((row) => row.key),
    ["eg", "iq", "de"],
  );
  const iq = rows.find((row) => row.key === "iq")!;
  assert.deepEqual(
    { orders: iq.orders, paid: iq.paid, left: iq.left, paidUsdCents: iq.paidUsdCents },
    { orders: 3, paid: 2, left: 1, paidUsdCents: 800 },
  );
  const eg = rows.find((row) => row.key === "eg")!;
  assert.deepEqual(
    {
      orders: eg.orders,
      left: eg.left,
      waiting: eg.waiting,
      noLink: eg.noLink,
      needsReview: eg.needsReview,
      paid: eg.paid,
      paidUsdCents: eg.paidUsdCents,
    },
    { orders: 4, left: 1, waiting: 1, noLink: 1, needsReview: 1, paid: 0, paidUsdCents: 0 },
  );
});

test("countsRow: shares of all orders and of the orders no longer waiting, '-' for an empty group", () => {
  const [row] = tallyOrders(
    [
      order({ status: "fulfilled", price_usd_cents: 250 }),
      order({ status: "expired" }),
      order({ status: "expired" }),
      order({ status: "pending" }),
    ],
    () => "all",
  );
  const printed = countsRow(row!);
  assert.equal(printed.orders, 4);
  assert.equal(printed.paid, 1);
  assert.equal(printed["paid % of orders"], "25.0%");
  assert.equal(printed["paid % of settled"], "33.3%");
  assert.equal(printed["paid USD"], 3);

  const empty = countsRow(sumCounts([]));
  assert.equal(empty["paid % of orders"], "-");
  assert.equal(empty["paid % of settled"], "-");
});

test("foldSmallCountries: small countries become one row that keeps their totals", () => {
  const rows = tallyOrders(
    [
      ...Array.from({ length: 5 }, () => order({ pricing_country: "iq", status: "fulfilled" })),
      order({ pricing_country: "eg" }),
      order({ pricing_country: "ma", status: "fulfilled" }),
    ],
    (o) => o.pricing_country ?? "?",
  );
  const folded = foldSmallCountries(rows, 3);
  assert.deepEqual(
    folded.map((row) => [row.key, row.orders, row.paid]),
    [
      ["iq", 5, 5],
      ["others (2 countries)", 2, 1],
    ],
  );
  assert.deepEqual(
    foldSmallCountries(rows, 1),
    rows,
    "nothing is folded when every country is big enough",
  );
});

test("methodOfClick: Binance only when the click says so, older clicks were the card button", () => {
  assert.equal(methodOfClick({ user_id: "u", event_properties: { method: "binance" } }), "binance");
  assert.equal(methodOfClick({ user_id: "u", event_properties: { method: "card" } }), "card");
  assert.equal(methodOfClick({ user_id: "u", event_properties: { plan: "monthly" } }), "card");
  assert.equal(methodOfClick({ user_id: "u", event_properties: null }), "card");
  assert.equal(methodOfClick({ user_id: "u" }), "card");
});

const view = (user: string | null): UpgradeEvent => ({ user_id: user, event_properties: {} });
const click = (user: string, method?: "card" | "binance", tier = "A"): UpgradeEvent => ({
  user_id: user,
  event_properties: { plan: "monthly", tier, bonusDays: 0, ...(method ? { method } : {}) },
});

test("upgradeFunnel: distinct learners step by step, repeated views and clicks count once", () => {
  const funnel = upgradeFunnel({
    views: [view("a"), view("a"), view("b"), view("c"), view("d"), view(null), view(null)],
    clicks: [click("a", "card"), click("a", "card"), click("b", "binance", "B"), click("c")],
    orders: [
      order({ user_id: "a", provider: "wayl", status: "fulfilled" }),
      order({ user_id: "a", provider: "wayl", status: "expired", reference_id: "ss_y" }),
      order({ user_id: "b", provider: "binance_pay", status: "expired" }),
    ],
  });
  assert.equal(funnel.guestViews, 2);
  assert.deepEqual(funnel.viewed, { users: 4, inChain: 4 });
  assert.deepEqual(funnel.clicked, { users: 3, inChain: 3 });
  assert.deepEqual(funnel.ordered, { users: 2, inChain: 2 });
  assert.deepEqual(funnel.paid, { users: 1, inChain: 1 });
  assert.deepEqual(funnel.byMethod.card, { clicked: 2, ordered: 1, paid: 1 });
  assert.deepEqual(funnel.byMethod.binance, { clicked: 1, ordered: 1, paid: 0 });
  assert.deepEqual(funnel.clickedByTier, [
    { tier: "A", users: 2 },
    { tier: "B", users: 1 },
  ]);
});

test("upgradeFunnel: a learner outside the chain counts in the period but not in the chain", () => {
  const funnel = upgradeFunnel({
    views: [view("a")],
    clicks: [click("a"), click("z")],
    orders: [
      order({ user_id: "z", status: "fulfilled" }),
      order({ user_id: "a", status: "pending" }),
    ],
  });
  assert.deepEqual(funnel.clicked, { users: 2, inChain: 1 });
  assert.deepEqual(funnel.ordered, { users: 2, inChain: 1 });
  assert.deepEqual(funnel.paid, { users: 1, inChain: 0 });

  const rows = upgradeFunnelRows(funnel);
  assert.equal(rows.length, 4);
  assert.equal(rows[1]!["of the step before"], "100.0%");
  assert.equal(rows[3]!["of the step before"], "0.0%");
});

test("upgradeFunnel: nothing at all gives empty steps and no division by zero", () => {
  const funnel = upgradeFunnel({ views: [], clicks: [], orders: [] });
  assert.deepEqual(funnel.viewed, { users: 0, inChain: 0 });
  assert.deepEqual(funnel.byMethod.card, { clicked: 0, ordered: 0, paid: 0 });
  assert.deepEqual(funnel.clickedByTier, []);
  assert.equal(upgradeFunnelRows(funnel)[1]!["of the step before"], "-");
});
