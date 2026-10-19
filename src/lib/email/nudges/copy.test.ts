// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { abandonedCheckoutEmail, dayOneNudgeEmail, nudgeLanguage, reminderEmail } from "./copy";
import type { NudgeLanguage } from "./copy";

const LANGUAGES: NudgeLanguage[] = ["ar", "es", "tr", "en"];
const ORIGIN = "https://sentencestep.com";

// Nothing that promises what the product does not do: refunds, a countdown, scarcity, a free trial.
const FORBIDDEN =
  /refund|money-back|last chance|hurry|only today|ends soon|free trial|reembols|devoluci|última oportunidad|iade|son şans|استرجاع|استرداد|آخر فرصة/i;

test("nudgeLanguage: the learner's own language, English for anything else", () => {
  assert.equal(nudgeLanguage("ar"), "ar");
  assert.equal(nudgeLanguage("tr"), "tr");
  assert.equal(nudgeLanguage("fr"), "en");
  assert.equal(nudgeLanguage(null), "en");
});

test("dayOneNudgeEmail: every language is complete, points at /learn and carries the preferences link", () => {
  for (const language of LANGUAGES) {
    const email = dayOneNudgeEmail({ origin: ORIGIN, displayName: "Sara", language });
    assert.ok(email.subject.length > 5, language);
    assert.match(
      email.html,
      new RegExp(`<html lang="${language}" dir="${language === "ar" ? "rtl" : "ltr"}">`),
      language,
    );
    assert.ok(email.html.includes(`${ORIGIN}/learn"`), `${language} cta`);
    assert.ok(email.html.includes(`${ORIGIN}/learn/settings`), `${language} preferences`);
    assert.ok(email.text.includes(`${ORIGIN}/learn`), `${language} text`);
    assert.ok(email.html.includes("Sara"), `${language} name`);
    assert.equal(FORBIDDEN.test(email.html), false, language);
    assert.equal(/\{[a-z]+\}/i.test(email.html), false, `${language} unfilled placeholder`);
  }
});

test("dayOneNudgeEmail: a missing name greets without one, and a name is escaped", () => {
  const noName = dayOneNudgeEmail({ origin: ORIGIN, displayName: null, language: "en" });
  assert.match(noName.text, /^Hi,/);
  const hostile = dayOneNudgeEmail({
    origin: ORIGIN,
    displayName: '<img src=x onerror="a">',
    language: "en",
  });
  assert.equal(hostile.html.includes("<img"), false);
});

test("abandonedCheckoutEmail: what it mentions is exactly what is true right now", () => {
  for (const language of LANGUAGES) {
    const all = abandonedCheckoutEmail({
      origin: ORIGIN,
      displayName: null,
      language,
      binancePay: true,
      offerRunning: true,
      canReply: true,
    });
    const none = abandonedCheckoutEmail({
      origin: ORIGIN,
      displayName: null,
      language,
      binancePay: false,
      offerRunning: false,
      canReply: false,
    });
    assert.ok(all.html.includes(`${ORIGIN}/upgrade"`), `${language} cta`);
    assert.ok(all.html.includes("Binance Pay"), `${language} mentions Binance Pay when offered`);
    assert.equal(
      none.html.includes("Binance Pay"),
      false,
      `${language} must not mention it when it is not offered`,
    );
    assert.ok(all.html.length > none.html.length, `${language} offer line only while it runs`);
    assert.equal(FORBIDDEN.test(all.html) || FORBIDDEN.test(none.html), false, language);
  }
});

test("abandonedCheckoutEmail: 'reply to this email' only when a reply address exists", () => {
  const withReply = abandonedCheckoutEmail({
    origin: ORIGIN,
    displayName: null,
    language: "en",
    binancePay: false,
    offerRunning: false,
    canReply: true,
  });
  const without = abandonedCheckoutEmail({
    origin: ORIGIN,
    displayName: null,
    language: "en",
    binancePay: false,
    offerRunning: false,
    canReply: false,
  });
  assert.match(withReply.text, /reply to this email/i);
  assert.equal(/reply/i.test(without.text), false);
});

test("reminderEmail: complete in every language, and the offer line only while an offer runs", () => {
  for (const language of LANGUAGES) {
    const plain = reminderEmail({
      origin: ORIGIN,
      displayName: "Sara",
      language,
      showOffer: false,
    });
    const offer = reminderEmail({ origin: ORIGIN, displayName: "Sara", language, showOffer: true });
    assert.ok(plain.subject.length > 5, language);
    assert.ok(plain.html.includes(`${ORIGIN}/learn"`), `${language} cta`);
    assert.equal(plain.html.includes(`${ORIGIN}/upgrade`), false, `${language} no offer link`);
    assert.ok(offer.html.includes(`${ORIGIN}/upgrade"`), `${language} offer link`);
    assert.ok(offer.text.includes(`${ORIGIN}/upgrade`), `${language} offer link in text`);
    assert.ok(offer.html.length > plain.html.length, language);
    assert.equal(FORBIDDEN.test(offer.html), false, language);
    assert.equal(/\{[a-z]+\}/i.test(offer.html), false, `${language} unfilled placeholder`);
  }
});

test("nudge emails: with an unsubscribe link the footer uses it and the one-click headers are sent", () => {
  const unsubscribe = {
    pageUrl: `${ORIGIN}/unsubscribe?u=1&t=2`,
    headers: {
      "List-Unsubscribe": `<${ORIGIN}/api/email/unsubscribe?u=1&t=2>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
  for (const language of LANGUAGES) {
    const email = reminderEmail({
      origin: ORIGIN,
      displayName: null,
      language,
      showOffer: false,
      unsubscribe,
    });
    assert.ok(email.html.includes(`${ORIGIN}/unsubscribe?u=1&amp;t=2`), `${language} footer link`);
    assert.ok(email.text.includes(`${ORIGIN}/unsubscribe?u=1&t=2`), `${language} text footer`);
    assert.equal(email.headers?.["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
  }
  const day = dayOneNudgeEmail({ origin: ORIGIN, displayName: null, language: "en", unsubscribe });
  assert.ok(day.headers?.["List-Unsubscribe"]);
  const without = dayOneNudgeEmail({ origin: ORIGIN, displayName: null, language: "en" });
  assert.equal(without.headers, undefined);
  assert.ok(without.html.includes(`${ORIGIN}/learn/settings`));
});
