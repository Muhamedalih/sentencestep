import { test } from "node:test";
import assert from "node:assert/strict";

import { ROLLOUT_IDS, ROLLOUTS } from "./catalog";
import {
  MAX_ROLLOUT_EMAILS,
  closedRollouts,
  defaultRolloutConfig,
  evaluateRollouts,
  isRolloutOpen,
  learnerSharePercent,
  rolloutBucket,
  normalizeEmail,
  parseEmailList,
  sanitizeRolloutConfig,
  sanitizeRolloutEntry,
  visitorShare,
  withRolloutDependencies,
} from "./config";
import type { RolloutEntry, RolloutViewer } from "./config";

const guest: RolloutViewer = { isAdmin: false, userId: null, email: null, preview: false };
const learner: RolloutViewer = {
  isAdmin: false,
  userId: "user-sara",
  email: "Sara@Example.com",
  preview: false,
};
const stranger: RolloutViewer = {
  isAdmin: false,
  userId: "user-other",
  email: "other@example.com",
  preview: false,
};
const admin: RolloutViewer = {
  isAdmin: true,
  userId: "user-boss",
  email: "boss@example.com",
  preview: false,
};
const previewing: RolloutViewer = { isAdmin: false, userId: null, email: null, preview: true };

function entry(overrides: Partial<RolloutEntry> = {}): RolloutEntry {
  return { mode: "admin", percent: 100, emails: [], ...overrides };
}

test("every feature starts as Admins only", () => {
  const config = defaultRolloutConfig();
  for (const id of ROLLOUT_IDS) {
    assert.equal(config[id].mode, "admin", id);
    assert.deepEqual(config[id].emails, [], id);
  }
});

test("every feature in the catalog has a title, a description and a known audience", () => {
  for (const id of ROLLOUT_IDS) {
    const def = ROLLOUTS[id];
    assert.equal(def.id, id);
    assert.ok(def.title.length > 3, id);
    assert.ok(def.description.length > 40, id);
    assert.ok(def.audience === "learner" || def.audience === "visitor", id);
  }
});

test("normalizeEmail: trims, lowercases and rejects what is not an email", () => {
  assert.equal(normalizeEmail("  Sara@Example.COM "), "sara@example.com");
  assert.equal(normalizeEmail("not an email"), null);
  assert.equal(normalizeEmail("a@b"), null);
  assert.equal(normalizeEmail("<x>@y.com"), null);
  assert.equal(normalizeEmail(""), null);
  assert.equal(normalizeEmail(`${"a".repeat(250)}@example.com`), null);
});

test("parseEmailList: one per line, commas, semicolons or spaces; unique; invalid ones reported", () => {
  const parsed = parseEmailList("a@x.com\nB@X.com, c@x.com; a@x.com  oops\n\n d@x.com");
  assert.deepEqual(parsed.emails, ["a@x.com", "b@x.com", "c@x.com", "d@x.com"]);
  assert.deepEqual(parsed.invalid, ["oops"]);
  assert.deepEqual(parseEmailList("  \n "), { emails: [], invalid: [] });
});

test("sanitizeRolloutEntry: an unknown mode is Admins only, and the percent is kept in range", () => {
  assert.equal(sanitizeRolloutEntry("sessionEnd", { mode: "everybody" }).mode, "admin");
  assert.equal(sanitizeRolloutEntry("sessionEnd", null).mode, "admin");
  assert.equal(
    sanitizeRolloutEntry("shortFirstRun", { mode: "everyone", percent: 250 }).percent,
    100,
  );
  assert.equal(sanitizeRolloutEntry("shortFirstRun", { mode: "everyone", percent: -3 }).percent, 1);
  assert.equal(
    sanitizeRolloutEntry("shortFirstRun", { mode: "everyone", percent: "x" }).percent,
    50,
  );
});

test("sanitizeRolloutEntry: a feature for first-time visitors cannot use a list of emails", () => {
  assert.equal(
    sanitizeRolloutEntry("shortFirstRun", { mode: "emails", emails: ["a@x.com"] }).mode,
    "admin",
  );
  assert.equal(
    sanitizeRolloutEntry("sessionEnd", { mode: "emails", emails: ["a@x.com"] }).mode,
    "emails",
  );
});

