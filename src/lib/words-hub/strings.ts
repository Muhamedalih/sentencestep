/**
 * The words of the one Words page («الكلمات», the wordsPage permission): the menu item and the page's
 * title, the three tabs and a topic's count. Kept in this folder, like the other sections', so the
 * page ships without touching the shared dictionaries. English is what a learner with no support
 * language reads.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

export interface WordsHubStrings {
  /** The menu item's label and the page's title. */
  title: string;
  tabGroups: string;
  tabCore: string;
  tabSaved: string;
  /** A topic that has not been started: "25 words". */
  wordsCount: (n: number) => string;
  /** The tab bar's accessible name. */
  tabsLabel: string;
}

const AR: WordsHubStrings = {
  title: "الكلمات",
  tabGroups: "المجموعات",
  tabCore: "الأساسية",
  tabSaved: "محفوظاتي",
  wordsCount: (n) => `${n} كلمة`,
  tabsLabel: "أقسام الكلمات",
};

const EN: WordsHubStrings = {
  title: "Words",
  tabGroups: "Topics",
  tabCore: "Core",
  tabSaved: "Saved",
  wordsCount: (n) => `${n} words`,
  tabsLabel: "Words sections",
};

const ES: WordsHubStrings = {
  title: "Palabras",
  tabGroups: "Temas",
  tabCore: "Básicas",
  tabSaved: "Guardadas",
  wordsCount: (n) => `${n} palabras`,
  tabsLabel: "Secciones de palabras",
};

const TR: WordsHubStrings = {
  title: "Kelimeler",
  tabGroups: "Konular",
  tabCore: "Temel",
  tabSaved: "Kaydedilenler",
  wordsCount: (n) => `${n} kelime`,
  tabsLabel: "Kelime bölümleri",
};

const STRINGS: Record<SupportLocale, WordsHubStrings> = { ar: AR, es: ES, tr: TR };

export function wordsHubStrings(locale: SupportLocale | null): WordsHubStrings {
  return locale ? STRINGS[locale] : EN;
}
