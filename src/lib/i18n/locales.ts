/**
 * The learner-support/interface languages a visitor can choose between.
 * English is deliberately not part of this union — it's the language being
 * LEARNED, not a support-language option (see the language switcher, which
 * only ever offers locales from this list). Kept separate from
 * LearningMode/Sentence's `en`/`ar` fields in src/types/content.ts, which
 * are about lesson content, not UI/interface language.
 *
 * Every place that pattern-matches on SupportLocale is written to fail to
 * compile (not silently misroute) when a case is missing, which is exactly
 * what surfaced everywhere a new locale needed to be added.
 */
export type SupportLocale = "ar" | "es" | "tr";

/**
 * The locales actually OFFERED to learners (the language switcher, the
 * first-time picker) — the one runtime gate between a locale being
 * type-safe (SupportLocale) and it actually being selectable. Turkish
 * ("tr") joined this list once its `locales` database row was enabled and
 * its UI dictionary (dictionary/tr.ts) was verified complete — the same bar
 * Arabic and Spanish already cleared. Turkish LESSON content translations
 * are a separate, independent concern (content_translations rows, reviewed
 * per-lesson through the admin translation dashboard) and are not required
 * to be complete for a locale to be listed here — exactly as Spanish
 * shipped with partial lesson-translation coverage from day one.
 */
export const SUPPORT_LOCALES: readonly SupportLocale[] = ["ar", "es", "tr"];

export const DEFAULT_LOCALE: SupportLocale = "ar";

interface LocaleMeta {
  label: string;
  nativeLabel: string;
  dir: "rtl" | "ltr";
  /** The switcher's visual representation — one concrete national flag per support language rather than a generic globe/language icon. */
  flag: string;
  /** ISO 3166-1 alpha-2 code for the same national flag, used by LanguageSwitcher to render an actual SVG flag (via the `flag-icons` package) instead of the emoji glyph, which some platforms render as bare letters. */
  flagCountryCode: "sa" | "es" | "tr";
}

export const LOCALE_META: Record<SupportLocale, LocaleMeta> = {
  // Arabic is deliberately rendered ltr, not its native rtl — a product
  // decision to keep every support locale's UI direction identical (see
  // dirFor's own doc comment / locales.test.ts). This is the ONLY place
  // that decision lives; everything else in the app (the <html dir> attribute,
  // LocaleProvider's `dir`, per-locale dir props like
  // FirstTimeLanguagePicker's) reads it from here via dirFor/LOCALE_META
  // rather than hardcoding "rtl" for "ar" itself.
  ar: { label: "Arabic", nativeLabel: "العربية", dir: "ltr", flag: "🇸🇦", flagCountryCode: "sa" },
  es: { label: "Spanish", nativeLabel: "Español", dir: "ltr", flag: "🇪🇸", flagCountryCode: "es" },
  tr: { label: "Turkish", nativeLabel: "Türkçe", dir: "ltr", flag: "🇹🇷", flagCountryCode: "tr" },
};

export function isSupportLocale(value: string | null | undefined): value is SupportLocale {
  return value === "ar" || value === "es" || value === "tr";
}

export function dirFor(locale: SupportLocale): "rtl" | "ltr" {
  return LOCALE_META[locale].dir;
}

/**
 * True for the marketing homepage's unprefixed URL ("/") AND every one of
 * its locale-prefixed static variants ("/ar", "/es", "/tr" — see
 * src/app/[locale]/page.tsx). Used by StartingLevelOnboarding and
 * OnboardingIntroCard, which gate on "is this the homepage" via
 * `usePathname()`: once FirstTimeLanguagePicker's setLocale navigates a
 * first-time visitor from "/" to "/{locale}" (necessary now that the
 * marketing pages are static — see LocaleProvider's `localizedNavigation`
 * doc comment), a bare `pathname === "/"` check would incorrectly hide the
 * rest of the "get started" flow on the very next step.
 */
export function isMarketingHomePath(pathname: string): boolean {
  return pathname === "/" || SUPPORT_LOCALES.some((locale) => pathname === `/${locale}`);
}
