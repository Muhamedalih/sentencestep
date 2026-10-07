// Run with `npm run test:i18n`.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  LEGAL_BACK_LABEL,
  PRIVACY,
  SUPPORT_EMAIL,
  TERMS,
  legalHomeHref,
  legalLanguage,
} from "./legal-documents";
import type { LegalDocument } from "./legal-documents";

function everyText(document: LegalDocument): string[] {
  return [
    document.title,
    document.updated,
    document.intro,
    ...document.sections.flatMap((section) => [
      section.heading,
      ...(section.paragraphs ?? []),
      ...(section.bullets ?? []),
    ]),
  ];
}

function fullText(document: LegalDocument): string {
  return everyText(document).join("\n");
}

test("legalLanguage: Arabic gets the Arabic text, every other visitor the English", () => {
  assert.equal(legalLanguage("ar"), "ar");
  for (const other of ["es", "tr", "en", "", null, undefined]) {
    assert.equal(legalLanguage(other), "en", String(other));
  }
});

test("Back: the label is in the language of the text, and with nowhere to go back to it leads to the visitor's own home page", () => {
  assert.equal(LEGAL_BACK_LABEL.en, "Back");
  assert.equal(LEGAL_BACK_LABEL.ar, "رجوع");
  assert.equal(legalHomeHref("ar"), "/ar");
  assert.equal(legalHomeHref("es"), "/es");
  assert.equal(legalHomeHref("tr"), "/tr");
  for (const other of ["en", "", "fr", "ar/terms", null, undefined]) {
    assert.equal(legalHomeHref(other), "/", String(other));
  }
});

test("both languages of each document have the same shape, so one can't silently lose a section", () => {
  for (const pair of [TERMS, PRIVACY]) {
    assert.equal(pair.en.sections.length, pair.ar.sections.length);
    pair.en.sections.forEach((section, index) => {
      const other = pair.ar.sections[index]!;
      assert.equal(
        section.paragraphs?.length ?? 0,
        other.paragraphs?.length ?? 0,
        `paragraphs of section ${index + 1}`,
      );
      assert.equal(
        section.bullets?.length ?? 0,
        other.bullets?.length ?? 0,
        `bullets of section ${index + 1}`,
      );
    });
  }
});

test("nothing is empty and nothing is left as a placeholder", () => {
  for (const pair of [TERMS, PRIVACY]) {
    for (const document of [pair.en, pair.ar]) {
      for (const text of everyText(document)) {
        assert.ok(text.trim().length > 0);
        assert.equal(/TODO|TBD|XXX|lorem|\[\s*\]/i.test(text), false, text);
      }
    }
  }
});

test("neither document still says payments are not available", () => {
  for (const pair of [TERMS, PRIVACY]) {
    const english = fullText(pair.en);
    assert.equal(
      /not yet available|does not process payments yet|still being written/i.test(english),
      false,
    );
  }
});

test("the terms say what was decided: one-time, no auto-renewal, all sales final", () => {
  const english = fullText(TERMS.en);
  assert.match(english, /one-time purchase/i);
  assert.match(english, /does not renew automatically/i);
  assert.match(english, /all purchases are final/i);
  assert.match(english, /Wayl/);
  assert.match(english, /Iraqi dinars/);

  const arabic = fullText(TERMS.ar);
  assert.match(arabic, /لمرة واحدة/);
  assert.match(arabic, /لا تتجدد تلقائيًا/);
  assert.match(arabic, /نهائية/);
  assert.match(arabic, /Wayl/);
  assert.match(arabic, /الدينار العراقي/);
});

test("the terms promise no refund, and leave the payment itself to Wayl", () => {
  const english = fullText(TERMS.en);
  assert.match(english, /does not offer refunds/i);
  assert.equal(/we will return|return that payment|will refund|we refund/i.test(english), false);
  assert.match(english, /Wayl, not SentenceStep, processes your payment/);
  assert.match(english, /duplicate charges/i);
  assert.match(english, /chargebacks/i);

  const arabic = fullText(TERMS.ar);
  assert.match(arabic, /SentenceStep استرجاع/);
  assert.equal(/سنعيد|نعيد لك/.test(arabic), false);
  assert.match(arabic, /تعالج Wayl/);
  assert.match(arabic, /الخصم المكرر/);
});

test("the terms keep the one promise that stays ours: activating the days that were paid for", () => {
  assert.match(fullText(TERMS.en), /activate the days you paid for/i);
  assert.match(fullText(TERMS.ar), /الأيام التي دفعت ثمنها/);
});

test("the terms say which law applies and ask minors to use SentenceStep with a parent's permission", () => {
  assert.match(fullText(TERMS.en), /governed by the laws of Iraq/);
  assert.match(fullText(TERMS.ar), /لقوانين العراق/);
  assert.match(fullText(TERMS.en), /under 18/);
  assert.match(fullText(TERMS.ar), /أقل من 18/);
});

test("the privacy policy names the services that touch personal data, in both languages", () => {
  for (const document of [PRIVACY.en, PRIVACY.ar]) {
    const text = fullText(document);
    for (const service of ["Supabase", "Netlify", "Wayl", "Resend"]) {
      assert.ok(text.includes(service), service);
    }
  }
});

test("the privacy policy discloses the usage events the app stores, and that Wayl is independent", () => {
  assert.match(fullText(PRIVACY.en), /simple events about what you do in the app/i);
  assert.match(fullText(PRIVACY.en), /Wayl is an independent company/);
  assert.match(fullText(PRIVACY.ar), /أحداث بسيطة/);
  assert.match(fullText(PRIVACY.ar), /Wayl شركة مستقلة/);
});

test("the privacy policy promises what the product actually does: no selling, no ads, card details never reach us", () => {
  assert.match(fullText(PRIVACY.en), /don't sell your personal data/i);
  assert.match(fullText(PRIVACY.en), /card details never pass through our servers/i);
  assert.match(fullText(PRIVACY.ar), /لا نبيع بياناتك الشخصية/);
  assert.match(fullText(PRIVACY.ar), /لا تمرّ بخوادمنا/);
});

test("every document ends with a way to reach us", () => {
  for (const pair of [TERMS, PRIVACY]) {
    for (const document of [pair.en, pair.ar]) {
      const last = document.sections.at(-1)!;
      assert.ok((last.paragraphs ?? []).some((paragraph) => paragraph.includes(SUPPORT_EMAIL)));
    }
  }
});
