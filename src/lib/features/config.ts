import {
  BADGE_IDS,
  DAILY_QUEST_COUNT,
  QUEST_DEFAULTS,
  QUEST_TYPES,
  type QuestType,
} from "@/lib/features/catalog";
import type { LearningSection } from "@/lib/admin/learning-sections";
import type { LearningMode } from "@/types/content";

/**
 * Admin-controlled availability of the engagement features (dictation,
 * from-memory, personal cards, daily session, quests, badges, streak
 * calendar). One JSON document, stored in the single-row `feature_settings`
 * table (see 20250315000000_feature_settings.sql) and edited from
 * /admin/features. Pure and dependency-free of Supabase so both the
 * server-only queries/actions and the admin form can share the exact same
 * types, defaults and resolution rules — mirrors typing-sound-settings.ts.
 */

/** off = nobody; admin = admins only (a live preview on the real site); on = everyone (subject to the premium/section rules below). */
export type FeatureState = "off" | "admin" | "on";

export const FEATURE_STATES: readonly FeatureState[] = ["off", "admin", "on"];

export const FEATURE_IDS = [
  "dictation",
  "fromMemory",
  "personalCards",
  "dailySession",
  "quests",
  "badges",
  "streakCalendar",
] as const;

export type FeatureId = (typeof FEATURE_IDS)[number];

export function isFeatureState(value: unknown): value is FeatureState {
  return value === "off" || value === "admin" || value === "on";
}

/**
 * Which learner-facing sections each feature can be scoped to. An empty list
 * means the feature is global (no per-section matrix). Deliberately only the
 * sections where the feature genuinely has somewhere to live: dictation and
 * from-memory need a LessonSession (normal/stories/conversation), and the
 * save-a-word star lives on the current-word card, which conversation
 * lessons don't have (no word-level translations).
 */
export const FEATURE_SECTIONS: Record<FeatureId, readonly LearningSection[]> = {
  dictation: ["normal", "stories", "conversation"],
  fromMemory: ["normal", "stories", "conversation"],
  personalCards: ["normal", "stories"],
  dailySession: [],
  quests: [],
  badges: [],
  streakCalendar: [],
};

/** Features that need an account to store anything — guests see a sign-in teaser instead of the feature itself. Dictation and from-memory work for everyone. */
export const ACCOUNT_FEATURES: readonly FeatureId[] = [
  "personalCards",
  "dailySession",
  "quests",
  "badges",
  "streakCalendar",
];

export interface FeatureEntry {
  state: FeatureState;
  /** When true, only Premium learners (and admins) see it. Reads the same access as every other premium gate, so it is automatically open to everyone while /admin/free-access is on. */
  premiumOnly: boolean;
  /** Per-section on/off (only meaningful for the sections in FEATURE_SECTIONS). A missing key means "on". */
  sections: Partial<Record<LearningSection, boolean>>;
}

export interface QuestTypeConfig {
  enabled: boolean;
  target: number;
  xp: number;
}

export interface DailySessionSources {
  /** Typing mistakes due for review plus the weak-word list (Fix Your Mistakes). */
  mistakesAndWeakWords: boolean;
  /** Vocabulary Recall (words met in Normal lessons and Stories). */
  vocabularyRecall: boolean;
  /** Words from Word Lists the learner hasn't locked in yet. */
  wordLists: boolean;
  /** The learner's own saved word cards that are due. */
  personalCards: boolean;
}

export interface FeatureOptions {
  dictation: { showWordBlanks: boolean; letterByLetter: boolean };
  fromMemory: { allowReveal: boolean; showFirstLetters: boolean };
  dailySession: { size: number; xpReward: number; sources: DailySessionSources };
  quests: { types: Record<QuestType, QuestTypeConfig> };
  badges: { disabled: string[] };
  streakCalendar: { monthlyFreezes: number };
}

export interface FeatureConfig {
  features: Record<FeatureId, FeatureEntry>;
  options: FeatureOptions;
}

export const DAILY_SESSION_SIZE_RANGE = { min: 5, max: 30 } as const;
export const MONTHLY_FREEZES_RANGE = { min: 0, max: 10 } as const;

function defaultEntry(id: FeatureId): FeatureEntry {
  const sections: Partial<Record<LearningSection, boolean>> = {};
  for (const section of FEATURE_SECTIONS[id]) sections[section] = true;
  return { state: "off", premiumOnly: false, sections };
}

function defaultQuestTypes(): Record<QuestType, QuestTypeConfig> {
  const types = {} as Record<QuestType, QuestTypeConfig>;
  for (const type of QUEST_TYPES) {
    types[type] = { enabled: true, ...QUEST_DEFAULTS[type] };
  }
  return types;
}

