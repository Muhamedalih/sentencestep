// Run with `npm run test:billing`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { buildLedgerCsv, csvCell, LEDGER_COLUMNS } from "./ledger";
import type { LedgerRow } from "./ledger";

function row(overrides: Partial<LedgerRow> = {}): LedgerRow {
  return {
    orderCreatedAt: "2026-10-18T11:50:00.000Z",
    transferredAt: "2026-10-18T11:58:00.000Z",
    linkedAt: "2026-10-18T11:58:20.000Z",
    orderReference: "ss_0123456789abcdef0123456789abcdef",
    orderCode: "SS-7K3Q2",
    premiumDays: 90,
    priceUsdCents: 600,
    amountUsdt: "6.00000000",
    transactionId: "P_A1B2C3D4E5F6G7H8",
    payerBinanceId: "987654321",
    payerName: "Sara A.",
    linkMethod: "note_code",
    orderStatus: "fulfilled",
    fulfilledAt: "2026-10-18T11:58:21.000Z",
    ...overrides,
  };
}

test("buildLedgerCsv: a header, then one line per payment, CRLF-terminated", () => {
  const csv = buildLedgerCsv([row()]);
  const lines = csv.split("\r\n");
  assert.equal(lines.length, 3);
  assert.equal(lines[2], "");
  assert.equal(lines[0], LEDGER_COLUMNS.map((column) => column.header).join(","));
  assert.equal(
    lines[1],
    "2026-10-18T11:50:00.000Z,2026-10-18T11:58:00.000Z,2026-10-18T11:58:20.000Z,ss_0123456789abcdef0123456789abcdef,SS-7K3Q2,90,6.00,6.00000000,P_A1B2C3D4E5F6G7H8,987654321,Sara A.,note_code,fulfilled,2026-10-18T11:58:21.000Z",
  );
});

test("buildLedgerCsv: no payments is just the header", () => {
  assert.equal(buildLedgerCsv([]).split("\r\n").length, 2);
});

test("csvCell: commas, quotes and line breaks are quoted", () => {
  assert.equal(csvCell("a,b"), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell("two\nlines"), '"two\nlines"');
  assert.equal(csvCell("plain"), "plain");
});

test("csvCell: a value a spreadsheet would run as a formula is defused", () => {
  for (const value of ['=HYPERLINK("http://x")', "+1+1", "-2+3", "@SUM(A1)"]) {
    assert.ok(csvCell(value).replace(/^"/, "").startsWith("'"), value);
  }
});

test("buildLedgerCsv: a stranger's name cannot add a column or a formula", () => {
  const csv = buildLedgerCsv([row({ payerName: '=cmd|" /C calc"!A1,evil' })]);
  const line = csv.split("\r\n")[1]!;
  assert.match(line, /"'=cmd\|"" \/C calc""!A1,evil"/);
});

test("buildLedgerCsv: missing optional facts are empty cells, not the word null", () => {
  const csv = buildLedgerCsv([
    row({
      linkedAt: null,
      orderCode: null,
      payerBinanceId: null,
      payerName: null,
      linkMethod: null,
      fulfilledAt: null,
    }),
  ]);
  assert.equal(csv.includes("null"), false);
  assert.equal(csv.includes("undefined"), false);
});
