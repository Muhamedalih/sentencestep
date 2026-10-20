// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  BINANCE_UPGRADE_REPORT_PATH,
  MAX_PAYMENT_REPORT_NOTE_LENGTH,
  PAYMENT_REPORT_CATEGORIES,
  PAYMENT_REPORT_CATEGORIES_BY_CONTEXT,
  PAYMENT_REPORT_CATEGORY_LABELS,
  buildPaymentReportMessage,
  isBinanceReportPath,
  isPaymentReportCategory,
  isPaymentReportPath,
  paymentReportOriginalPath,
  paymentReportPagePath,
  toPaymentReportOrder,
} from "./payment-report";
import type { PaymentReportAccess, PaymentReportOrder } from "./payment-report";
import { makeOrder } from "./payments/test-support";

const FREE_ACCOUNT: PaymentReportAccess = {
  isPremium: false,
  plan: "free",
  status: "free",
  expiresAt: null,
};

function order(overrides: Partial<PaymentReportOrder> = {}): PaymentReportOrder {
  return {
    referenceId: "ss_0123456789abcdef0123456789abcdef",
    status: "pending",
    createdAt: "2026-10-07T13:02:11.123456+00:00",
    paidAt: null,
    premiumDays: 90,
    usdCents: 400,
    chargeAmount: 6080,
    chargeCurrency: "IQD",
    tier: "A",
    provider: "wayl",
    providerEnv: "live",
    providerPaymentId: null,
    failureReason: null,
    ...overrides,
  };
}

test("isPaymentReportCategory: accepts only the known categories", () => {
  for (const category of PAYMENT_REPORT_CATEGORIES) assert.ok(isPaymentReportCategory(category));
  for (const bad of ["", "refund", "OTHER", null, undefined, 3, {}]) {
    assert.equal(isPaymentReportCategory(bad), false, String(bad));
  }
});

test("categories by context: every offered category is a known one with an admin label, and Binance has its own", () => {
  for (const offered of Object.values(PAYMENT_REPORT_CATEGORIES_BY_CONTEXT)) {
    for (const category of offered) {
      assert.ok(isPaymentReportCategory(category), category);
      assert.ok(PAYMENT_REPORT_CATEGORY_LABELS[category].length > 0, category);
    }
    assert.ok(offered.includes("other"), "always a way to say something else");
    assert.ok(offered.includes("paid_not_active"), "always a way to say the payment is not active");
  }
  assert.equal(
    (PAYMENT_REPORT_CATEGORIES_BY_CONTEXT.default as readonly string[]).includes("binance_no_note"),
    false,
  );
  assert.ok(PAYMENT_REPORT_CATEGORIES_BY_CONTEXT.binance.includes("binance_no_note"));
  assert.ok(PAYMENT_REPORT_CATEGORIES_BY_CONTEXT.binance.includes("binance_wrong_amount"));
  assert.ok(PAYMENT_REPORT_CATEGORIES_BY_CONTEXT.binance.includes("binance_cant_send"));
  // Every category belongs to at least one dialog, so none can be filed from nowhere.
  const offeredAnywhere = new Set<string>(
    Object.values(PAYMENT_REPORT_CATEGORIES_BY_CONTEXT).flatMap((list) => [...list]),
  );
  for (const category of PAYMENT_REPORT_CATEGORIES)
    assert.ok(offeredAnywhere.has(category), category);
});

test("isBinanceReportPath: only a payment report filed from a Binance Pay screen", () => {
  assert.ok(
    isBinanceReportPath(
      paymentReportPagePath("/billing/binance/ss_0123456789abcdef0123456789abcdef"),
    ),
  );
  assert.ok(isBinanceReportPath(paymentReportPagePath(BINANCE_UPGRADE_REPORT_PATH)));
  assert.equal(isBinanceReportPath(paymentReportPagePath("/upgrade")), false);
  assert.equal(isBinanceReportPath(paymentReportPagePath("/billing/return")), false);
  // An ordinary "Report a problem" is never a payment report, whatever its path says.
  assert.equal(isBinanceReportPath("/billing/binance/ss_x"), false);
});

test("message: a Binance Pay order carries its code, a card order does not", () => {
  const message = buildPaymentReportMessage({
    category: "binance_no_note",
    note: "",
    access: FREE_ACCOUNT,
    orders: [
      order({
        referenceId: "ss_binance",
        provider: "binance_pay",
        chargeAmount: 4,
        chargeCurrency: "USDT",
        usdCents: 400,
        providerPaymentId: "SS-QTY6Z",
      }),
      order({ referenceId: "ss_card", providerPaymentId: "wayl-123" }),
    ],
  });

  assert.match(message, /^Payment problem: I sent the Binance transfer without the order code/);
  assert.match(message, /1\. ss_binance \|.*binance_pay\/live.*\| code SS-QTY6Z/);
  assert.equal(message.includes("wayl-123"), false);
});

test("page path: a payment report is marked by a prefix a regular report's path can never have", () => {
  const path = paymentReportPagePath("/upgrade");

  assert.equal(path, "payment:/upgrade");
  assert.ok(isPaymentReportPath(path));
  assert.equal(isPaymentReportPath("/upgrade"), false);
  assert.equal(paymentReportOriginalPath(path), "/upgrade");
  assert.equal(paymentReportOriginalPath("/learn"), "/learn");
});

