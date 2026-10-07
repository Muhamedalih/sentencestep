// Run with `npm run test:billing`. No database, session or email provider:
// every dependency of filePaymentReport is a recording stub.

import { test } from "node:test";
import assert from "node:assert/strict";

import { MAX_PAYMENT_REPORT_NOTE_LENGTH } from "./payment-report";
import type { PaymentReportOrder } from "./payment-report";
import { MAX_PAYMENT_REPORTS_PER_HOUR, filePaymentReport } from "./payment-report-service";
import type { PaymentReportDeps } from "./payment-report-service";

const NOW = new Date("2026-10-07T14:00:00.000Z");

const ORDER: PaymentReportOrder = {
  referenceId: "ss_0123456789abcdef0123456789abcdef",
  status: "pending",
  createdAt: "2026-10-07T13:55:00Z",
  paidAt: null,
  premiumDays: 90,
  usdCents: 400,
  chargeAmount: 6080,
  chargeCurrency: "IQD",
  tier: "A",
  provider: "wayl",
  providerEnv: "live",
  failureReason: null,
};

function setup(overrides: Partial<PaymentReportDeps> = {}) {
  const inserted: Parameters<PaymentReportDeps["insertReport"]>[0][] = [];
  const notified: Parameters<PaymentReportDeps["notify"]>[0][] = [];
  const counted: { userId: string; since: Date }[] = [];
  const deps: PaymentReportDeps = {
    getUser: async () => ({ id: "user-1", email: "sara@example.com" }),
    countRecentReports: async (userId, since) => {
      counted.push({ userId, since });
      return 0;
    },
    loadContext: async () => ({
      access: { isPremium: false, plan: "free", status: "free", expiresAt: null },
      orders: [ORDER],
    }),
    insertReport: async (row) => {
      inserted.push(row);
      return { ok: true };
    },
    notify: async (input) => {
      notified.push(input);
    },
    now: () => NOW,
    ...overrides,
  };
  return { deps, inserted, notified, counted };
}

const VALID = { category: "paid_not_active", note: "I paid", pagePath: "/billing/return" };

test("filePaymentReport: stores the report with the server-read order and alerts the admins", async () => {
  const { deps, inserted, notified } = setup();

  const result = await filePaymentReport(deps, VALID);

  assert.deepEqual(result, { ok: true });
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0]!.userId, "user-1");
  assert.equal(inserted[0]!.userEmail, "sara@example.com");
  assert.equal(inserted[0]!.pagePath, "payment:/billing/return");
  assert.match(inserted[0]!.message, /Payment problem: I paid but Premium isn't active/);
  assert.match(inserted[0]!.message, /ss_0123456789abcdef0123456789abcdef/);
  assert.deepEqual(notified, [
    { userEmail: "sara@example.com", category: "paid_not_active", message: inserted[0]!.message },
  ]);
});

test("filePaymentReport: an unknown category is refused before anything is read or stored", async () => {
  const { deps, inserted, notified } = setup({
    getUser: async () => {
      throw new Error("must not be reached");
    },
  });

  for (const category of ["refund", "", undefined, 5, { a: 1 }]) {
    assert.deepEqual(await filePaymentReport(deps, { ...VALID, category }), {
      ok: false,
      code: "invalid",
    });
  }
  assert.equal(inserted.length, 0);
  assert.equal(notified.length, 0);
});

test("filePaymentReport: 'something else' needs a note, the other categories don't", async () => {
  const { deps } = setup();

  assert.deepEqual(await filePaymentReport(deps, { ...VALID, category: "other", note: "   " }), {
    ok: false,
    code: "note_required",
  });
  assert.deepEqual(
    await filePaymentReport(deps, { ...VALID, category: "payment_failed", note: "" }),
    { ok: true },
  );
});

test("filePaymentReport: a note over the limit is refused", async () => {
  const { deps, inserted } = setup();

  const result = await filePaymentReport(deps, {
    ...VALID,
    note: "x".repeat(MAX_PAYMENT_REPORT_NOTE_LENGTH + 1),
  });

  assert.deepEqual(result, { ok: false, code: "too_long" });
  assert.equal(inserted.length, 0);
});

test("filePaymentReport: a visitor who isn't signed in, or has no email, can't file one", async () => {
  for (const user of [null, { id: "user-1", email: null }]) {
    const { deps, inserted } = setup({ getUser: async () => user });

    assert.deepEqual(await filePaymentReport(deps, VALID), { ok: false, code: "not_signed_in" });
    assert.equal(inserted.length, 0);
  }
});

test("filePaymentReport: after the hourly limit another report is refused, and nobody is alerted", async () => {
  const { deps, inserted, notified, counted } = setup({
    countRecentReports: async () => MAX_PAYMENT_REPORTS_PER_HOUR,
  });

  assert.deepEqual(await filePaymentReport(deps, VALID), { ok: false, code: "too_many" });
  assert.equal(inserted.length, 0);
  assert.equal(notified.length, 0);
  assert.equal(counted.length, 0);
});

test("filePaymentReport: the limit counts the last hour for this learner", async () => {
  const { deps, counted } = setup();

  await filePaymentReport(deps, VALID);

  assert.equal(counted[0]!.userId, "user-1");
  assert.equal(counted[0]!.since.toISOString(), "2026-10-07T13:00:00.000Z");
});

test("filePaymentReport: one report under the limit still goes through", async () => {
  const { deps } = setup({ countRecentReports: async () => MAX_PAYMENT_REPORTS_PER_HOUR - 1 });

  assert.deepEqual(await filePaymentReport(deps, VALID), { ok: true });
});

test("filePaymentReport: if counting fails the report is still filed", async () => {
  const { deps, inserted } = setup({
    countRecentReports: async () => {
      throw new Error("database down");
    },
  });

  assert.deepEqual(await filePaymentReport(deps, VALID), { ok: true });
  assert.equal(inserted.length, 1);
});

test("filePaymentReport: if the orders can't be read the report is filed without them", async () => {
  const { deps, inserted } = setup({
    loadContext: async () => {
      throw new Error("database down");
    },
  });

  assert.deepEqual(await filePaymentReport(deps, VALID), { ok: true });
  assert.match(inserted[0]!.message, /Latest orders: none found/);
  assert.match(inserted[0]!.message, /Account: Free \(plan unknown, status unknown\)/);
});

test("filePaymentReport: when the report can't be stored nobody is alerted and the learner is told", async () => {
  const { deps, notified } = setup({ insertReport: async () => ({ ok: false }) });

  assert.deepEqual(await filePaymentReport(deps, VALID), { ok: false, code: "generic" });
  assert.equal(notified.length, 0);
});

test("filePaymentReport: a page path that isn't an app path is replaced, never stored as given", async () => {
  const { deps, inserted } = setup();

  for (const pagePath of ["https://evil.example/x", "javascript:alert(1)", undefined, 12]) {
    await filePaymentReport(deps, { ...VALID, pagePath });
  }

  assert.deepEqual(
    inserted.map((row) => row.pagePath),
    ["payment:/", "payment:/", "payment:/", "payment:/"],
  );
});

test("filePaymentReport: a very long page path is cut", async () => {
  const { deps, inserted } = setup();

  await filePaymentReport(deps, { ...VALID, pagePath: `/${"a".repeat(2000)}` });

  assert.ok(inserted[0]!.pagePath.length <= 500);
});
