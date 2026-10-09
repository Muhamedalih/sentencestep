import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  DEFAULT_FEATURE_CONFIG,
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

test("dictation checks letter by letter unless an admin turns it off, and a saved config without the option keeps the default", () => {
  assert.equal(defaultFeatureConfig().options.dictation.letterByLetter, true);
  // A settings row saved before the option existed.
  const legacy = sanitizeFeatureConfig({ options: { dictation: { showWordBlanks: false } } });
  assert.equal(legacy.options.dictation.letterByLetter, true);
  assert.equal(legacy.options.dictation.showWordBlanks, false);

  const exam = sanitizeFeatureConfig({ options: { dictation: { letterByLetter: false } } });
  assert.equal(exam.options.dictation.letterByLetter, false);
  assert.equal(resolveFeatures(exam, guest).dictation.letterByLetter, false);
  assert.equal(resolveFeatures(defaultFeatureConfig(), guest).dictation.letterByLetter, true);
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

/** The seven features that existed when 20250321000000_feature_settings_admin_preview.sql was written. Later features get their own migration (see the smartWords one below). */
const FIRST_ROLLOUT_FEATURE_IDS = [
  "dictation",
  "fromMemory",
  "personalCards",
  "dailySession",
  "quests",
  "badges",
  "streakCalendar",
] as const;

test("the admin-preview seed migration switches every first-rollout feature to admin and nothing else", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20250321000000_feature_settings_admin_preview.sql"),
    "utf8",
  );
  const body = /\$json\$([\s\S]*?)\$json\$/.exec(sql)?.[1];
  assert.ok(body, "the seed document must be dollar-quoted as $json$ ... $json$");
  const seed = JSON.parse(body) as { features: Record<string, { state: string }> };

  assert.deepEqual(Object.keys(seed.features).sort(), [...FIRST_ROLLOUT_FEATURE_IDS].sort());
  for (const id of FIRST_ROLLOUT_FEATURE_IDS) assert.equal(seed.features[id]?.state, "admin");

  const config = sanitizeFeatureConfig(seed);
  for (const id of FIRST_ROLLOUT_FEATURE_IDS) {
    assert.equal(config.features[id].state, "admin");
    assert.equal(config.features[id].premiumOnly, false);
  }
  // A feature added later is not in this seed, so it keeps the shipped default (off).
  assert.equal(config.features.smartWords.state, "off");
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

test("smartWords: off for everyone by default, admin preview shows it to admins only, On to everyone", () => {
  const config = defaultFeatureConfig();
  assert.equal(config.features.smartWords.state, "off");
  for (const viewer of [guest, learner, premium, admin]) {
    assert.deepEqual(resolveFeatures(config, viewer).smartWords, { enabled: false, spaced: false });
  }

  config.features.smartWords.state = "admin";
  assert.deepEqual(resolveFeatures(config, guest).smartWords, { enabled: false, spaced: false });
  assert.deepEqual(resolveFeatures(config, learner).smartWords, { enabled: false, spaced: false });
  assert.deepEqual(resolveFeatures(config, premium).smartWords, { enabled: false, spaced: false });
  assert.deepEqual(resolveFeatures(config, admin).smartWords, { enabled: true, spaced: true });

  config.features.smartWords.state = "on";
  assert.deepEqual(resolveFeatures(config, learner).smartWords, { enabled: true, spaced: true });
});

test("smartWords: a guest gets the practice upgrades but not the schedule, which needs an account", () => {
  const config = defaultFeatureConfig();
  config.features.smartWords.state = "on";
  assert.deepEqual(resolveFeatures(config, guest).smartWords, { enabled: true, spaced: false });
  // It is not an account feature, so it never produces a "sign in to unlock" teaser.
  assert.equal(resolveFeatures(config, guest).guestTeaser, false);
});

test("smartWords: premium-only holds it back from free learners and still lets admins through", () => {
  const config = defaultFeatureConfig();
  config.features.smartWords.state = "on";
  config.features.smartWords.premiumOnly = true;
  assert.equal(resolveFeatures(config, learner).smartWords.enabled, false);
  assert.equal(resolveFeatures(config, premium).smartWords.enabled, true);
  assert.equal(resolveFeatures(config, admin).smartWords.enabled, true);
});

test("smartWords: a settings document saved before the feature existed keeps it off", () => {
  const legacy = sanitizeFeatureConfig({ features: { dictation: { state: "on" } } });
  assert.equal(legacy.features.smartWords.state, "off");
  assert.equal(resolveFeatures(legacy, admin).smartWords.enabled, false);
});

test("the smartWords seed migration puts only that feature in admin preview and never overwrites a saved choice", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20250325000000_feature_settings_smart_words.sql"),
    "utf8",
  );
  const body = /\$json\$([\s\S]*?)\$json\$/.exec(sql)?.[1];
  assert.ok(body, "the seed entry must be dollar-quoted as $json$ ... $json$");
  const entry = JSON.parse(body) as { state: string };
  assert.equal(entry.state, "admin");
  // Only touches a document that does not already say anything about this feature.
  assert.match(sql, /not \(coalesce\(config -> 'features', '\{\}'::jsonb\) \? 'smartWords'\)/);
  // Everything else in the document is left alone: it only sets this one path.
  assert.match(sql, /jsonb_set\(/);
});

test("wordsRedesign: off for everyone by default, admin preview shows it to admins only, On to everyone", () => {
  const config = defaultFeatureConfig();
  assert.equal(config.features.wordsRedesign.state, "off");
  for (const viewer of [guest, learner, premium, admin]) {
    assert.deepEqual(resolveFeatures(config, viewer).wordsRedesign, { enabled: false });
  }

  config.features.wordsRedesign.state = "admin";
  for (const viewer of [guest, learner, premium]) {
    assert.deepEqual(resolveFeatures(config, viewer).wordsRedesign, { enabled: false });
  }
  assert.deepEqual(resolveFeatures(config, admin).wordsRedesign, { enabled: true });

  // Publishing is that one switch: guests and learners get it too, nothing else changes.
  config.features.wordsRedesign.state = "on";
  for (const viewer of [guest, learner, premium, admin]) {
    assert.deepEqual(resolveFeatures(config, viewer).wordsRedesign, { enabled: true });
  }
  // Not an account feature, so it never produces a "sign in to unlock" teaser.
  assert.equal(resolveFeatures(config, guest).guestTeaser, false);
});

test("wordsRedesign: independent of smartWords", () => {
  const config = defaultFeatureConfig();
  config.features.wordsRedesign.state = "on";
  const effective = resolveFeatures(config, learner);
  assert.equal(effective.wordsRedesign.enabled, true);
  assert.equal(effective.smartWords.enabled, false);
});

test("wordsRedesign: a settings document saved before the feature existed keeps it off", () => {
  const legacy = sanitizeFeatureConfig({ features: { smartWords: { state: "on" } } });
  assert.equal(legacy.features.wordsRedesign.state, "off");
  assert.equal(resolveFeatures(legacy, admin).wordsRedesign.enabled, false);
});

test("the wordsRedesign seed migration puts only that feature in admin preview and never overwrites a saved choice", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20250327000000_feature_settings_words_redesign.sql"),
    "utf8",
  );
  const body = /\$json\$([\s\S]*?)\$json\$/.exec(sql)?.[1];
  assert.ok(body, "the seed entry must be dollar-quoted as $json$ ... $json$");
  const entry = JSON.parse(body) as { state: string };
  assert.equal(entry.state, "admin");
  assert.match(sql, /not \(coalesce\(config -> 'features', '\{\}'::jsonb\) \? 'wordsRedesign'\)/);
  assert.match(sql, /jsonb_set\(/);
});

