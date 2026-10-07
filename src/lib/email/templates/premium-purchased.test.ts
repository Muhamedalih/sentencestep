// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { premiumPurchasedEmail } from "./premium-purchased";

const BASE = {
  origin: "https://sentencestep.com",
  days: 90,
  premiumUntil: "2027-02-02T12:09:22.24761+00:00",
  priceUsdCents: 400,
  reference: "ss_0123456789abcdef0123456789abcdef",
};

test("premiumPurchasedEmail: says when Premium ends and shows the plan, price in dollars and reference", () => {
  const email = premiumPurchasedEmail(BASE);

  assert.equal(email.subject, "Your SentenceStep Premium is active");
  assert.match(email.html, /active until February 2, 2027/);
  assert.match(email.html, /90 days of Premium/);
  assert.match(email.html, /\$4/);
  assert.match(email.html, /ss_0123456789abcdef0123456789abcdef/);
  assert.match(email.text, /Plan: 90 days of Premium/);
  assert.match(email.text, /Price: \$4/);
  assert.match(email.text, /Reference: ss_0123456789abcdef0123456789abcdef/);
});

test("premiumPurchasedEmail: never shows dinars, only the dollar price the learner saw", () => {
  const email = premiumPurchasedEmail(BASE);

  assert.equal(/IQD|dinar|6,?080/i.test(email.html + email.text), false);
});

test("premiumPurchasedEmail: the button takes the learner to their lessons", () => {
  const email = premiumPurchasedEmail(BASE);

  assert.match(email.html, /href="https:\/\/sentencestep\.com\/learn"/);
  assert.match(email.html, /Start learning/);
  assert.match(email.text, /Start learning: https:\/\/sentencestep\.com\/learn/);
});

test("premiumPurchasedEmail: it is an account notice with its own footer, not a preferences footer", () => {
  const email = premiumPurchasedEmail(BASE);

  assert.match(email.html, /This confirms your purchase on SentenceStep/);
  assert.equal(email.html.includes("Manage email preferences"), false);
});

test("premiumPurchasedEmail: fractional dollars keep their cents", () => {
  assert.match(premiumPurchasedEmail({ ...BASE, priceUsdCents: 250 }).text, /Price: \$2\.50/);
});

test("premiumPurchasedEmail: an unknown end date is left out rather than guessed", () => {
  for (const premiumUntil of [null, "not a date"]) {
    const email = premiumPurchasedEmail({ ...BASE, premiumUntil });

    assert.match(email.html, /Your Premium access is active\./);
    assert.equal(email.html.includes("active until"), false);
  }
});

test("premiumPurchasedEmail: the plan counts bonus days like any other days", () => {
  assert.match(premiumPurchasedEmail({ ...BASE, days: 97 }).html, /97 days of Premium/);
});

test("premiumPurchasedEmail: nothing in it can inject markup", () => {
  const email = premiumPurchasedEmail({ ...BASE, reference: "<script>alert(1)</script>" });

  assert.equal(email.html.includes("<script>"), false);
  assert.match(email.html, /&lt;script&gt;/);
});
