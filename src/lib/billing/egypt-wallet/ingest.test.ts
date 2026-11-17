// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import type { PaymentAlert } from "@/lib/billing/payments/fulfillment";

import {
  handleSms,
  linkByOperationNumber,
  normalizeOperationNumber,
  processUnlinkedMessages,
  readMessage,
  readSecret,
  senderIsVodafone,
} from "./ingest";
import type { SmsDeps } from "./ingest";
import type { MatchableOrder } from "./matching";
import type { EgyptWalletSettings } from "./settings";
import type { EgyptWalletStore, StoredMessage } from "./store";

const SECRET = "s".repeat(40);
const WALLET = "01090000002";
const NOW = Date.parse("2026-11-17T11:10:00.000Z");

const SETTINGS: EgyptWalletSettings = {
  walletNumber: WALLET,
  dailyOrderCap: 50,
  autoActivate: true,
  latePaymentHours: 24,
};

/** A transfer message the way Vodafone writes it (made-up numbers), at 13:05 Cairo time = 11:05 UTC. */
function sms(opts: { amount?: string; phone?: string; operation?: string } = {}): string {
  return `تم استلام مبلغ ${opts.amount ?? "215.00"} جنيه من ${opts.phone ?? "01120000001"}؛
المسجل بإسم Test Sender
على رقم محفظتك ${WALLET} بتاريخ 13:05 26-11-17.
رصيدك الحالي: 299.87 جنيه
رقم العملية: ${opts.operation ?? "025878179077"}`;
}

const order = (patch: Partial<MatchableOrder> = {}): MatchableOrder => ({
  orderId: "o1",
  referenceId: "ss_1",
  userId: "u1",
  status: "pending",
  chargeAmount: 215,
  createdAt: "2026-11-17T11:00:00.000Z",
  payerPhone: "01120000001",
  ...patch,
});

function fakeStore(orders: MatchableOrder[]) {
  const messages: StoredMessage[] = [];
  const unreadable: { rawText: string; looksLikeTransfer: boolean }[] = [];
  const notified: string[] = [];
  const store: Partial<EgyptWalletStore> = {
    getSettings: async () => SETTINGS,
    insertMessage: async (transfer, rawText, seenAt) => {
      if (messages.some((m) => m.transactionId === transfer.transactionId)) return "duplicate";
      messages.push({
        id: `m${messages.length + 1}`,
        status: "new",
        transactionId: transfer.transactionId,
        amountPiasters: transfer.amountPiasters,
        balancePiasters: transfer.balancePiasters,
        payerPhone: transfer.payerPhone,
        payerName: transfer.payerName,
        walletNumber: transfer.walletNumber,
        receivedAt: transfer.receivedAt ?? seenAt.toISOString(),
        rawText,
        seenAt: seenAt.toISOString(),
        notifiedAt: null,
        linkedOrderId: null,
        linkMethod: null,
      });
      return "inserted";
    },
    insertUnreadable: async ({ rawText, looksLikeTransfer }) => {
      unreadable.push({ rawText, looksLikeTransfer });
    },
    listUnlinkedSince: async () => messages.filter((m) => m.status === "new"),
    getMessageByTransactionId: async (id) => messages.find((m) => m.transactionId === id) ?? null,
    findOrdersByPhone: async (phone) => orders.filter((o) => o.payerPhone === phone),
    listOpenOrders: async () => orders.filter((o) => o.status === "pending"),
    linkMessage: async ({ messageId, orderId, method }) => {
      const message = messages.find((m) => m.id === messageId)!;
      if (message.status === "linked") return "message_already_linked";
      message.status = "linked";
      message.linkedOrderId = orderId;
      message.linkMethod = method;
      return "linked";
    },
    markNotified: async (id) => {
      notified.push(id);
      messages.find((m) => m.id === id)!.notifiedAt = new Date(NOW).toISOString();
    },
    touchState: async () => undefined,
  };
  return { store: store as EgyptWalletStore, messages, unreadable, notified };
}