test("sanitizeRolloutEntry: the email list is cleaned, de-duplicated and capped", () => {
  const cleaned = sanitizeRolloutEntry("sessionEnd", {
    mode: "emails",
    emails: [" A@x.com ", "a@x.com", "junk", 7, "b@x.com"],
  });
  assert.deepEqual(cleaned.emails, ["a@x.com", "b@x.com"]);
  const many = Array.from(
    { length: MAX_ROLLOUT_EMAILS + 40 },
    (_unused, index) => `u${index}@x.com`,
  );
  assert.equal(
    sanitizeRolloutEntry("sessionEnd", { mode: "emails", emails: many }).emails.length,
    MAX_ROLLOUT_EMAILS,
  );
});

test("sanitizeRolloutConfig: a feature with no row stays Admins only, unknown features are ignored", () => {
  const config = sanitizeRolloutConfig([
    { feature: "sessionEnd", mode: "everyone", percent: 100, emails: [] },
    { feature: "notAFeature", mode: "everyone" },
    "garbage",
  ]);
  assert.equal(config.sessionEnd.mode, "everyone");
  assert.equal(config.levelFloor.mode, "admin");
  assert.deepEqual(Object.keys(config).sort(), [...ROLLOUT_IDS].sort());
  assert.equal(sanitizeRolloutConfig(null).sessionEnd.mode, "admin");
});

test("isRolloutOpen: Admins only opens for admins and an admin's preview browser, nobody else", () => {
  const closed = entry({ mode: "admin", emails: ["sara@example.com"] });
  assert.equal(isRolloutOpen(closed, admin, "sessionEnd"), true);
  assert.equal(isRolloutOpen(closed, previewing, "sessionEnd"), true);
  assert.equal(
    isRolloutOpen(closed, learner, "sessionEnd"),
    false,
    "a listed email does nothing outside the emails mode",
  );
  assert.equal(isRolloutOpen(closed, guest, "sessionEnd"), false);
});

test("isRolloutOpen: Specific people opens for the listed emails (any letter case) plus admins", () => {
  const listed = entry({ mode: "emails", emails: ["sara@example.com"] });
  assert.equal(isRolloutOpen(listed, learner, "sessionEnd"), true);
  assert.equal(isRolloutOpen(listed, stranger, "sessionEnd"), false);
  assert.equal(isRolloutOpen(listed, guest, "sessionEnd"), false);
  assert.equal(isRolloutOpen(listed, admin, "sessionEnd"), true);
  assert.equal(isRolloutOpen(listed, previewing, "sessionEnd"), true);
});

test("isRolloutOpen: Everyone opens for everyone, guests included", () => {
  const open = entry({ mode: "everyone" });
  for (const viewer of [guest, learner, stranger, admin, previewing]) {
    assert.equal(isRolloutOpen(open, viewer, "sessionEnd"), true);
  }
});

test("evaluateRollouts: default config opens everything for admins only", () => {
  const config = defaultRolloutConfig();
  assert.deepEqual(
    Object.values(evaluateRollouts(config, guest)),
    ROLLOUT_IDS.map(() => false),
  );
  assert.deepEqual(
    Object.values(evaluateRollouts(config, admin)),
    ROLLOUT_IDS.map(() => true),
  );
  assert.deepEqual(closedRollouts(), {
    levelFloor: false,
    sessionEnd: false,
    sessionReminders: false,
    shortFirstRun: false,
    inAppStrip: false,
    todaySession: false,
    sentenceBank: false,
    newHome: false,
    wordBank: false,
    redeemCodes: false,
    storyRecall: false,
    hybridOffers: false,
  });
});

