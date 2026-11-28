import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * «What happens next?» (permission seriesGuess): at the end of an episode the learner picks one of
 * these guesses and it is sealed in an envelope; the next episode opens it at the line that answers the question. One
 * entry per episode whose NEXT episode is already written (the question itself is the series' own,
 * see lib/passages/series.ts).
 */

type Said = Record<SupportLocale, string>;

export interface GuessOption {
  /** The words the guess is chosen by. */
  label: string;
  support: Said;
  /** The sentence put in the envelope: its start, then the answer's word. */
  lead: string;
  word: string;
}

export interface SeriesGuess {
  /** The episode the guess is made after. */
  after: string;
  /** The episode that answers it, and its title. */
  next: string;
  nextTitle: string;
  options: readonly GuessOption[];
  /** The option word that turns out right. */
  answer: string;
  /** A line of the next episode shown with the answer hidden. */
  teaser: { before: string; after: string };
  /** Where the next episode answers it (part and line, from 0) and the words to light up there. */
  reveal: { section: number; line: number; light: readonly string[] };
}

export const SERIES_GUESSES: readonly SeriesGuess[] = [
  {
    after: "open-on-your-first-day",
    next: "a-letter-from-nora",
    nextTitle: "A Letter from Nora",
    options: [
      {
        label: "Mr. Cole",
        support: { ar: "السيد كول", es: "El señor Cole", tr: "Bay Cole" },
        lead: "It was Mr.",
        word: "Cole",
      },
      {
        label: "Her grandmother",
        support: { ar: "جدتها", es: "Su abuela", tr: "Büyükannesi" },
        lead: "It was her",
        word: "grandmother",
      },
      {
        label: "Her mother",
        support: { ar: "أمها", es: "Su madre", tr: "Annesi" },
        lead: "It was her",
        word: "mother",
      },
    ],
    answer: "grandmother",
    teaser: { before: "Your ", after: " wrote it." },
    reveal: { section: 0, line: 5, light: ["grandmother", "Nora"] },
  },
  {
    after: "a-letter-from-nora",
    next: "ten-past-four",
    nextTitle: "Ten Past Four",
    options: [
      {
        label: "A key",
        support: { ar: "مفتاح", es: "Una llave", tr: "Bir anahtar" },
        lead: "There is a",
        word: "key",
      },
      {
        label: "A letter",
        support: { ar: "رسالة", es: "Una carta", tr: "Bir mektup" },
        lead: "There is a",
        word: "letter",
      },
      {
        label: "A bird",
        support: { ar: "طائر", es: "Un pájaro", tr: "Bir kuş" },
        lead: "There is a",
        word: "bird",
      },
    ],
    answer: "key",
    teaser: { before: "Look, a ", after: "." },
    reveal: { section: 1, line: 1, light: ["key"] },
  },
];
