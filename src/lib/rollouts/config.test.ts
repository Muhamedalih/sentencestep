import { test } from "node:test";
import assert from "node:assert/strict";

import { ROLLOUT_IDS, ROLLOUTS } from "./catalog";
import {
  MAX_ROLLOUT_EMAILS,
  closedRollouts,
  defaultRolloutConfig,
  evaluateRollouts,
  isRolloutOpen,
  normalizeEmail,
  parseEmailList,
  sanitizeRolloutConfig,
  sanitizeRolloutEntry,
  visitorShare,
} from "./config";
import type { RolloutEntry, RolloutViewer } from "./config";

const guest: RolloutViewer = { isAdmin: false, email: null, preview: false };
const learner: RolloutViewer = { isAdmin: false, email: "Sara@Example.com", preview: false };
const stranger: RolloutViewer = { isAdmin: false, email: "other@example.com", preview: false };
const admin: RolloutViewer = { isAdmin: true, email: "boss@example.com", preview: false };
const previewing: RolloutViewer = { isAdmin: false, email: null, preview: true };

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
  assert.equal(isRolloutOpen(closed, admin), true);
  assert.equal(isRolloutOpen(closed, previewing), true);
  assert.equal(
    isRolloutOpen(closed, learner),
    false,
    "a listed email does nothing outside the emails mode",
  );
  assert.equal(isRolloutOpen(closed, guest), false);
});

test("isRolloutOpen: Specific people opens for the listed emails (any letter case) plus admins", () => {
  const listed = entry({ mode: "emails", emails: ["sara@example.com"] });
  assert.equal(isRolloutOpen(listed, learner), true);
  assert.equal(isRolloutOpen(listed, stranger), false);
  assert.equal(isRolloutOpen(listed, guest), false);
  assert.equal(isRolloutOpen(listed, admin), true);
  assert.equal(isRolloutOpen(listed, previewing), true);
});

test("isRolloutOpen: Everyone opens for everyone, guests included", () => {
  const open = entry({ mode: "everyone" });
  for (const viewer of [guest, learner, stranger, admin, previewing]) {
    assert.equal(isRolloutOpen(open, viewer), true);
  }
});

test("evaluateRollouts: default config opens everything for admins only", () => {
  const config = defaultRolloutConfig();
  assert.deepEqual(Object.values(evaluateRollouts(config, guest)), [
    false,
    false,
    false,
    false,
    false,
  ]);
  assert.deepEqual(Object.values(evaluateRollouts(config, admin)), [true, true, true, true, true]);
  assert.deepEqual(closedRollouts(), {
    levelFloor: false,
    sessionEnd: false,
    sessionReminders: false,
    shortFirstRun: false,
    todaySession: false,
  });
});

test("visitorShare: 0 unless open to everyone, then the chosen percent", () => {
  assert.equal(visitorShare(entry({ mode: "admin", percent: 50 })), 0);
  assert.equal(visitorShare(entry({ mode: "emails", percent: 50 })), 0);
  assert.equal(visitorShare(entry({ mode: "everyone", percent: 50 })), 50);
  assert.equal(visitorShare(entry({ mode: "everyone", percent: 100 })), 100);
});