test("story words in Recall: Admins only until opened, and independent of Today's session", () => {
  const config = defaultRolloutConfig();
  assert.equal(evaluateRollouts(config, admin).storyRecall, true);
  assert.equal(evaluateRollouts(config, learner).storyRecall, false);
  assert.equal(evaluateRollouts(config, guest).storyRecall, false);
  // Opened for everyone it does not wait for Today's session: it is about a story's words, not Today's box.
  config.storyRecall = entry({ mode: "everyone" });
  assert.equal(withRolloutDependencies(evaluateRollouts(config, learner)).storyRecall, true);
  assert.equal(
    withRolloutDependencies({ ...evaluateRollouts(config, learner), todaySession: false })
      .storyRecall,
    true,
  );
});

test("the sentence bank lives inside Today's box: it is never open without Today's session", () => {
  const open = evaluateRollouts(defaultRolloutConfig(), admin);
  assert.equal(withRolloutDependencies(open).sentenceBank, true);
  assert.equal(withRolloutDependencies({ ...open, todaySession: false }).sentenceBank, false);
  assert.equal(withRolloutDependencies({ ...open, sentenceBank: false }).sentenceBank, false);
  // Nothing else is touched, and the answer it was given is not changed.
  const before = { ...open, todaySession: false };
  const after = withRolloutDependencies(before);
  assert.deepEqual(
    { ...after, sentenceBank: true, newHome: true, wordBank: true, hybridOffers: true },
    { ...before, sentenceBank: true, newHome: true, wordBank: true, hybridOffers: true },
  );
  assert.equal(before.sentenceBank, true);
  // A plain learner has neither on the default settings.
  const learnerAccess = evaluateRollouts(defaultRolloutConfig(), learner);
  assert.equal(withRolloutDependencies(learnerAccess).sentenceBank, false);
});

test("the new Home page is built from Today's tasks: it is never open without Today's session", () => {
  const open = evaluateRollouts(defaultRolloutConfig(), admin);
  assert.equal(withRolloutDependencies(open).newHome, true);
  assert.equal(withRolloutDependencies({ ...open, todaySession: false }).newHome, false);
  assert.equal(withRolloutDependencies({ ...open, newHome: false }).newHome, false);
  // Its own setting alone does not open it for a learner whose Today's session is closed.
  const config = defaultRolloutConfig();
  config.newHome = entry({ mode: "everyone" });
  const everyone = withRolloutDependencies(evaluateRollouts(config, learner));
  assert.equal(everyone.newHome, false);
  config.todaySession = entry({ mode: "everyone" });
  assert.equal(withRolloutDependencies(evaluateRollouts(config, learner)).newHome, true);
  // A plain learner has it on neither default setting.
  assert.equal(
    withRolloutDependencies(evaluateRollouts(defaultRolloutConfig(), learner)).newHome,
    false,
  );
});

test("the words bank is fed by Today's words step: it is never open without Today's session", () => {
  const open = evaluateRollouts(defaultRolloutConfig(), admin);
  assert.equal(withRolloutDependencies(open).wordBank, true);
  assert.equal(withRolloutDependencies({ ...open, todaySession: false }).wordBank, false);
  assert.equal(withRolloutDependencies({ ...open, wordBank: false }).wordBank, false);
  // Its own setting alone does not open it for a learner whose Today's session is closed.
  const config = defaultRolloutConfig();
  config.wordBank = entry({ mode: "everyone" });
  assert.equal(withRolloutDependencies(evaluateRollouts(config, learner)).wordBank, false);
  config.todaySession = entry({ mode: "everyone" });
  assert.equal(withRolloutDependencies(evaluateRollouts(config, learner)).wordBank, true);
  // A plain learner has it on neither default setting, and a guest never does.
  assert.equal(
    withRolloutDependencies(evaluateRollouts(defaultRolloutConfig(), learner)).wordBank,
    false,
  );
  assert.equal(
    withRolloutDependencies(evaluateRollouts(defaultRolloutConfig(), guest)).wordBank,
    false,
  );
});