export function defaultFeatureConfig(): FeatureConfig {
  const features = {} as Record<FeatureId, FeatureEntry>;
  for (const id of FEATURE_IDS) features[id] = defaultEntry(id);
  return {
    features,
    options: {
      dictation: { showWordBlanks: true, letterByLetter: true },
      fromMemory: { allowReveal: true, showFirstLetters: true },
      dailySession: {
        size: 12,
        xpReward: 20,
        sources: {
          mistakesAndWeakWords: true,
          vocabularyRecall: false,
          wordLists: false,
          personalCards: false,
        },
      },
      quests: { types: defaultQuestTypes() },
      badges: { disabled: [] },
      streakCalendar: { monthlyFreezes: 2 },
    },
  };
}

export const DEFAULT_FEATURE_CONFIG: FeatureConfig = defaultFeatureConfig();

// --- Sanitizing (never trust stored/submitted JSON's shape) ---

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/**
 * Coerces an arbitrary value (a stored jsonb document, or an admin form
 * submission) into a fully-populated, in-range FeatureConfig. Anything
 * missing or malformed falls back to the shipped default, unknown keys are
 * dropped, numbers are clamped — so the rest of the app can treat the result
 * as trusted and total. Idempotent: sanitizing a sanitized config is a no-op.
 */
export function sanitizeFeatureConfig(raw: unknown): FeatureConfig {
  const base = defaultFeatureConfig();
  if (!isRecord(raw)) return base;

  const rawFeatures = isRecord(raw.features) ? raw.features : {};
  for (const id of FEATURE_IDS) {
    const entry = rawFeatures[id];
    if (!isRecord(entry)) continue;
    const target = base.features[id];
    if (isFeatureState(entry.state)) target.state = entry.state;
    target.premiumOnly = bool(entry.premiumOnly, target.premiumOnly);
    const rawSections = isRecord(entry.sections) ? entry.sections : {};
    for (const section of FEATURE_SECTIONS[id]) {
      target.sections[section] = bool(rawSections[section], true);
    }
  }

  const rawOptions = isRecord(raw.options) ? raw.options : {};

  const dictation = isRecord(rawOptions.dictation) ? rawOptions.dictation : {};
  base.options.dictation.showWordBlanks = bool(
    dictation.showWordBlanks,
    base.options.dictation.showWordBlanks,
  );
  base.options.dictation.letterByLetter = bool(
    dictation.letterByLetter,
    base.options.dictation.letterByLetter,
  );

  const fromMemory = isRecord(rawOptions.fromMemory) ? rawOptions.fromMemory : {};
  base.options.fromMemory.allowReveal = bool(
    fromMemory.allowReveal,
    base.options.fromMemory.allowReveal,
  );
  base.options.fromMemory.showFirstLetters = bool(
    fromMemory.showFirstLetters,
    base.options.fromMemory.showFirstLetters,
  );

  const dailySession = isRecord(rawOptions.dailySession) ? rawOptions.dailySession : {};
  base.options.dailySession.size = clampInt(
    dailySession.size,
    DAILY_SESSION_SIZE_RANGE.min,
    DAILY_SESSION_SIZE_RANGE.max,
    base.options.dailySession.size,
  );
  base.options.dailySession.xpReward = clampInt(
    dailySession.xpReward,
    0,
    100,
    base.options.dailySession.xpReward,
  );
  const rawSources = isRecord(dailySession.sources) ? dailySession.sources : {};
  const sources = base.options.dailySession.sources;
  sources.mistakesAndWeakWords = bool(
    rawSources.mistakesAndWeakWords,
    sources.mistakesAndWeakWords,
  );
  sources.vocabularyRecall = bool(rawSources.vocabularyRecall, sources.vocabularyRecall);
  sources.wordLists = bool(rawSources.wordLists, sources.wordLists);
  sources.personalCards = bool(rawSources.personalCards, sources.personalCards);

  const quests = isRecord(rawOptions.quests) ? rawOptions.quests : {};
  const rawTypes = isRecord(quests.types) ? quests.types : {};
  for (const type of QUEST_TYPES) {
    const entry = rawTypes[type];
    if (!isRecord(entry)) continue;
    const target = base.options.quests.types[type];
    target.enabled = bool(entry.enabled, target.enabled);
    target.target = clampInt(entry.target, 1, 200, target.target);
    target.xp = clampInt(entry.xp, 0, 100, target.xp);
  }

  const badges = isRecord(rawOptions.badges) ? rawOptions.badges : {};
  if (Array.isArray(badges.disabled)) {
    const known = new Set<string>(BADGE_IDS);
    base.options.badges.disabled = [
      ...new Set(
        badges.disabled.filter((id): id is string => typeof id === "string" && known.has(id)),
      ),
    ];
  }

  const streakCalendar = isRecord(rawOptions.streakCalendar) ? rawOptions.streakCalendar : {};
  base.options.streakCalendar.monthlyFreezes = clampInt(
    streakCalendar.monthlyFreezes,
    MONTHLY_FREEZES_RANGE.min,
    MONTHLY_FREEZES_RANGE.max,
    base.options.streakCalendar.monthlyFreezes,
  );

  return base;
}

// --- Resolution: config + who is looking -> what they actually get ---

