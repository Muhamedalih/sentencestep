// Run with `npm test`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { dedupeKeyFor } from "@/lib/email/events";
import { milestoneEmail } from "./milestone";

const origin = "https://sentencestep.com";

test("level completed, next level open: still says the next level is ready, and has no Premium link", () => {
  const email = milestoneEmail({
    origin,
    displayName: "Sam",
    event: { type: "LEVEL_COMPLETED", mode: "normal", level: 1 },
  });
  assert.equal(email.subject, "Level 1 completed");
  assert.match(email.text, /The next level is ready when you are\./);
  assert.equal(email.html.includes("/upgrade"), false);
  assert.equal(email.text.includes("/upgrade"), false);
});

test("level completed, next level Premium: never says it is ready, says it is Premium and kind about it", () => {
  const email = milestoneEmail({
    origin,
    displayName: "Sam",
    event: { type: "LEVEL_COMPLETED", mode: "normal", level: 1, nextLevelLocked: true },
  });
  assert.equal(email.subject, "Level 1 completed");
  assert.equal(/ready when you are/i.test(email.text), false);
  assert.match(email.text, /nice work/);
  assert.match(email.text, /progress and streak stay saved/);
  assert.match(email.text, /part of Premium \(a one-time payment, no auto-renewal\)/);
  assert.match(email.html, /See what Premium includes/);
  assert.ok(email.html.includes(`href="${origin}/upgrade"`));
  assert.ok(email.text.includes(`See what Premium includes: ${origin}/upgrade`));
});

test("level completed for a free learner: the button still points at learning, never at the upgrade page", () => {
  const email = milestoneEmail({
    origin,
    displayName: null,
    event: { type: "LEVEL_COMPLETED", mode: "normal", level: 2, nextLevelLocked: true },
  });
  assert.match(email.html, />Keep learning</);
  const buttonHref = /<a href="([^"]+)"[^>]*>Keep learning<\/a>/.exec(email.html)?.[1];
  assert.equal(buttonHref, `${origin}/learn`);
  assert.match(email.text, /^Hi there,/);
});

test("the Premium link and the name are escaped like every other dynamic value", () => {
  const email = milestoneEmail({
    origin: 'https://sentencestep.com"><script>',
    displayName: "<b>Sam</b>",
    event: { type: "LEVEL_COMPLETED", mode: "normal", level: 1, nextLevelLocked: true },
  });
  assert.equal(email.html.includes("<script>"), false);
  assert.equal(email.html.includes("<b>Sam</b>"), false);
  assert.match(email.html, /&lt;b&gt;Sam&lt;\/b&gt;/);
});

test("the level email is still sent once per level: the flag does not change the dedupe key", () => {
  const plain = dedupeKeyFor({ type: "LEVEL_COMPLETED", mode: "normal", level: 1 });
  const locked = dedupeKeyFor({
    type: "LEVEL_COMPLETED",
    mode: "normal",
    level: 1,
    nextLevelLocked: true,
  });
  assert.equal(plain, "LEVEL_COMPLETED:normal:1");
  assert.equal(locked, plain);
});
