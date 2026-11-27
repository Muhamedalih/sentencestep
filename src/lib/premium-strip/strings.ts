/**
 * The words of the Premium strip on Home (the "premiumStrip" permission). They live here, not in the
 * shared dictionaries, the way the upgrade cards do it: null is English.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

export interface PremiumStripStrings {
  badge: string;
  line: string;
  cta: string;
}

const ar: PremiumStripStrings = {
  badge: "PREMIUM",
  line: "افتح كل القصص والنصوص مع الاشتراك",
  cta: "Upgrade",
};

const en: PremiumStripStrings = {
  badge: "PREMIUM",
  line: "Unlock all stories and passages with Premium",
  cta: "Upgrade",
};

const es: PremiumStripStrings = {
  badge: "PREMIUM",
  line: "Desbloquea todas las historias y textos con Premium",
  cta: "Mejorar",
};

const tr: PremiumStripStrings = {
  badge: "PREMIUM",
  line: "Premium ile tüm hikâyelerin ve metinlerin kilidini aç",
  cta: "Yükselt",
};

export function premiumStripStrings(locale: SupportLocale | null): PremiumStripStrings {
  switch (locale) {
    case "ar":
      return ar;
    case "es":
      return es;
    case "tr":
      return tr;
    default:
      return en;
  }
}
