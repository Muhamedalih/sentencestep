import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * Shared type/defaults for the get-started flow's admin-configurable intro
 * card — see onboarding-card-queries.ts (read) and onboarding-card-actions.ts
 * (write). `title` is the admin's own English reference copy (shown only in
 * the admin form); the learner-facing headline (OnboardingIntroCard) always
 * renders one of titleAr/titleEs/titleTr, picked by the visitor's support
 * locale, since English is never a selectable support locale in this app
 * (see SupportLocale in src/lib/i18n/locales.ts).
 */
export interface OnboardingCardSettings {
  imageUrl: string | null;
  completionImageUrl: string | null;
  title: string;
  titleAr: string;
  titleEs: string;
  titleTr: string;
}

export const DEFAULT_ONBOARDING_CARD_SETTINGS: OnboardingCardSettings = {
  imageUrl: null,
  completionImageUrl: null,
  title: "Your English Journey Starts Here",
  titleAr: "رحلتك مع الإنجليزية تبدأ من هنا",
  titleEs: "Tu viaje con el inglés comienza aquí",
  titleTr: "İngilizce yolculuğun burada başlıyor",
};

export const ONBOARDING_CARD_TITLE_MAX_LENGTH = 120;

/**
 * Picks the learner-facing headline for the given support locale — never
 * `settings.title`, which is the admin's English reference copy, not
 * something a learner should ever see (same reasoning as levels.ts's
 * tierSupportLabel, including the exhaustive switch so a third locale being
 * added without a matching field here fails to compile instead of silently
 * falling back to the wrong language).
 */
export function onboardingCardTitleForLocale(
  settings: OnboardingCardSettings,
  locale: SupportLocale,
): string {
  switch (locale) {
    case "ar":
      return settings.titleAr;
    case "es":
      return settings.titleEs;
    case "tr":
      return settings.titleTr;
    default: {
      const exhaustive: never = locale;
      throw new Error(`onboardingCardTitleForLocale: unhandled locale "${exhaustive}"`);
    }
  }
}