test("wordQuiz: off for everyone by default, admin preview shows it to admins only, On to everyone", () => {
  const config = defaultFeatureConfig();
  assert.equal(config.features.wordQuiz.state, "off");
  for (const viewer of [guest, learner, premium, admin]) {
    assert.deepEqual(resolveFeatures(config, viewer).wordQuiz, { enabled: false });
  }

  config.features.wordQuiz.state = "admin";
  for (const viewer of [guest, learner, premium]) {
    assert.deepEqual(resolveFeatures(config, viewer).wordQuiz, { enabled: false });
  }
  assert.deepEqual(resolveFeatures(config, admin).wordQuiz, { enabled: true });

  // Publishing is that one switch: guests and learners get it too, nothing else changes.
  config.features.wordQuiz.state = "on";
  for (const viewer of [guest, learner, premium, admin]) {
    assert.deepEqual(resolveFeatures(config, viewer).wordQuiz, { enabled: true });
  }
  // Not an account feature, so it never produces a "sign in to unlock" teaser.
  assert.equal(resolveFeatures(config, guest).guestTeaser, false);
});

test("wordQuiz: premium-only holds it back from free learners and still lets admins through", () => {
  const config = defaultFeatureConfig();
  config.features.wordQuiz.state = "on";
  config.features.wordQuiz.premiumOnly = true;
  assert.equal(resolveFeatures(config, learner).wordQuiz.enabled, false);
  assert.equal(resolveFeatures(config, premium).wordQuiz.enabled, true);
  assert.equal(resolveFeatures(config, admin).wordQuiz.enabled, true);
});

test("wordQuiz: independent of every other feature", () => {
  const config = defaultFeatureConfig();
  config.features.wordQuiz.state = "on";
  const effective = resolveFeatures(config, learner);
  assert.equal(effective.wordQuiz.enabled, true);
  assert.equal(effective.dictation.sections.stories, false);
  assert.equal(effective.smartWords.enabled, false);
  assert.equal(effective.wordsRedesign.enabled, false);
});

test("wordQuiz: a settings document saved before the feature existed keeps it off", () => {
  const legacy = sanitizeFeatureConfig({ features: { wordsRedesign: { state: "on" } } });
  assert.equal(legacy.features.wordQuiz.state, "off");
  assert.equal(resolveFeatures(legacy, admin).wordQuiz.enabled, false);
});

test("the wordQuiz seed migration puts only that feature in admin preview and never overwrites a saved choice", () => {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/20250331000000_feature_settings_word_quiz.sql"),
    "utf8",
  );
  const body = /\$json\$([\s\S]*?)\$json\$/.exec(sql)?.[1];
  assert.ok(body, "the seed entry must be dollar-quoted as $json$ ... $json$");
  const entry = JSON.parse(body) as { state: string };
  assert.equal(entry.state, "admin");
  assert.match(sql, /not \(coalesce\(config -> 'features', '\{\}'::jsonb\) \? 'wordQuiz'\)/);
  assert.match(sql, /jsonb_set\(/);
});