function setup(orders: MatchableOrder[]) {
  const fake = fakeStore(orders);
  const fulfilled: string[] = [];
  const alerts: PaymentAlert[] = [];
  const deps: SmsDeps = {
    secret: SECRET,
    store: fake.store,
    providerEnv: "test",
    now: () => NOW,
    fulfill: async (referenceId) => {
      fulfilled.push(referenceId);
      return { outcome: "fulfilled", premiumUntil: null };
    },
    report: (alert) => {
      alerts.push(alert);
    },
  };
  return { ...fake, deps, fulfilled, alerts };
}

const headers = (secret: string | null, extra: Record<string, string> = {}) => ({
  get: (name: string) =>
    name.toLowerCase() === "x-secret" ? secret : (extra[name.toLowerCase()] ?? null),
});

test("a request with the wrong secret is refused and nothing is stored", async () => {
  const t = setup([order()]);
  const response = await handleSms(t.deps, { body: sms(), headers: headers("wrong") });
  assert.equal(response.status, 401);
  assert.equal(t.messages.length, 0);
  assert.deepEqual(t.fulfilled, []);
});

test("a transfer from the number an order was opened for activates that order", async () => {
  const t = setup([order()]);
  const response = await handleSms(t.deps, { body: sms(), headers: headers(SECRET) });
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "stored");
  assert.equal(response.body.linked, 1);
  assert.deepEqual(t.fulfilled, ["ss_1"]);
  assert.equal(t.messages[0]!.status, "linked");
  assert.equal(t.messages[0]!.linkMethod, "phone");
});

test("the same message delivered twice activates once", async () => {
  const t = setup([order()]);
  await handleSms(t.deps, { body: sms(), headers: headers(SECRET) });
  const second = await handleSms(t.deps, { body: sms(), headers: headers(SECRET) });
  assert.equal(second.body.status, "duplicate");
  assert.deepEqual(t.fulfilled, ["ss_1"]);
  assert.equal(t.messages.length, 1);
});

test("two different transfers with the same text but different operation numbers are both kept", async () => {
  const t = setup([]);
  await handleSms(t.deps, { body: sms({ operation: "100000001" }), headers: headers(SECRET) });
  await handleSms(t.deps, { body: sms({ operation: "100000002" }), headers: headers(SECRET) });
  assert.equal(t.messages.length, 2);
});

test("a text that claims to be a transfer but comes from an ordinary number is never trusted", async () => {
  const t = setup([order()]);
  const body = JSON.stringify({ message: sms(), from: "+201000000000" });
  const response = await handleSms(t.deps, { body, headers: headers(SECRET) });
  assert.equal(response.body.status, "ignored");
  assert.equal(t.messages.length, 0);
  assert.equal(t.unreadable.length, 1);
  assert.deepEqual(t.fulfilled, []);
  assert.equal(t.alerts[0]?.code, "egypt_wallet_untrusted_sender");
});

test("a transfer in a shape the reader does not know is kept and the admins are told", async () => {
  const t = setup([order()]);
  const response = await handleSms(t.deps, {
    body: "تحويل وارد 215 جنيه رقم المرجع 99",
    headers: headers(SECRET),
  });
  assert.equal(response.body.status, "ignored");
  assert.equal(t.unreadable[0]?.looksLikeTransfer, true);
  assert.equal(t.alerts[0]?.code, "egypt_wallet_unreadable_message");
});

test("an offer from the operator is kept quietly", async () => {
  const t = setup([order()]);
  await handleSms(t.deps, { body: "عرض خاص لك اشترك الآن", headers: headers(SECRET) });
  assert.equal(t.unreadable.length, 1);
  assert.deepEqual(t.alerts, []);
});

test("a transfer that arrives before the learner wrote their number waits, then activates", async () => {
  const waiting = order({ payerPhone: null });
  const t = setup([waiting]);
  const first = await handleSms(t.deps, { body: sms(), headers: headers(SECRET) });
  assert.equal(first.body.linked, 0);
  assert.equal(t.messages[0]!.status, "new");

  waiting.payerPhone = "01120000001";
  const processed = await processUnlinkedMessages(t.deps, SETTINGS);
  assert.equal(processed.linked, 1);
  assert.deepEqual(t.fulfilled, ["ss_1"]);
});

