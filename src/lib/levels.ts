import type { LessonUnit } from "@/types/content";
import type { SupportLocale } from "@/lib/i18n/locales";

// --- Level progression: levels (per mode) roll up into named tiers. ---
//
// Tiers are a display concept only — which lessons belong to a *level* is
// still driven by LessonUnit.level (see src/data/units.ts). This table just
// says which levels count as "Beginner" vs "Intermediate" vs "Advanced", so
// growing a mode from 3 levels to 9 is a one-line edit here, not a UI change.

export type Difficulty = "beginner" | "intermediate" | "advanced";

interface TierConfig {
  tier: Difficulty;
  label: string;
  labelAr: string;
  labelEs: string;
  labelTr: string;
  /** Levels up to and including this number belong to the tier. */
  maxLevel: number;
}

const TIERS: TierConfig[] = [
  {
    tier: "beginner",
    label: "Beginner",
    labelAr: "مبتدئ",
    labelEs: "Principiante",
    labelTr: "Başlangıç",
    maxLevel: 1,
  },
  {
    tier: "intermediate",
    label: "Intermediate",
    labelAr: "متوسط",
    labelEs: "Intermedio",
    labelTr: "Orta Seviye",
    maxLevel: 2,
  },
  {
    tier: "advanced",
    label: "Advanced",
    labelAr: "متقدم",
    labelEs: "Avanzado",
    labelTr: "İleri Seviye",
    maxLevel: Infinity,
  },
];

const FALLBACK_TIER = TIERS[TIERS.length - 1] as TierConfig;

export function difficultyForLevel(level: number): Difficulty {
  return (TIERS.find((tier) => level <= tier.maxLevel) ?? FALLBACK_TIER).tier;
}

export function tierLabel(difficulty: Difficulty): {
  label: string;
  labelAr: string;
  labelEs: string;
  labelTr: string;
} {
  const config = TIERS.find((tier) => tier.tier === difficulty) ?? FALLBACK_TIER;
  return {
    label: config.label,
    labelAr: config.labelAr,
    labelEs: config.labelEs,
    labelTr: config.labelTr,
  };
}

/**
 * Picks the tier label for the given support locale — never English, since
 * the tier badge is always learner-support text, not lesson content. A
 * switch with an exhaustiveness check rather than a locale === "ar" ? ... :
 * ... ternary on purpose: TierConfig only has labelAr/labelEs fields (no
 * generic per-locale map), so there's no safe value to fall back to for a
 * locale this config doesn't have a field for — better to fail loudly (and,
 * since `locale` is typed SupportLocale, to fail to *compile* the moment a
 * third locale is added) than to silently return the wrong language.
 */
export function tierSupportLabel(difficulty: Difficulty, locale: SupportLocale): string {
  const config = tierLabel(difficulty);
  switch (locale) {
    case "ar":
      return config.labelAr;
    case "es":
      return config.labelEs;
    case "tr":
      return config.labelTr;
    default: {
      const exhaustive: never = locale;
      throw new Error(`tierSupportLabel: unhandled locale "${exhaustive}"`);
    }
  }
}

/**
 * Level titles follow "<name> — <CEFR code>" (e.g. "متقدم — B2+" — see
 * src/data/units.ts). Rendered as one opaque string inside a dir="rtl"
 * element, the trailing CEFR code's own "+"/"-" has no strong character
 * after it, so the Unicode bidi algorithm falls back to the surrounding
 * RTL paragraph direction for it — visually reordering "B2+" as "+B2"
 * (the same class of bug already fixed elsewhere in this codebase by
 * isolating a numeric/symbol fragment in its own dir="ltr" span, e.g.
 * stories-library.tsx's CEFR_BY_TIER badge). Splitting the code out lets
 * the caller render it in its own dir="ltr" span instead, without
 * affecting titles that don't follow this convention (code is null then,
 * and the original string renders completely unchanged).
 */
export function splitLevelTitle(title: string): { label: string; code: string | null } {
  const separator = " — ";
  const index = title.lastIndexOf(separator);
  if (index === -1) return { label: title, code: null };
  return { label: title.slice(0, index), code: title.slice(index + separator.length) };
}

/** Average words-per-minute a learner types at while still reading/absorbing new sentences — deliberately slower than free-typing speed. */
const LEARNING_WPM = 20;

/** Rough reading+typing time for a lesson, derived from its content rather than authored per lesson. */
export function estimateMinutes(unit: Pick<LessonUnit, "sentences">): number {
  const words = unit.sentences.reduce(
    (total, sentence) => total + sentence.en.split(/\s+/).length,
    0,
  );
  return Math.max(1, Math.round(words / LEARNING_WPM));
}
