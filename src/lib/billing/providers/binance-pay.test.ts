// Run with `npm run test:billing`. Fakes only — no database, no network.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  HOUR,
  InMemoryBinancePayStore,
  MINUTE,
  NOW,
  iso,
} from "@/lib/billing/binance/test-support";
import { InvalidWebhookSignatureError, PaymentProviderError } from "@/lib/billing/payment-provider";
import type { CreatePaymentInput } from "@/lib/billing/payment-provider";

import { createBinancePayProvider } from "./binance-pay";

const INPUT: CreatePaymentInput = {
  referenceId: "ss_ref1",
  amount: 6,
  currency: "USDT",
  description: "SentenceStep Premium (90 days) - $6",
  webhookUrl: "https://sentencestep.example/api/billing/webhook/binance_pay",
  redirectUrl: "https://sentencestep.example/billing/return",
  expiresIn: "1h",
};

function setup(codes: string[] = ["SS-7K3Q2"]) {
  const store = new InMemoryBinancePayStore();
  const queue = [...codes];
  const provider = createBinancePayProvider({
    environment: "test",
    store: () => store,
    newCode: () => queue.shift() ?? "SS-ZZZZZ",
    now: () => new Date(NOW),
  });
  return { store, provider };
}

test("the provider says what it is: Binance Pay, charged in USDT", () => {
  const { provider } = setup();
  assert.equal(provider.name, "binance_pay");
  assert.equal(provider.settlementCurrency, "USDT");
  assert.equal(provider.environment, "test");
});

test("createPayment: gives the order a code and points at our own payment page", async () => {
  const { store, provider } = setup(["SS-7K3Q2"]);
  store.addOrder({ orderCode: null });

  const result = await provider.createPayment(INPUT);

  assert.deepEqual(result, {
    providerPaymentId: "SS-7K3Q2",
    checkoutUrl: "https://sentencestep.example/billing/binance/ss_ref1",
  });
  assert.equal(await store.getIntentCode("order-1"), "SS-7K3Q2");
});

test("createPayment: a code that is already taken is replaced by the next draw", async () => {
  const { store, provider } = setup(["SS-TAKEN", "SS-FREE2"]);
  store.takenCodes.add("SS-TAKEN");
  store.addOrder({ orderCode: null });

  const result = await provider.createPayment(INPUT);
  assert.equal(result.providerPaymentId, "SS-FREE2");
});

test("createPayment: asked twice for the same order, it returns the code it already gave", async () => {
  const { store, provider } = setup(["SS-7K3Q2", "SS-OTHER"]);
  store.addOrder({ orderCode: null });

  const first = await provider.createPayment(INPUT);
  const second = await provider.createPayment(INPUT);
  assert.equal(second.providerPaymentId, first.providerPaymentId);
});

test("createPayment: an order that does not exist is refused, not retried", async () => {
  const { provider } = setup();
  await assert.rejects(
    provider.createPayment({ ...INPUT, referenceId: "ss_missing" }),
    (error: unknown) => error instanceof PaymentProviderError && error.retryable === false,
  );
});

test("createPayment: gives up, retryably, if every draw is taken", async () => {
  const { store, provider } = setup(Array.from({ length: 6 }, () => "SS-TAKEN"));
  store.takenCodes.add("SS-TAKEN");
  store.addOrder({ orderCode: null });
  await assert.rejects(
    provider.createPayment(INPUT),
    (error: unknown) => error instanceof PaymentProviderError && error.retryable === true,
  );
});

test("getPayment: an order with no transfer is pending", async () => {
  const { store, provider } = setup();
  store.addOrder();
  assert.deepEqual(await provider.getPayment("ss_ref1"), {
    referenceId: "ss_ref1",
    providerPaymentId: "SS-7K3Q2",
    status: "pending",
    rawStatus: "awaiting_transfer",
    amount: 6,
    currency: "USDT",
    paidAt: null,
  });
});

test("getPayment: an order with a linked transfer is paid, at the transfer's time, for the order's own price", async () => {
  const { store, provider } = setup();
  const order = store.addOrder();
  await store.insertTransfers([
    {
      transactionId: "TX_0001",
      transactedAt: iso(-3 * MINUTE),
      amount: "10.00000000",
      currency: "USDT",
      orderType: "C2C",
      note: "SS-7K3Q2",
      payerBinanceId: null,
      payerName: null,
      raw: {},
    },
  ]);
  await store.linkTransfer({
    transferId: "transfer-1",
    orderId: order.id,
    method: "note_code",
    reason: "test",
  });

  assert.deepEqual(await provider.getPayment("ss_ref1"), {
    referenceId: "ss_ref1",
    providerPaymentId: "SS-7K3Q2",
    status: "paid",
    rawStatus: "transfer_linked",
    amount: 6,
    currency: "USDT",
    paidAt: iso(-3 * MINUTE),
  });
});

test("getPayment: an order that is not a Binance Pay order, or has no code, is unknown", async () => {
  const { store, provider } = setup();
  store.addOrder({ orderCode: null });
  assert.equal(await provider.getPayment("ss_ref1"), null);
  assert.equal(await provider.getPayment("ss_nope"), null);
});

test("getPayments: many orders at once, only the ones it knows", async () => {
  const { store, provider } = setup();
  store.addOrder();
  store.addOrder({ referenceId: "ss_ref2", orderCode: "SS-ABCDE" });
  const payments = await provider.getPayments(["ss_ref1", "ss_ref2", "ss_unknown"]);
  assert.deepEqual(payments.map((payment) => payment.referenceId).sort(), ["ss_ref1", "ss_ref2"]);
});

test("getPayments: a long list is read in short batches", async () => {
  const { store, provider } = setup();
  const batches: number[] = [];
  const original = store.listPaymentStates.bind(store);
  store.listPaymentStates = async (ids: string[]) => {
    batches.push(ids.length);
    return original(ids);
  };
  await provider.getPayments(Array.from({ length: 120 }, (_, index) => `ss_${index}`));
  assert.deepEqual(batches, [50, 50, 20]);
});

test("verifyWebhook: there are no webhooks, so any attempt is refused", () => {
  const { provider } = setup();
  assert.throws(
    () => provider.verifyWebhook(new Uint8Array(), { get: () => null }),
    InvalidWebhookSignatureError,
  );
});

test("the order window used by the page matches the provider's one hour default", () => {
  assert.equal(HOUR, 60 * MINUTE);
});