export interface FeatureViewer {
  signedIn: boolean;
  isAdmin: boolean;
  /** Real premium access — already true for everyone while the sitewide free promotion is on (see getAccessState). */
  isPremium: boolean;
}

/** True when this viewer is allowed to see a feature at all, ignoring per-section scoping and the sign-in requirement. */
export function isFeatureOpenTo(entry: FeatureEntry, viewer: FeatureViewer): boolean {
  if (entry.state === "off") return false;
  if (entry.state === "admin" && !viewer.isAdmin) return false;
  if (entry.premiumOnly && !viewer.isPremium && !viewer.isAdmin) return false;
  return true;
}

export type SectionFlags = Record<LearningMode, boolean>;

/**
 * What one viewer actually gets — plain booleans and numbers, safe to hand to
 * Client Components as-is. Built by resolveFeatures; every UI entry point
 * reads this rather than re-deriving anything from the raw config.
 */
export interface EffectiveFeatures {
  signedIn: boolean;
  dictation: { sections: SectionFlags; showWordBlanks: boolean; letterByLetter: boolean };
  fromMemory: { sections: SectionFlags; allowReveal: boolean; showFirstLetters: boolean };
  personalCards: { page: boolean; saveSections: SectionFlags };
  dailySession: { enabled: boolean; size: number; xpReward: number; sources: DailySessionSources };
  quests: { enabled: boolean; types: Record<QuestType, QuestTypeConfig>; count: number };
  badges: { enabled: boolean; disabled: string[] };
  streakCalendar: {
    enabled: boolean;
    monthlyFreezes: number;
    /** Whether lesson completions should be written to the per-day activity log: true whenever the streak calendar OR badges (whose sentence-count badges are measured from that log) are anything but Off, for every learner — including during an admin-only preview, so the history already exists the day the feature opens to everyone. */
    trackActivity: boolean;
  };
  /** True when at least one account-only feature is switched on for this visitor's tier but they aren't signed in — the Home page shows one "sign in to unlock" card. */
  guestTeaser: boolean;
}

function sectionFlags(
  entry: FeatureEntry,
  id: FeatureId,
  open: boolean,
  modes: readonly LearningMode[],
): SectionFlags {
  const flags: SectionFlags = { normal: false, stories: false, conversation: false };
  if (!open) return flags;
  for (const mode of modes) {
    if (!FEATURE_SECTIONS[id].includes(mode)) continue;
    flags[mode] = entry.sections[mode] !== false;
  }
  return flags;
}

const ALL_MODES: readonly LearningMode[] = ["normal", "stories", "conversation"];

export function resolveFeatures(config: FeatureConfig, viewer: FeatureViewer): EffectiveFeatures {
  const open = (id: FeatureId) => isFeatureOpenTo(config.features[id], viewer);
  // Account-only features additionally need a signed-in learner to have
  // anywhere to persist state.
  const openForAccount = (id: FeatureId) => open(id) && viewer.signedIn;

  const guestTeaser =
    !viewer.signedIn && ACCOUNT_FEATURES.some((id) => id !== "personalCards" && open(id));

  const dictationOpen = open("dictation");
  const fromMemoryOpen = open("fromMemory");
  const cardsOpen = openForAccount("personalCards");

  return {
    signedIn: viewer.signedIn,
    dictation: {
      sections: sectionFlags(config.features.dictation, "dictation", dictationOpen, ALL_MODES),
      showWordBlanks: config.options.dictation.showWordBlanks,
      letterByLetter: config.options.dictation.letterByLetter,
    },
    fromMemory: {
      sections: sectionFlags(config.features.fromMemory, "fromMemory", fromMemoryOpen, ALL_MODES),
      allowReveal: config.options.fromMemory.allowReveal,
      showFirstLetters: config.options.fromMemory.showFirstLetters,
    },
    personalCards: {
      page: cardsOpen,
      saveSections: sectionFlags(
        config.features.personalCards,
        "personalCards",
        cardsOpen,
        ALL_MODES,
      ),
    },
    dailySession: {
      enabled: openForAccount("dailySession"),
      size: config.options.dailySession.size,
      xpReward: config.options.dailySession.xpReward,
      sources: { ...config.options.dailySession.sources },
    },
    quests: {
      enabled: openForAccount("quests"),
      types: config.options.quests.types,
      count: DAILY_QUEST_COUNT,
    },
    badges: {
      enabled: openForAccount("badges"),
      disabled: config.options.badges.disabled,
    },
    streakCalendar: {
      enabled: openForAccount("streakCalendar"),
      monthlyFreezes: config.options.streakCalendar.monthlyFreezes,
      trackActivity:
        config.features.streakCalendar.state !== "off" || config.features.badges.state !== "off",
    },
    guestTeaser,
  };
}

/** All features off — what a visitor gets when settings can't be read (no Supabase, migration not applied yet, a query error). */
export function disabledFeatures(signedIn = false): EffectiveFeatures {
  return resolveFeatures(defaultFeatureConfig(), { signedIn, isAdmin: false, isPremium: false });
}
