// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { normalizeEgyptPhone } from "./phone";
import { cairoLocalToIso, parseAmountPiasters, parseSms } from "./sms";

// A real message's shape with made-up numbers and a made-up name.
const SAMPLE = `تم استلام مبلغ 215.00 جنيه من 01120000001؛
المسجل بإسم Test Sender Name
على رقم محفظتك 01090000002 بتاريخ 13:05 26-11-17.
رصيدك الحالي: 299.87 جنيه
رقم العملية: 025878179077
 تقدر تتابع كل مصروفاتك من تاريخ المعاملات على أبلكيشن أنا فودافون http://vf.eg/vfcash`;

function transferOf(text: string) {
  const result = parseSms(text);
  assert.equal(result.kind, "transfer");
  if (result.kind !== "transfer") throw new Error("not a transfer");
  return result.transfer;
}

test("parseSms reads every fact of a Vodafone Cash transfer", () => {
  assert.deepEqual(transferOf(SAMPLE), {
    transactionId: "025878179077",
    amountPiasters: 21_500,
    balancePiasters: 29_987,
    payerPhone: "01120000001",
    payerName: "Test Sender Name",
    walletNumber: "01090000002",
    receivedAt: "2026-11-17T11:05:00.000Z",
  });
});

test("parseSms never mistakes the balance for the amount", () => {
  assert.notEqual(transferOf(SAMPLE).amountPiasters, 29_987);
});

test("parseSms reads Arabic digits and a name on the same line", () => {
  const transfer = transferOf(
    "تم استلام مبلغ ٢٥٠٫٥٠ جنيه من ٠١٢٠٠٠٠٠٠٠٢؛ المسجل بإسم Someone Else على رقم محفظتك 01090000002 بتاريخ 09:01 26-07-03. رصيدك الحالي: ١٬٢٣٤٫٠٠ جنيه رقم العملية: ٠٠١٢٣٤٥٦٧٨",
  );
  assert.equal(transfer.amountPiasters, 25_050);
  assert.equal(transfer.payerPhone, "01200000002");
  assert.equal(transfer.payerName, "Someone Else");
  assert.equal(transfer.balancePiasters, 123_400);
  assert.equal(transfer.transactionId, "0012345678");
  // July: Egypt is on summer time (UTC+3).
  assert.equal(transfer.receivedAt, "2026-07-03T06:01:00.000Z");
});

test("parseSms keeps a transfer whose time it cannot read, with no time", () => {
  const transfer = transferOf("تم استلام مبلغ 100 جنيه من 01120000001 رقم العملية: 123456789");
  assert.equal(transfer.receivedAt, null);
  assert.equal(transfer.amountPiasters, 10_000);
});

test("parseSms treats a transfer message with no operation number as unreadable but suspicious", () => {
  assert.deepEqual(parseSms("تم استلام مبلغ 215.00 جنيه من 01120000001"), {
    kind: "other",
    looksLikeTransfer: true,
  });
});

test("parseSms ignores messages that are not incoming transfers", () => {
  assert.deepEqual(parseSms("عرض خاص: اشترك الآن في باقة جديدة"), {
    kind: "other",
    looksLikeTransfer: false,
  });
  // Money going OUT is the wallet's own activity, never a suspicious transfer.
  const out = parseSms("تم تحويل مبلغ 50.00 جنيه الى 01120000001 رقم العملية: 123456789");
  assert.equal(out.kind, "activity");
});

test("parseAmountPiasters reads whole pounds, piasters and thousands marks", () => {
  assert.equal(parseAmountPiasters("215"), 21_500);
  assert.equal(parseAmountPiasters("215.5"), 21_550);
  assert.equal(parseAmountPiasters("1,215.05"), 121_505);
});

test("parseAmountPiasters refuses anything that is not a plain amount", () => {
  assert.equal(parseAmountPiasters(""), null);
  assert.equal(parseAmountPiasters("12.345"), null);
  assert.equal(parseAmountPiasters("abc"), null);
});

test("cairoLocalToIso follows Egypt's winter and summer time", () => {
  assert.equal(cairoLocalToIso(2026, 1, 15, 12, 0), "2026-01-15T10:00:00.000Z");
  assert.equal(cairoLocalToIso(2026, 7, 15, 12, 0), "2026-07-15T09:00:00.000Z");
});

test("cairoLocalToIso refuses an impossible time", () => {
  assert.equal(cairoLocalToIso(2026, 13, 1, 12, 0), null);
  assert.equal(cairoLocalToIso(2026, 1, 1, 25, 0), null);
});

test("normalizeEgyptPhone accepts the ways people write a number", () => {
  for (const input of [
    "01012345678",
    "010 1234 5678",
    "010-1234-5678",
    "+20 10 1234 5678",
    "0020 10 1234 5678",
    "201012345678",
    "1012345678",
    "٠١٠١٢٣٤٥٦٧٨",
  ]) {
    assert.equal(normalizeEgyptPhone(input), "01012345678", input);
  }
});

test("normalizeEgyptPhone refuses what is not an Egyptian mobile number", () => {
  for (const input of ["", "0101234567", "01312345678", "07701234567", "hello", "010123456789"]) {
    assert.equal(normalizeEgyptPhone(input), null, input);
  }
});

// The shape of a real message about money sent out (made-up number and balance).
const OUTGOING = `تم تحويل 20 جنيه لرقم 01033333333 مصاريف الخدمة 1 جنيه رصيد حسابك فى فودافون كاش الحالي 663.87.
تاريخ العملية 22:48 26-11-17 :
رقم العملية 025900585759 :
حول فلوس لأي محفظة وزود فرصك تكسب جنيه دهب! http://vf.eg/vfcash?id=money_transfer`;

test("parseSms reads money sent out: amount, fee, who, balance, operation and time", () => {
  const result = parseSms(OUTGOING);
  assert.equal(result.kind, "activity");
  if (result.kind !== "activity") return;
  assert.deepEqual(result.activity, {
    transactionId: "025900585759",
    kind: "out",
    amountPiasters: 2_000,
    feePiasters: 100,
    toPhone: "01033333333",
    balancePiasters: 66_387,
    occurredAt: "2026-11-17T20:48:00.000Z",
  });
});

test("parseSms keeps a text with a balance of a kind it does not read as 'other', amount unknown", () => {
  const result = parseSms(
    "تم دفع فاتورة الإنترنت بنجاح رصيدك الحالي 500.25 جنيه رقم العملية 025900000001",
  );
  assert.equal(result.kind, "activity");
  if (result.kind !== "activity") return;
  assert.equal(result.activity.kind, "other");
  assert.equal(result.activity.amountPiasters, null);
  assert.equal(result.activity.balancePiasters, 50_025);
});

test("parseSms: money sent out and operator ads are never worth an alert", () => {
  const ad = parseSms("اشحن رصيد بمحفظة فودافون كاش و هتكسب 50 ضعف شحنتك! https://vf.eg/vfcash");
  assert.deepEqual(ad, { kind: "other", looksLikeTransfer: false });
  // Out, without an operation number: not a record, and not suspicious either.
  assert.deepEqual(parseSms("تم تحويل 20 جنيه لرقم 01033333333"), {
    kind: "other",
    looksLikeTransfer: false,
  });
});

test("parseSms: a new wording of money coming IN is still flagged for a look", () => {
  assert.deepEqual(parseSms("تم تحويل 100 جنيه إليك من 01012345678"), {
    kind: "other",
    looksLikeTransfer: true,
  });
});