test("hybrid offers: Admins only by default, and never open without Today's session", () => {
  const open = evaluateRollouts(defaultRolloutConfig(), admin);
  assert.equal(open.hybridOffers, true);
  assert.equal(evaluateRollouts(defaultRolloutConfig(), learner).hybridOffers, false);
  assert.equal(evaluateRollouts(defaultRolloutConfig(), guest).hybridOffers, false);
  assert.equal(withRolloutDependencies(open).hybridOffers, true);
  assert.equal(withRolloutDependencies({ ...open, todaySession: false }).hybridOffers, false);
  // Its own setting alone does not open it for a learner whose Today's session is closed.
  const config = defaultRolloutConfig();
  config.hybridOffers = entry({ mode: "everyone", percent: 90 });
  const share = withRolloutDependencies(evaluateRollouts(config, learner));
  assert.equal(share.hybridOffers, false);
  config.todaySession = entry({ mode: "everyone" });
  assert.equal(
    withRolloutDependencies(evaluateRollouts(config, learner)).hybridOffers,
    rolloutBucket(learner.userId!, "hybridOffers") < 90,
  );
});

test("visitorShare: 0 unless open to everyone, then the chosen percent", () => {
  assert.equal(visitorShare(entry({ mode: "admin", percent: 50 })), 0);
  assert.equal(visitorShare(entry({ mode: "emails", percent: 50 })), 0);
  assert.equal(visitorShare(entry({ mode: "everyone", percent: 50 })), 50);
  assert.equal(visitorShare(entry({ mode: "everyone", percent: 100 })), 100);
});

function viewerOf(index: number): RolloutViewer {
  return { isAdmin: false, userId: `user-${index}`, email: null, preview: false };
}

test("a share of learners: stable per account, roughly the chosen size, admins always, guests never", () => {
  const share = entry({ mode: "everyone", percent: 30 });
  let inside = 0;
  for (let index = 0; index < 4000; index++) {
    const viewer = viewerOf(index);
    const open = isRolloutOpen(share, viewer, "todaySession");
    assert.equal(
      open,
      isRolloutOpen(share, viewer, "todaySession"),
      "the same account, the same answer",
    );
    assert.equal(open, rolloutBucket(viewer.userId!, "todaySession") < 30);
    if (open) inside++;
  }
  assert.ok(inside > 1080 && inside < 1320, `30% of 4000 is about 1200, got ${inside}`);
  assert.equal(isRolloutOpen(share, admin, "todaySession"), true);
  assert.equal(isRolloutOpen(share, previewing, "todaySession"), true);
  assert.equal(isRolloutOpen(share, guest, "todaySession"), false);
});

test("a share is nested (a bigger share keeps everyone a smaller one had) and independent between features", () => {
  const small = entry({ mode: "everyone", percent: 20 });
  const big = entry({ mode: "everyone", percent: 60 });
  let both = 0;
  let today = 0;
  let ending = 0;
  for (let index = 0; index < 4000; index++) {
    const viewer = viewerOf(index);
    if (isRolloutOpen(small, viewer, "todaySession")) {
      assert.equal(isRolloutOpen(big, viewer, "todaySession"), true);
    }
    const a = rolloutBucket(viewer.userId!, "todaySession") < 50;
    const b = rolloutBucket(viewer.userId!, "sessionEnd") < 50;
    if (a) today++;
    if (b) ending++;
    if (a && b) both++;
  }
  const expected = (today * ending) / 4000;
  assert.ok(
    Math.abs(both - expected) < 120,
    `two 50% shares overlap about ${expected}, got ${both}`,
  );
});

test("100% is everybody, guests included, and a share is not an Admins-only setting", () => {
  const all = entry({ mode: "everyone", percent: 100 });
  assert.equal(learnerSharePercent("todaySession", all), null);
  assert.equal(isRolloutOpen(all, guest, "todaySession"), true);
  assert.equal(learnerSharePercent("todaySession", entry({ mode: "everyone", percent: 40 })), 40);
  assert.equal(learnerSharePercent("todaySession", entry({ mode: "admin", percent: 40 })), null);
  assert.equal(
    isRolloutOpen(entry({ mode: "admin", percent: 40 }), viewerOf(1), "todaySession"),
    false,
  );
});

test("a visitor-aimed feature keeps deciding its share in the browser: the server says yes to everyone", () => {
  const share = entry({ mode: "everyone", percent: 10 });
  assert.equal(learnerSharePercent("shortFirstRun", share), null);
  assert.equal(isRolloutOpen(share, guest, "shortFirstRun"), true);
});
