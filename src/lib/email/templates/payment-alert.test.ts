// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  describePaymentAlert,
  paymentReportAlertEmail,
  paymentReportPushBody,
  paymentSystemAlertEmail,
  paymentSystemAlertPushBody,
} from "./payment-alert";

const REFERENCE = "ss_0123456789abcdef0123456789abcdef";

test("paymentReportAlertEmail: names the learner and the problem, and links to Reports", () => {
  const email = paymentReportAlertEmail({
    origin: "https://sentencestep.com",
    userEmail: "sara@example.com",
    category: "paid_not_active",
    message: "Payment problem: I paid but Premium isn't active\n\nAccount: Free (plan free)",
  });

  assert.equal(
    email.subject,
    "Payment problem: I paid but Premium isn't active — sara@example.com",
  );
  assert.match(email.html, /Payment problem reported/);
  assert.match(email.html, /https:\/\/sentencestep\.com\/admin\/reports/);
  assert.match(email.html, /https:\/\/sentencestep\.com\/billing\/return/);
  assert.match(
    email.text,
    /Reply from Admin > Reports: https:\/\/sentencestep\.com\/admin\/reports/,
  );
  assert.equal(/<[a-z]/i.test(email.text), false, "the text version is plain text");
});

test("paymentReportAlertEmail: everything the learner wrote is escaped", () => {
  const email = paymentReportAlertEmail({
    origin: "https://sentencestep.com",
    userEmail: 'x"><script>alert(1)</script>@example.com',
    category: "other",
    message: "<img src=x onerror=alert(1)> & more",
  });

  assert.equal(email.html.includes("<script>"), false);
  assert.equal(email.html.includes("<img"), false);
  assert.match(email.html, /&lt;img src=x onerror=alert\(1\)&gt; &amp; more/);
});

test("paymentReportAlertEmail: an Arabic note is allowed to read right to left", () => {
  const email = paymentReportAlertEmail({
    origin: "https://sentencestep.com",
    userEmail: "sara@example.com",
    category: "other",
    message: "دفعت ولم يتفعل الاشتراك",
  });

  assert.match(email.html, /<pre dir="auto"/);
  assert.match(email.html, /دفعت ولم يتفعل الاشتراك/);
});

test("paymentReportAlertEmail: the subject never gets absurdly long", () => {
  const email = paymentReportAlertEmail({
    origin: "https://sentencestep.com",
    userEmail: `${"a".repeat(300)}@example.com`,
    category: "payment_failed",
    message: "m",
  });

  assert.ok(email.subject.length <= 121, String(email.subject.length));
});

test("push bodies stay short enough for a lock screen", () => {
  assert.ok(paymentReportPushBody(`${"a".repeat(300)}@example.com`, "other").length <= 121);
  assert.ok(paymentSystemAlertPushBody("fulfillment_mismatch").length <= 121);
});

test("describePaymentAlert: every kind of mismatch is explained the same way", () => {
  const codes = [
    "fulfillment_mismatch",
    "amount_mismatch",
    "currency_mismatch",
    "reference_mismatch",
    "provider_payment_id_mismatch",
    "mismatch",
  ];
  for (const code of codes) {
    assert.equal(describePaymentAlert(code).title, "A payment doesn't match its order", code);
  }
});

test("describePaymentAlert: a code nobody wrote an explanation for still gets a useful one", () => {
  const explanation = describePaymentAlert("something_new");

  assert.equal(explanation.title, "Payment alert: something_new");
  assert.ok(explanation.action.length > 0);
});

test("paymentSystemAlertEmail: explains the problem and gives the exact lookup for the order", () => {
  const email = paymentSystemAlertEmail({
    code: "amount_mismatch",
    referenceId: REFERENCE,
    detail: "webhook: provider reports a payment that does not match the order",
  });

  assert.equal(email.subject, "Payment needs attention: A payment doesn't match its order");
  assert.match(email.html, /Premium was NOT granted/);
  assert.match(email.html, /Order reference: ss_0123456789abcdef0123456789abcdef/);
  assert.match(
    email.text,
    /select \* from payment_orders where reference_id = 'ss_0123456789abcdef0123456789abcdef';/,
  );
  assert.match(email.text, /Detail: webhook: provider reports a payment/);
});

test("paymentSystemAlertEmail: a reference that isn't one of ours never reaches the query", () => {
  const email = paymentSystemAlertEmail({
    code: "needs_review",
    referenceId: "x'; drop table payment_orders; --",
  });

  assert.equal(email.text.includes("select * from payment_orders"), false);
  assert.equal(email.html.includes("select * from payment_orders"), false);
});

test("paymentSystemAlertEmail: a batch-wide alert has no order reference to show", () => {
  const email = paymentSystemAlertEmail({
    code: "reconcile_batch_lookup_failed",
    referenceId: "batch",
    detail: "Wayl POST /api/v1/links/batch failed (503)",
  });

  assert.equal(email.text.includes("Order reference"), false);
  assert.match(email.text, /Detail: Wayl POST/);
});

test("paymentSystemAlertEmail: provider text in the detail is escaped", () => {
  const email = paymentSystemAlertEmail({
    code: "checkout_link_creation_failed",
    referenceId: REFERENCE,
    detail: "<b>oops</b>",
  });

  assert.equal(email.html.includes("<b>oops</b>"), false);
  assert.match(email.html, /&lt;b&gt;oops&lt;\/b&gt;/);
});
