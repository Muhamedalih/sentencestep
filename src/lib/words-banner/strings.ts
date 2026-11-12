/**
 * The words of the banner at the top of the Words page (the wordsBanner permission). Kept in this
 * folder, like the other sections', so the banner ships without touching the shared dictionaries.
 * English is what a learner with no support language reads.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

export interface WordsBannerStrings {
  /** The banner's accessible name. */
  sectionLabel: string;
  /** Beside the big number: "words learned". */
  learned: string;
  /** The chip: "9 topics going", or a sentence for none. */
  going: (n: number) => string;
  /** The button when words wait for review. */
  review: string;
  /** The button when none wait and a topic is under way. */
  resume: string;
  /** The button for a learner who has not begun. */
  start: string;
  /** The shelf's accessible name. */
  shelfLabel: string;
  /** A book's tooltip: the topic in the learner's language and how far they are. */
  spineTitle: (name: string, done: number, total: number) => string;
}

/** Arabic counts: one and two have their own forms, 3-10 take the plural, 11 and over the singular. */
function arGoing(n: number): string {
  if (n === 0) return "لم تبدأ موضوعًا بعد";
  if (n === 1) return "موضوع واحد جارٍ";
  if (n === 2) return "موضوعان جاريان";
  if (n <= 10) return `${n} مواضيع جارية`;
  return `${n} موضوعًا جاريًا`;
}

const AR: WordsBannerStrings = {
  sectionLabel: "ملخص كلماتك",
  learned: "كلمة تعلّمتها",
  going: arGoing,
  review: "راجع كلماتك",
  resume: "تابع من حيث وقفت",
  start: "ابدأ أول موضوع",
  shelfLabel: "المواضيع التي بدأتها",
  spineTitle: (name, done, total) => `${name} · ${done} / ${total}`,
};

const EN: WordsBannerStrings = {
  sectionLabel: "Your words at a glance",
  learned: "words learned",
  going: (n) =>
    n === 0 ? "No topic started yet" : n === 1 ? "1 topic going" : `${n} topics going`,
  review: "Review your words",
  resume: "Pick up where you left off",
  start: "Start your first topic",
  shelfLabel: "Topics you have started",
  spineTitle: (name, done, total) => `${name} · ${done} / ${total}`,
};

const ES: WordsBannerStrings = {
  sectionLabel: "Tus palabras de un vistazo",
  learned: "palabras aprendidas",
  going: (n) =>
    n === 0 ? "Aún no has empezado un tema" : n === 1 ? "1 tema en curso" : `${n} temas en curso`,
  review: "Repasa tus palabras",
  resume: "Sigue donde lo dejaste",
  start: "Empieza tu primer tema",
  shelfLabel: "Temas que has empezado",
  spineTitle: (name, done, total) => `${name} · ${done} / ${total}`,
};

const TR: WordsBannerStrings = {
  sectionLabel: "Kelimelerine kısa bakış",
  learned: "kelime öğrendin",
  going: (n) => (n === 0 ? "Henüz bir konuya başlamadın" : `${n} konu devam ediyor`),
  review: "Kelimelerini tekrar et",
  resume: "Kaldığın yerden devam et",
  start: "İlk konuna başla",
  shelfLabel: "Başladığın konular",
  spineTitle: (name, done, total) => `${name} · ${done} / ${total}`,
};

const STRINGS: Record<SupportLocale, WordsBannerStrings> = { ar: AR, es: ES, tr: TR };

export function wordsBannerStrings(locale: SupportLocale | null): WordsBannerStrings {
  return locale ? STRINGS[locale] : EN;
}
