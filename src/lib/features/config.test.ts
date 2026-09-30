import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  DEFAULT_FEATURE_CONFIG,
  FEATURE_IDS,
  defaultFeatureConfig,
  disabledFeatures,
  isFeatureOpenTo,
  resolveFeatures,
  sanitizeFeatureConfig,
} from "@/lib/features/config";
import type { FeatureViewer } from "@/lib/features/config";

const guest: FeatureViewer = { signedIn: false, isAdmin: false, isPremium: false };
const learner: FeatureViewer = { signedIn: true, isAdmin: false, isPremium: false };
const premium: FeatureViewer = { signedIn: true, isAdmin: false, isPremium: true };
const admin: FeatureViewer = { signedIn: true, isAdmin: true, isPremium: false };

test("defaults: every feature ships switched off", () => {
  for (const entry of Object.values(DEFAULT_FEATURE_CONFIG.features)) {
    assert.equal(entry.state, "off");
    assert.equal(entry.premiumOnly, false);
  }
});

test("defaults: a fresh config resolves to nothing enabled for anyone, admins included", () => {
  for (const viewer of [guest, learner, premium, admin]) {
    const effective = resolveFeatures(defaultFeatureConfig(), viewer);
    assert.deepEqual(effective.dictation.sections, {
      normal: false,
      stories: false,
      conversation: false,
    });
    assert.equal(effective.quests.enabled, false);
    assert.equal(effective.badges.enabled, false);
    assert.equal(effective.dailySession.enabled, false);
    assert.equal(effective.streakCalendar.enabled, false);
    assert.equal(effective.personalCards.page, false);
    assert.equal(effective.guestTeaser, false);
  }
});

test("isFeatureOpenTo: admin state is a preview only admins see", () => {
  const entry = { ...defaultFeatureConfig().features.quests, state: "admin" as const };
  assert.equal(isFeatureOpenTo(entry, learner), false);
  assert.equal(isFeatureOpenTo(entry, admin), true);
});

test("isFeatureOpenTo: premiumOnly hides it from non-premium learners but not admins", () => {
  const entry = {
    ...defaultFeatureConfig().features.quests,
    state: "on" as const,
    premiumOnly: true,
  };
  assert.equal(isFeatureOpenTo(entry, learner), false);
  assert.equal(isFeatureOpenTo(entry, premium), true);
  assert.equal(isFeatureOpenTo(entry, admin), true);
});

test("resolveFeatures: dictation honors the per-section matrix and works for guests", () => {
  const config = defaultFeatureConfig();
  config.features.dictation.state = "on";
  config.features.dictation.sections.conversation = false;
  const effective = resolveFeatures(config, guest);
  assert.deepEqual(effective.dictation.sections, {
    normal: true,
    stories: true,
    conversation: false,
  });
});

test("resolveFeatures: account features need a signed-in learner and produce a guest teaser instead", () => {
  const config = defaultFeatureConfig();
  config.features.quests.state = "on";
  config.features.badges.state = "on";

  const asGuest = resolveFeatures(config, guest);
  assert.equal(asGuest.quests.enabled, false);
  assert.equal(asGuest.badges.enabled, false);
  assert.equal(asGuest.guestTeaser, true);

  const asLearner = resolveFeatures(config, learner);
  assert.equal(asLearner.quests.enabled, true);
  assert.equal(asLearner.badges.enabled, true);
  assert.equal(asLearner.guestTeaser, false);
});

test("resolveFeatures: a guest teaser is not shown for an admin-only preview a guest can't see", () => {
  const config = defaultFeatureConfig();
  config.features.quests.state = "admin";
  assert.equal(resolveFeatures(config, guest).guestTeaser, false);
});

test("resolveFeatures: personal cards save button never appears in conversation lessons", () => {
  const config = defaultFeatureConfig();
  config.features.personalCards.state = "on";
  const effective = resolveFeatures(config, learner);
  assert.equal(effective.personalCards.page, true);
  assert.deepEqual(effective.personalCards.saveSections, {
    normal: true,
    stories: true,
    conversation: false,
  });
});

test("sanitizeFeatureConfig: garbage in, defaults out", () => {
  assert.deepEqual(sanitizeFeatureConfig(null), defaultFeatureConfig());
  assert.deepEqual(sanitizeFeatureConfig("nope"), defaultFeatureConfig());
  assert.deepEqual(sanitizeFeatureConfig([]), defaultFeatureConfig());
  assert.deepEqual(sanitizeFeatureConfig({ features: 5, options: [] }), defaultFeatureConfig());
});

