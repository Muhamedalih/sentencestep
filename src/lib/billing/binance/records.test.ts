// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { MAX_RECORDS, parseRelayBody } from "./records";

const NOW = Date.parse("2026-10-18T12:00:00.000Z");

function record(overrides: Record<string, unknown> = {}) {
  return {
    orderType: "C2C",
    transactionId: "P_A1B2C3D4E5F6G7H8",
    transactionTime: NOW - 60_000,
    amount: "6.00000000",
    currency: "USDT",
    walletType: 1,
    note: "SS-7K3Q2",
    payerInfo: {
      name: "Sara A.",
      binanceId: "987654321",
      email: "sara@example.com",
      phoneNumber: "+9647700000000",
      countryCode: "IQ",
      type: "USER",
    },
    receiverInfo: { name: "User-f65e4", email: "me@example.com" },
    ...overrides,
  };
}

function parse(body: unknown) {
  const result = parseRelayBody(JSON.stringify(body), NOW);
  assert.equal(result.ok, true);
  return result.ok ? result.value : { transfers: [], skipped: -1, error: null };
}

test("parseRelayBody: a clean incoming transfer is kept, with only what matching needs", () => {
  const { transfers, skipped } = parse({ records: [record()] });
  assert.equal(skipped, 0);
  assert.equal(transfers.length, 1);
  assert.deepEqual(transfers[0], {
    transactionId: "P_A1B2C3D4E5F6G7H8",
    transactedAt: new Date(NOW - 60_000).toISOString(),
    amount: "6.00000000",
    currency: "USDT",
    orderType: "C2C",
    note: "SS-7K3Q2",
    payerBinanceId: "987654321",
    payerName: "Sara A.",
    raw: {
      transactionId: "P_A1B2C3D4E5F6G7H8",
      transactionTime: NOW - 60_000,
      amount: "6.00000000",
      currency: "USDT",
      orderType: "C2C",
      walletType: 1,
    },
  });
});

test("parseRelayBody: contact details never survive, anywhere in what is kept", () => {
  const { transfers } = parse({ records: [record()] });
  const text = JSON.stringify(transfers);
  for (const secret of [
    "sara@example.com",
    "me@example.com",
    "+9647700000000",
    "IQ",
    "email",
    "phone",
  ]) {
    assert.equal(text.includes(secret), false, secret);
  }
});

test("parseRelayBody: what the shop sent out (negative) and zero are not payments", () => {
  const { transfers, skipped } = parse({
    records: [
      record({ transactionId: "OUT_000001", amount: "-50.00000000" }),
      record({ transactionId: "ZERO_00001", amount: "0.00000000" }),
      record({ transactionId: "GOOD_00001", amount: "3" }),
    ],
  });
  assert.deepEqual(
    transfers.map((t) => t.transactionId),
    ["GOOD_00001"],
  );
  assert.equal(skipped, 2);
});

test("parseRelayBody: malformed records are dropped, not stored", () => {
  const { transfers, skipped } = parse({
    records: [
      null,
      "text",
      record({ transactionId: "x" }),
      record({ transactionId: "has space here" }),
      record({ transactionTime: "yesterday" }),
      record({ transactionTime: Date.UTC(2010, 0, 1) }),
      record({ transactionTime: NOW + 3 * 24 * 3600 * 1000 }),
      record({ currency: "us dt" }),
      record({ orderType: "c2c!" }),
      record({ amount: "six" }),
      record({ amount: undefined }),
    ],
  });
  assert.equal(transfers.length, 0);
  assert.equal(skipped, 11);
});

test("parseRelayBody: a repeated transaction id in one request is counted once", () => {
  const { transfers, skipped } = parse({ records: [record(), record()] });
  assert.equal(transfers.length, 1);
  assert.equal(skipped, 1);
});

test("parseRelayBody: the note is plain, bounded text", () => {
  const long = "x".repeat(500);
  const { transfers } = parse({
    records: [
      record({ transactionId: "NOTE_0001", note: "  SS-7K3Q2\u0000\n\tthanks  " }),
      record({ transactionId: "NOTE_0002", note: long }),
      record({ transactionId: "NOTE_0003", note: "   " }),
      record({ transactionId: "NOTE_0004", note: 42 }),
    ],
  });
  assert.equal(transfers[0]!.note, "SS-7K3Q2 thanks");
  assert.equal(transfers[1]!.note!.length, 200);
  assert.equal(transfers[2]!.note, null);
  assert.equal(transfers[3]!.note, null);
});

