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
