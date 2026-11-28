/**
 * The reminder a learner asks for by pulling the bell of «What happens next?» (permission
 * seriesGuess). It is the one session reminder, marked in its lesson_id as a series episode, so the
 * hourly sender can name the question and open that episode. Pure.
 */

import { guessAnsweredBy } from "@/lib/passages/series-guess";
import { episodeOf, seriesLabels } from "@/lib/passages/series";
import type { SupportLocale } from "@/lib/i18n/locales";

const PREFIX = "series:";

export function seriesReminderId(passageId: string): string {
  return `${PREFIX}${passageId}`;
}

/** The episode a reminder row is about, or null for any other reminder. */
export function seriesReminderPassage(lessonId: string | null | undefined): string | null {
  if (!lessonId?.startsWith(PREFIX)) return null;
  const passageId = lessonId.slice(PREFIX.length);
  return guessAnsweredBy(passageId) ? passageId : null;
}

export interface SeriesReminderText {
  subject: string;
  preview: string;
  heading: string;
  body: string;
  cta: string;
  path: string;
}

type Language = "en" | SupportLocale;

const WORDS: Record<
  Language,
  {
    subject: (question: string) => string;
    heading: string;
    body: (number: number, series: string, title: string) => string;
    cta: (number: number) => string;
  }
> = {
  en: {
    subject: (question) => `Your book is waiting: ${question}`,
    heading: "Your book is waiting",
    body: (n, series, title) =>
      `Episode ${n} of “${series}” is open now: “${title}”. Open it to find the answer.`,
    cta: (n) => `Open episode ${n}`,
  },
  ar: {
    subject: (question) => `كتابك ينتظرك: ${question}`,
    heading: "كتابك ينتظرك",
    body: (n, series, title) =>
      `صارت الحلقة ${n} من «${series}» مفتوحة: «${title}». افتحها لتعرف الجواب.`,
    cta: (n) => `افتح الحلقة ${n}`,
  },
  es: {
    subject: (question) => `Tu libro te espera: ${question}`,
    heading: "Tu libro te espera",
    body: (n, series, title) =>
      `El episodio ${n} de «${series}» ya está abierto: «${title}». Ábrelo para saber la respuesta.`,
    cta: (n) => `Abrir el episodio ${n}`,
  },
  tr: {
    subject: (question) => `Kitabın seni bekliyor: ${question}`,
    heading: "Kitabın seni bekliyor",
    body: (n, series, title) =>
      `“${series}” dizisinin ${n}. bölümü açıldı: “${title}”. Cevabı öğrenmek için aç.`,
    cta: (n) => `${n}. bölümü aç`,
  },
};

/** What the reminder for this episode says, or null when the episode answers no question. */
export function seriesReminderText(
  language: Language,
  passageId: string,
): SeriesReminderText | null {
  const guess = guessAnsweredBy(passageId);
  const locale = language === "en" ? null : language;
  const asked = guess ? episodeOf(guess.after, locale) : null;
  const answering = episodeOf(passageId, locale);
  if (!guess || !asked || !answering) return null;
  const words = WORDS[language];
  const body = words.body(answering.number, answering.seriesTitle, guess.nextTitle);
  return {
    subject: words.subject(asked.next),
    preview: `${seriesLabels(locale).episode(answering.number, answering.total)} · ${guess.nextTitle}`,
    heading: words.heading,
    body,
    cta: words.cta(answering.number),
    path: `/learn/passages/${passageId}`,
  };
}
