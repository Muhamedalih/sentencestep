import { ar } from "@/lib/i18n/dictionary/ar";
import { en } from "@/lib/i18n/dictionary/en";
import { es } from "@/lib/i18n/dictionary/es";
import { tr } from "@/lib/i18n/dictionary/tr";
import type { Dictionary } from "@/lib/i18n/dictionary/types";
import type { SupportLocale } from "@/lib/i18n/locales";

export type { Dictionary } from "@/lib/i18n/dictionary/types";

const dictionaries: Record<SupportLocale, Dictionary> = { ar, es, tr };

export function getDictionary(locale: SupportLocale): Dictionary {
  return dictionaries[locale];
}

/** The always-complete fallback dictionary — see en.ts's doc comment for why English, not a selectable locale, plays this role. */
export { en as fallbackDictionary };
