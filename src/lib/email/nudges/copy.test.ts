// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  abandonedCheckoutEmail,
  dayOneNudgeEmail,
  nudgeLanguage,
  reminderEmail,
  sessionReminderEmail,
} from "./copy";
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

test("abandonedCheckoutEmail: short, about their own plan and price, in every language", () => {
  for (const language of LANGUAGES) {
    const email = abandonedCheckoutEmail({
      origin: ORIGIN,
      displayName: "Sara",
      language,
      plan: "3m",
      priceCents: 400,
      offer: { days: 10 },
    });
    assert.ok(email.html.includes(`${ORIGIN}/upgrade"`), `${language} cta`);
    // Arabic writes the price in words ("4 دولارات"): a "$" inside right-to-left text gets reordered.
    assert.ok(
      language === "ar" ? email.html.includes("4 دولارات") : email.html.includes("$4"),
      `${language} their price`,
    );
    assert.ok(email.html.includes("10"), `${language} their gift days`);
    assert.ok(email.subject.includes("10"), `${language} subject names the gift`);
    assert.ok(email.html.includes("Sara"), `${language} name`);
    assert.equal(FORBIDDEN.test(email.html), false, language);
    assert.equal(/\{[a-z]+\}/i.test(email.html), false, `${language} unfilled placeholder`);
    // Short: a greeting, three sentences, one button.
    assert.ok(email.text.split("\n").filter((l) => l.trim()).length <= 7, `${language} is short`);
  }
});

test("abandonedCheckoutEmail: never talks about a failed payment, a reply address or Binance Pay", () => {
  for (const language of LANGUAGES) {
    const email = abandonedCheckoutEmail({
      origin: ORIGIN,
      displayName: null,
      language,
      plan: "1m",
      priceCents: 200,
      offer: null,
    });
    assert.equal(
      /Binance|reply|responde|yanıt|ردّ|ردّ|went wrong|salió mal|sorun|مشكلة/i.test(email.html),
      false,
      language,
    );
  }
});

test("abandonedCheckoutEmail: the gift line is there only while an offer runs, with the plan's own days", () => {
  for (const language of LANGUAGES) {
    const base = {
      origin: ORIGIN,
      displayName: null,
      language,
      plan: "1m",
      priceCents: 200,
    } as const;
    const withOffer = abandonedCheckoutEmail({ ...base, offer: { days: 7 } });
    const generic = abandonedCheckoutEmail({ ...base, offer: { days: null } });
    const none = abandonedCheckoutEmail({ ...base, offer: null });
    assert.ok(withOffer.text.includes("7"), `${language} specific days`);
    assert.equal(none.text.includes("7"), false, `${language} no gift without an offer`);
    assert.notEqual(withOffer.subject, none.subject, language);
    assert.notEqual(generic.html, none.html, language);
    assert.notEqual(generic.html, withOffer.html, language);
  }
});

test("abandonedCheckoutEmail: with no known plan it is generic and never invents one", () => {
  const email = abandonedCheckoutEmail({
    origin: ORIGIN,
    displayName: null,
    language: "en",
    plan: null,
    priceCents: null,
    offer: null,
  });
  assert.equal(email.subject, "Your Premium is one step away");
  assert.equal(/plan \(/.test(email.html), false);
});

test("abandonedCheckoutEmail: Arabic counts days properly", () => {
  const days = (n: number) =>
    abandonedCheckoutEmail({
      origin: ORIGIN,
      displayName: null,
      language: "ar",
      plan: "1m",
      priceCents: 200,
      offer: { days: n },
    }).subject;
  assert.match(days(7), /7 أيام/);
  assert.match(days(10), /10 أيام/);
  assert.match(days(15), /15 يوماً/);
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

test("sessionReminderEmail: every language is complete, says it is the only message and points at /learn", () => {
  const ONLY_MESSAGE = {
    ar: /الوحيدة/,
    es: /único mensaje/,
    tr: /tek mesaj/,
    en: /only message/,
  } as const;
  for (const language of LANGUAGES) {
    const email = sessionReminderEmail({ origin: ORIGIN, displayName: "Sara", language });
    assert.ok(email.subject.length > 5, language);
    assert.ok(email.html.includes(`${ORIGIN}/learn"`), `${language} cta`);
    assert.ok(email.html.includes(`${ORIGIN}/learn/settings`), `${language} preferences`);
    assert.ok(email.html.includes("Sara"), `${language} name`);
    assert.match(email.html, ONLY_MESSAGE[language], `${language} honest about being the only one`);
    assert.equal(FORBIDDEN.test(email.html), false, language);
    assert.equal(/{[a-z]+}/i.test(email.html), false, `${language} unfilled placeholder`);
  }
});

test("sessionReminderEmail: carries the one-click unsubscribe link and headers when it has them", () => {
  const email = sessionReminderEmail({
    origin: ORIGIN,
    displayName: null,
    language: "en",
    unsubscribe: {
      pageUrl: `${ORIGIN}/unsubscribe?token=abc`,
      headers: { "List-Unsubscribe": "<https://sentencestep.com/api/unsubscribe?token=abc>" },
    },
  });
  assert.ok(email.html.includes(`${ORIGIN}/unsubscribe?token=abc`));
  assert.equal(
    email.headers?.["List-Unsubscribe"],
    "<https://sentencestep.com/api/unsubscribe?token=abc>",
  );
  assert.match(email.text, /^Hi,/);
});