test("parseRelayBody: a payer id that is not a plain number is ignored, a name is bounded", () => {
  const { transfers } = parse({
    records: [
      record({
        transactionId: "PAYER_0001",
        payerInfo: { binanceId: "12; drop table", name: "n".repeat(300) },
      }),
    ],
  });
  assert.equal(transfers[0]!.payerBinanceId, null);
  assert.equal(transfers[0]!.payerName!.length, 80);
});

test("parseRelayBody: the relay's own error message is carried, cleaned and short", () => {
  const { transfers, error } = parse({ records: [], error: `binance said no\n${"!".repeat(400)}` });
  assert.equal(transfers.length, 0);
  assert.equal(error!.length, 200);
  assert.equal(error!.includes("\n"), false);
});

test("parseRelayBody: refuses what is not a sane request", () => {
  assert.deepEqual(parseRelayBody("not json", NOW), { ok: false, reason: "not_json" });
  assert.deepEqual(parseRelayBody("[]", NOW), { ok: false, reason: "not_an_object" });
  assert.deepEqual(parseRelayBody('{"records":"x"}', NOW), {
    ok: false,
    reason: "records_not_a_list",
  });
  const many = { records: Array.from({ length: MAX_RECORDS + 1 }, () => record()) };
  assert.deepEqual(parseRelayBody(JSON.stringify(many), NOW), {
    ok: false,
    reason: "too_many_records",
  });
  assert.deepEqual(parseRelayBody(`{"records":[],"pad":"${"x".repeat(600 * 1024)}"}`, NOW), {
    ok: false,
    reason: "too_large",
  });
});

test("parseRelayBody: no records at all is fine (the relay only reporting in)", () => {
  assert.deepEqual(parse({}), { transfers: [], skipped: 0, error: null });
});

test("parseRelayBody: with no code in the note, the code is found in another text field, and the note says so", () => {
  const { transfers } = parse({
    records: [
      record({ note: "thanks", remark: "ss 7k3q2 please", extra: { message: "unrelated" } }),
    ],
  });
  assert.equal(transfers[0]!.note, "ss 7k3q2 please | thanks");
  assert.equal(transfers[0]!.raw.noteField, "remark");
});

test("parseRelayBody: the code is found in a nested field and in a list of texts", () => {
  const nested = parse({
    records: [record({ note: undefined, details: { memo: { text: "SS-7K3Q2" } } })],
  });
  assert.equal(nested.transfers[0]!.note, "SS-7K3Q2");
  assert.equal(nested.transfers[0]!.raw.noteField, "details");

  const listed = parse({ records: [record({ note: "", messages: ["hi", "SS-7K3Q2"] })] });
  assert.equal(listed.transfers[0]!.note, "SS-7K3Q2");
});

test("parseRelayBody: a note that already holds a code is left exactly as it is", () => {
  const { transfers } = parse({ records: [record({ note: "SS-7K3Q2", remark: "SS-ABCDE" })] });
  assert.equal(transfers[0]!.note, "SS-7K3Q2");
  assert.equal(transfers[0]!.raw.noteField, undefined);
});

test("parseRelayBody: who sent it, who received it and the ids are never searched for a code", () => {
  const { transfers } = parse({
    records: [
      record({
        note: "hello",
        orderId: "SS-7K3Q2",
        payerInfo: { name: "SS-7K3Q2", binanceId: "987654321" },
        receiverInfo: { name: "SS-ABCDE" },
      }),
    ],
  });
  assert.equal(transfers[0]!.note, "hello");
  assert.equal(transfers[0]!.raw.noteField, undefined);
});

test("parseRelayBody: with no code anywhere the note stays what the sender wrote, and the search is bounded", () => {
  const plain = parse({ records: [record({ note: "hello", remark: "class abcde" })] });
  assert.equal(plain.transfers[0]!.note, "hello");

  const deep = parse({ records: [record({ note: null, a: { b: { c: { d: "SS-7K3Q2" } } } })] });
  assert.equal(deep.transfers[0]!.note, null);

  const long = parse({ records: [record({ note: "x".repeat(300), remark: "SS-7K3Q2" })] });
  assert.ok(long.transfers[0]!.note!.length <= 200);
  assert.ok(long.transfers[0]!.note!.startsWith("SS-7K3Q2 | "));
});
