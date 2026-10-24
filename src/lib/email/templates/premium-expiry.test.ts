// Run with `npm run test:email`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { premiumExpiryEmail } from "./premium-expiry";

const base = {
  origin: "https://sentencestep.example",
  displayName: "Sara",
  endsOn: "2 February 2027",
  daysLeft: 3,
  streak: 0,
};

test("premiumExpiryEmail: names the end date, says nothing is lost, and links to the upgrade page", () => {
  const email = premiumExpiryEmail(base);

  assert.equal(email.subject, "Your SentenceStep Premium ends on 2 February 2027");
  assert.ok(email.html.includes("Your Premium ends on 2 February 2027"));
  assert.ok(email.html.includes("progress, streak and XP stay saved"));
  assert.ok(email.html.includes("https://sentencestep.example/upgrade"));
  assert.ok(email.text.includes("https://sentencestep.example/upgrade"));
});

test("premiumExpiryEmail: mentions a streak only when there is a real one", () => {
  assert.ok(!premiumExpiryEmail(base).html.includes("streak."));
  assert.ok(!premiumExpiryEmail(base).text.includes("-day streak"));

  const withStreak = premiumExpiryEmail({ ...base, streak: 12 });
  assert.ok(withStreak.html.includes("You&#39;re on a 12-day streak."));
  assert.ok(withStreak.text.includes("You're on a 12-day streak."));
});

test("premiumExpiryEmail: states no price and uses the account-notice footer", () => {
  const email = premiumExpiryEmail({ ...base, streak: 5 });

  assert.ok(!/\$\d/.test(email.html + email.text));
  assert.ok(email.html.includes("because you have Premium access on SentenceStep"));
  assert.ok(!email.html.includes("Manage email preferences"));
});

test("premiumExpiryEmail: a learner's name cannot inject markup", () => {
  const email = premiumExpiryEmail({ ...base, displayName: `<img src=x onerror=alert(1)>` });
  assert.ok(!email.html.includes("<img"));
  assert.ok(email.html.includes("&lt;img"));
});

test("premiumExpiryEmail: Arabic is right to left, names the date and keeps the same honest content", () => {
  const email = premiumExpiryEmail({
    ...base,
    language: "ar",
    endsOn: "2 فبراير 2027",
    streak: 12,
  });

  assert.equal(email.subject, "تنتهي خطتك المميّزة في SentenceStep في 2 فبراير 2027");
  assert.ok(email.html.includes('lang="ar" dir="rtl"'));
  assert.ok(email.html.includes("أهلاً Sara،"));
  assert.ok(email.html.includes("تقدّمك وتتابعك ونقاطك محفوظة"));
  assert.ok(email.html.includes("تتابعك الحالي 12 يوماً"));
  assert.ok(email.html.includes("https://sentencestep.example/upgrade"));
  assert.ok(email.text.includes("أضف أياماً: https://sentencestep.example/upgrade"));
  assert.ok(!/\$\d/.test(email.html + email.text), "no price in any language");
});

test("premiumExpiryEmail: Arabic day counts take the right shape", () => {
  const streakLine = (streak: number) =>
    premiumExpiryEmail({ ...base, language: "ar", streak }).text;
  assert.ok(streakLine(1).includes("تتابعك الحالي يوم واحد"));
  assert.ok(streakLine(2).includes("تتابعك الحالي يومان"));
  assert.ok(streakLine(7).includes("تتابعك الحالي 7 أيام"));
  assert.ok(streakLine(30).includes("تتابعك الحالي 30 يوماً"));
});

test("premiumExpiryEmail: Spanish and Turkish are written in their own language", () => {
  const es = premiumExpiryEmail({
    ...base,
    language: "es",
    endsOn: "2 de febrero de 2027",
    streak: 5,
  });
  assert.equal(es.subject, "Tu Premium de SentenceStep termina el 2 de febrero de 2027");
  assert.ok(es.html.includes('lang="es" dir="ltr"'));
  assert.ok(es.html.includes("Llevas una racha de 5 días"));
  assert.ok(es.html.includes("tu progreso, tu racha y tus XP quedan guardados"));

  const tr = premiumExpiryEmail({ ...base, language: "tr", endsOn: "2 Şubat 2027", streak: 5 });
  assert.equal(tr.subject, "SentenceStep Premium'unuz 2 Şubat 2027 tarihinde sona eriyor");
  assert.ok(tr.html.includes('lang="tr"'));
  assert.ok(tr.html.includes("5 günlük bir serideniz var"));
});

test("premiumExpiryEmail: every language drops the streak line when there is no streak, and escapes the name", () => {
  for (const language of ["ar", "es", "tr", "en"] as const) {
    const quiet = premiumExpiryEmail({ ...base, language });
    const streaky = premiumExpiryEmail({ ...base, language, streak: 9 });
    assert.ok(streaky.text.length > quiet.text.length, language);
    const unsafe = premiumExpiryEmail({ ...base, language, displayName: "<b>x</b>" });
    assert.ok(!unsafe.html.includes("<b>x"), language);
  }
});