test("page path: stays within the stored limit however long the path is", () => {
  assert.ok(paymentReportPagePath(`/${"x".repeat(2000)}`).length <= 500);
});

test("message: states the category, the note, the account and the newest order", () => {
  const message = buildPaymentReportMessage({
    category: "paid_not_active",
    note: "  I paid at 3pm and nothing changed  ",
    access: FREE_ACCOUNT,
    orders: [order()],
  });

  assert.match(message, /^Payment problem: I paid but Premium isn't active\n\n/);
  assert.match(message, /I paid at 3pm and nothing changed/);
  assert.match(message, /Account: Free \(plan free, status free\)/);
  assert.match(
    message,
    /1\. ss_0123456789abcdef0123456789abcdef \| pending \| 90d \$4 = 6080 IQD \| tier A \| wayl\/live \| created 2026-10-07 13:02Z/,
  );
});

test("message: a premium account shows when it ends, and a paid order shows when", () => {
  const message = buildPaymentReportMessage({
    category: "other",
    note: "hi",
    access: {
      isPremium: true,
      plan: "premium",
      status: "active",
      expiresAt: "2027-02-02T12:09:22Z",
    },
    orders: [order({ status: "fulfilled", paidAt: "2026-10-07T13:05:00Z" })],
  });

  assert.match(message, /Account: Premium \(plan premium, status active, until 2027-02-02\)/);
  assert.match(message, /\| fulfilled \|/);
  assert.match(message, /paid 2026-10-07 13:05Z/);
});

test("message: a failed order carries its reason, and no note leaves no blank gap", () => {
  const message = buildPaymentReportMessage({
    category: "payment_failed",
    note: "   ",
    access: FREE_ACCOUNT,
    orders: [order({ status: "failed", failureReason: "provider_rejected" })],
  });

  assert.match(message, /reason provider_rejected/);
  assert.equal(message.includes("\n\n\n"), false);
});

test("message: says so when the account has no orders at all", () => {
  const message = buildPaymentReportMessage({
    category: "wrong_price",
    note: "$4 turned into $4.61",
    access: FREE_ACCOUNT,
    orders: [],
  });

  assert.match(message, /Latest orders: none found for this account/);
});

test("message: only the newest three orders are listed", () => {
  const orders = ["a", "b", "c", "d"].map((letter) => order({ referenceId: `ss_${letter}` }));

  const message = buildPaymentReportMessage({
    category: "other",
    note: "x",
    access: FREE_ACCOUNT,
    orders,
  });

  assert.match(message, /ss_a/);
  assert.match(message, /ss_c/);
  assert.equal(message.includes("ss_d"), false);
});

test("message: always fits the stored limit, keeping the newest order and as much note as fits", () => {
  const message = buildPaymentReportMessage({
    category: "paid_not_active",
    note: "n".repeat(MAX_PAYMENT_REPORT_NOTE_LENGTH + 800),
    access: {
      isPremium: true,
      plan: "premium",
      status: "active",
      expiresAt: "2027-02-02T12:09:22Z",
    },
    orders: [
      order({ referenceId: "ss_newest", failureReason: "fulfillment_mismatch" }),
      order({ referenceId: "ss_older" }),
      order({ referenceId: "ss_oldest" }),
    ],
  });

  assert.ok(message.length <= 1000, String(message.length));
  assert.match(message, /ss_newest/);
});

test("message: a normal-sized note and three orders fit without losing anything", () => {
  const message = buildPaymentReportMessage({
    category: "paid_not_active",
    note: "n".repeat(MAX_PAYMENT_REPORT_NOTE_LENGTH),
    access: FREE_ACCOUNT,
    orders: [
      order({ referenceId: "ss_0123456789abcdef0123456789abcde1" }),
      order({ referenceId: "ss_0123456789abcdef0123456789abcde2" }),
      order({ referenceId: "ss_0123456789abcdef0123456789abcde3" }),
    ],
  });

  assert.ok(message.length <= 1000, String(message.length));
  assert.match(message, /abcde3/);
  assert.ok(message.includes("n".repeat(MAX_PAYMENT_REPORT_NOTE_LENGTH)));
});

test("toPaymentReportOrder: quotes the order under the report's own names", () => {
  const quoted = toPaymentReportOrder(
    makeOrder({
      reference_id: "ss_x",
      status: "fulfilled",
      price_usd_cents: 400,
      charge_amount: 6080,
      premium_days: 90,
      pricing_tier: "A",
      paid_at: "2026-10-07T13:05:00Z",
    }),
  );

  assert.deepEqual(quoted, {
    referenceId: "ss_x",
    status: "fulfilled",
    createdAt: "2026-10-04T11:30:00.000Z",
    paidAt: "2026-10-07T13:05:00Z",
    premiumDays: 90,
    usdCents: 400,
    chargeAmount: 6080,
    chargeCurrency: "IQD",
    tier: "A",
    provider: "wayl",
    providerEnv: "test",
    providerPaymentId: "link_1",
    failureReason: null,
  });
});