test("sanitizeFeatureConfig: keeps valid values, drops unknown ones, clamps numbers", () => {
  const config = sanitizeFeatureConfig({
    features: {
      quests: { state: "on", premiumOnly: true },
      dictation: { state: "bogus", sections: { normal: false, unknown: false } },
      notAFeature: { state: "on" },
    },
    options: {
      dailySession: { size: 9999, xpReward: -5, sources: { personalCards: true } },
      streakCalendar: { monthlyFreezes: 99 },
      quests: { types: { sentences: { enabled: false, target: 0, xp: 1000 } } },
      badges: { disabled: ["streak7", "notABadge", 12, "streak7"] },
    },
  });

  assert.equal(config.features.quests.state, "on");
  assert.equal(config.features.quests.premiumOnly, true);
  assert.equal(config.features.dictation.state, "off");
  assert.equal(config.features.dictation.sections.normal, false);
  assert.equal(config.features.dictation.sections.stories, true);
  assert.equal("notAFeature" in config.features, false);
  assert.equal(config.options.dailySession.size, 30);
  assert.equal(config.options.dailySession.xpReward, 0);
  assert.equal(config.options.dailySession.sources.personalCards, true);
  assert.equal(config.options.dailySession.sources.mistakesAndWeakWords, true);
  assert.equal(config.options.streakCalendar.monthlyFreezes, 10);
  assert.equal(config.options.quests.types.sentences.enabled, false);
  assert.equal(config.options.quests.types.sentences.target, 1);
  assert.equal(config.options.quests.types.sentences.xp, 100);
  assert.deepEqual(config.options.badges.disabled, ["streak7"]);
});

test("sanitizeFeatureConfig: is idempotent", () => {
  const once = sanitizeFeatureConfig({
    features: { badges: { state: "admin" } },
    options: { dailySession: { size: 20 } },
  });
  assert.deepEqual(sanitizeFeatureConfig(once), once);
});

test("resolveFeatures: activity is tracked whenever the streak feature isn't Off, even in admin preview for a normal learner", () => {
  const config = defaultFeatureConfig();
  assert.equal(resolveFeatures(config, learner).streakCalendar.trackActivity, false);
  config.features.streakCalendar.state = "admin";
  const asLearner = resolveFeatures(config, learner);
  assert.equal(asLearner.streakCalendar.enabled, false);
  assert.equal(asLearner.streakCalendar.trackActivity, true);
  config.features.streakCalendar.state = "on";
  assert.equal(resolveFeatures(config, learner).streakCalendar.trackActivity, true);
});

test("resolveFeatures: badges also need the activity log (sentence-count badges are measured from it)", () => {
  const config = defaultFeatureConfig();
  config.features.badges.state = "on";
  assert.equal(resolveFeatures(config, learner).streakCalendar.trackActivity, true);
});

test("disabledFeatures: nothing on, regardless of sign-in", () => {
  assert.equal(disabledFeatures(true).quests.enabled, false);
  assert.equal(disabledFeatures(false).guestTeaser, false);
});

test("the admin-preview seed migration switches every feature to admin and nothing else", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20250321000000_feature_settings_admin_preview.sql"),
    "utf8",
  );
  const body = /\$json\$([\s\S]*?)\$json\$/.exec(sql)?.[1];
  assert.ok(body, "the seed document must be dollar-quoted as $json$ ... $json$");
  const seed = JSON.parse(body) as { features: Record<string, { state: string }> };

  assert.deepEqual(Object.keys(seed.features).sort(), [...FEATURE_IDS].sort());
  for (const id of FEATURE_IDS) assert.equal(seed.features[id]?.state, "admin");

  const config = sanitizeFeatureConfig(seed);
  for (const id of FEATURE_IDS) {
    assert.equal(config.features[id].state, "admin");
    assert.equal(config.features[id].premiumOnly, false);
  }
  // Everyone but an admin sees nothing; an admin sees the features.
  for (const viewer of [guest, learner, premium]) {
    const effective = resolveFeatures(config, viewer);
    assert.equal(effective.quests.enabled, false);
    assert.equal(effective.badges.enabled, false);
    assert.equal(effective.dailySession.enabled, false);
    assert.equal(effective.streakCalendar.enabled, false);
    assert.equal(effective.personalCards.page, false);
    assert.equal(effective.dictation.sections.normal, false);
    assert.equal(effective.fromMemory.sections.normal, false);
  }
  const asAdmin = resolveFeatures(config, admin);
  assert.equal(asAdmin.quests.enabled, true);
  assert.equal(asAdmin.dictation.sections.normal, true);
  assert.equal(asAdmin.fromMemory.sections.conversation, true);
  assert.equal(asAdmin.personalCards.page, true);
});
