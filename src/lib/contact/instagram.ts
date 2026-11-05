/**
 * The Instagram account learners can write to, and the words of the «تواصل معنا» box at the foot of the
 * side menu (permission contactInstagram). Kept in this folder so the box ships without touching the
 * shared dictionaries.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

export const INSTAGRAM_HANDLE = "sentencestep_arabic";

/** Opens a chat with the account (Instagram's own direct-message link), not only its profile. */
export const INSTAGRAM_DM_URL = `https://ig.me/m/${INSTAGRAM_HANDLE}`;

export interface ContactStrings {
  title: string;
  /** What the link does, for a screen reader and the hover title. */
  linkLabel: string;
}

const CONTACT_STRINGS: Record<SupportLocale, ContactStrings> = {
  ar: { title: "تواصل معنا", linkLabel: "راسلنا على إنستغرام" },
  es: { title: "Contáctanos", linkLabel: "Escríbenos en Instagram" },
  tr: { title: "Bize ulaşın", linkLabel: "Instagram'dan bize yazın" },
};

export function contactStrings(locale: SupportLocale | null): ContactStrings {
  return CONTACT_STRINGS[locale ?? "ar"];
}