test("a transfer for the wrong amount is not linked and the admins are told once", async () => {
  const t = setup([order()]);
  await handleSms(t.deps, { body: sms({ amount: "150.00" }), headers: headers(SECRET) });
  assert.equal(t.messages[0]!.status, "new");
  assert.deepEqual(t.fulfilled, []);
  assert.equal(t.alerts.length, 1);
  assert.equal(t.alerts[0]?.code, "egypt_wallet_message_needs_match");
  // Seeing the same message again does not alert again.
  await processUnlinkedMessages(t.deps, SETTINGS);
  assert.equal(t.alerts.length, 1);
});

test("a transfer from an unknown number is quiet unless an order of that price waits", async () => {
  const quiet = setup([order({ chargeAmount: 100 })]);
  await handleSms(quiet.deps, {
    body: sms({ phone: "01199999999" }),
    headers: headers(SECRET),
  });
  assert.deepEqual(quiet.alerts, []);

  const loud = setup([order({ payerPhone: "01111111111" })]);
  await handleSms(loud.deps, { body: sms({ phone: "01199999999" }), headers: headers(SECRET) });
  assert.equal(loud.alerts.length, 1);
});

test("a learner who paid from another number is linked by the operation number", async () => {
  const t = setup([order({ payerPhone: "01111111111" })]);
  await handleSms(t.deps, { body: sms(), headers: headers(SECRET) });
  assert.equal(t.messages[0]!.status, "new");

  assert.equal(await linkByOperationNumber(t.deps, order(), "12345"), "invalid");
  assert.equal(await linkByOperationNumber(t.deps, order(), "999999999"), "not_found");
  assert.equal(await linkByOperationNumber(t.deps, order(), " 0258-78179077 "), "linked");
  assert.deepEqual(t.fulfilled, ["ss_1"]);
  assert.equal(t.messages[0]!.linkMethod, "reference");
  // The same receipt cannot be used for another order.
  assert.equal(
    await linkByOperationNumber(
      t.deps,
      order({ orderId: "o2", referenceId: "ss_2" }),
      "025878179077",
    ),
    "already_used",
  );
});

test("readMessage understands JSON, forms and bare text", () => {
  assert.deepEqual(readMessage('{"message":"hi","from":"Vodafone"}', "application/json"), {
    message: "hi",
    sender: "Vodafone",
  });
  assert.deepEqual(readMessage('{"text":"hi","sender":"VF-Cash"}', null), {
    message: "hi",
    sender: "VF-Cash",
  });
  assert.deepEqual(
    readMessage("message=hello+there&from=Vodafone", "application/x-www-form-urlencoded"),
    { message: "hello there", sender: "Vodafone" },
  );
  assert.deepEqual(readMessage("  plain text  ", "text/plain"), {
    message: "plain text",
    sender: null,
  });
});

test("senderIsVodafone accepts the operator's names and refuses ordinary numbers", () => {
  assert.equal(senderIsVodafone(null), true);
  assert.equal(senderIsVodafone("Vodafone"), true);
  assert.equal(senderIsVodafone("VF-Cash"), true);
  assert.equal(senderIsVodafone("+201012345678"), false);
  assert.equal(senderIsVodafone("Mom"), false);
});

test("readSecret takes the header or a bearer token", () => {
  assert.equal(readSecret(headers("abc")), "abc");
  assert.equal(readSecret(headers(null, { authorization: "Bearer xyz" })), "xyz");
  assert.equal(readSecret(headers(null)), "");
});

test("normalizeOperationNumber keeps digits only", () => {
  assert.equal(normalizeOperationNumber(" 0258-78179077"), "025878179077");
  assert.equal(normalizeOperationNumber("#025878179077"), "025878179077");
  assert.equal(normalizeOperationNumber("12ab"), null);
});
