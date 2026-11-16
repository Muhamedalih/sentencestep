/**
 * The words of the banner at the top of the Passages list (the passagesBanner permission). Kept in
 * this folder, like the Words banner's, so the banner ships without touching the shared
 * dictionaries. English is what a learner with no support language reads.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

export interface PassagesBannerStrings {
  /** The banner's accessible name. */
  sectionLabel: string;
  /** The small line above the headline: what the section trains, and the test style it follows. */
  kicker: string;
  /** The headline (the page's main heading while the banner is shown). */
  headline: string;
  /** One line under the headline. */
  sub: string;
  /** The button when the learner has begun. */
  resume: string;
  /** The button for a learner who has not begun. */
  start: string;
  /** The button once every passage is finished. */
  again: string;
}

const AR: PassagesBannerStrings = {
  sectionLabel: "النصوص: اسمع ثم امتحن نفسك",
  kicker: "تدريب الاستماع · نمط IELTS",
  headline: "اسمع، ثم امتحن نفسك",
  sub: "استمع إلى المشهد، أجب، وأنهِ بامتحان كامل.",
  resume: "تابع الاستماع",
  start: "ابدأ الاستماع",
  again: "استمع من جديد",
};

const EN: PassagesBannerStrings = {
  sectionLabel: "Passages: listen, then test yourself",
  kicker: "Listening training · IELTS style",
  headline: "Listen, then test yourself",
  sub: "Listen to the scene, answer, and finish with a full exam.",
  resume: "Keep listening",
  start: "Start listening",
  again: "Listen again",
};

const ES: PassagesBannerStrings = {
  sectionLabel: "Textos: escucha y ponte a prueba",
  kicker: "Entrenamiento auditivo · estilo IELTS",
  headline: "Escucha y ponte a prueba",
  sub: "Escucha la escena, responde y termina con un examen completo.",
  resume: "Seguir escuchando",
  start: "Empezar a escuchar",
  again: "Escuchar de nuevo",
};

const TR: PassagesBannerStrings = {
  sectionLabel: "Metinler: dinle, sonra kendini sına",
  kicker: "Dinleme antrenmanı · IELTS tarzı",
  headline: "Dinle, sonra kendini sına",
  sub: "Sahneyi dinle, soruları yanıtla ve tam bir sınavla bitir.",
  resume: "Dinlemeye devam et",
  start: "Dinlemeye başla",
  again: "Yeniden dinle",
};

const STRINGS: Record<SupportLocale, PassagesBannerStrings> = {
  ar: AR,
  es: ES,
  tr: TR,
};

export function passagesBannerStrings(locale: SupportLocale | null): PassagesBannerStrings {
  return locale ? STRINGS[locale] : EN;
}
