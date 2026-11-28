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
  {
    after: "ten-past-four",
    next: "the-rose-under-the-floor",
    nextTitle: "The Rose Under the Floor",
    options: [
      {
        label: "An old ghost",
        support: { ar: "شبح قديم", es: "Un viejo fantasma", tr: "Eski bir hayalet" },
        lead: "Because of an old",
        word: "ghost",
      },
      {
        label: "A big fight",
        support: { ar: "شجار كبير", es: "Una gran pelea", tr: "Büyük bir kavga" },
        lead: "Because of a big",
        word: "fight",
      },
      {
        label: "A lost ring",
        support: { ar: "خاتم ضائع", es: "Un anillo perdido", tr: "Kayıp bir yüzük" },
        lead: "Because of a lost",
        word: "ring",
      },
    ],
    answer: "fight",
    teaser: { before: "I had a big ", after: " with my mother in this shop." },
    reveal: { section: 2, line: 0, light: ["fight", "mother"] },
  },
  {
    after: "the-rose-under-the-floor",
    next: "twenty-birthdays",
    nextTitle: "Twenty Birthdays",
    options: [
      {
        label: "Money",
        support: { ar: "نقود", es: "Dinero", tr: "Para" },
        lead: "There is old",
        word: "money",
      },
      {
        label: "A map",
        support: { ar: "خريطة", es: "Un mapa", tr: "Bir harita" },
        lead: "There is a",
        word: "map",
      },
      {
        label: "Letters",
        support: { ar: "رسائل", es: "Cartas", tr: "Mektuplar" },
        lead: "There are many",
        word: "letters",
      },
    ],
    answer: "letters",
    teaser: { before: "Under the rose there are many ", after: ", tied with red string." },
    reveal: { section: 0, line: 0, light: ["letters", "string"] },
  },
  {
    after: "twenty-birthdays",
    next: "the-man-in-the-grey-hat",
    nextTitle: "The Man in the Grey Hat",
    options: [
      {
        label: "For a hotel",
        support: { ar: "ليبني فندقاً", es: "Para un hotel", tr: "Otel yapmak için" },
        lead: "He wants a",
        word: "hotel",
      },
      {
        label: "Because of the bank",
        support: { ar: "بسبب المصرف", es: "Por el banco", tr: "Banka yüzünden" },
        lead: "Because of the",
        word: "bank",
      },
      {
        label: "For a treasure",
        support: { ar: "من أجل كنز", es: "Por un tesoro", tr: "Bir hazine için" },
        lead: "He wants the",
        word: "treasure",
      },
    ],
    answer: "bank",
    teaser: { before: "Because on Friday the ", after: " will take this shop." },
    reveal: { section: 0, line: 4, light: ["bank", "Friday"] },
  },
  {
    after: "the-man-in-the-grey-hat",
    next: "eleven-past-four",
    nextTitle: "Eleven Past Four",
    options: [
      {
        label: "She is sorry",
        support: { ar: "أنها آسفة", es: "Que lo siente", tr: "Üzgün olduğunu" },
        lead: "I am so",
        word: "sorry",
      },
      {
        label: "She is angry",
        support: { ar: "أنها غاضبة", es: "Que está enojada", tr: "Kızgın olduğunu" },
        lead: "I am so",
        word: "angry",
      },
      {
        label: "She is rich",
        support: { ar: "أنها غنية", es: "Que es rica", tr: "Zengin olduğunu" },
        lead: "I am so",
        word: "rich",
      },
    ],
    answer: "sorry",
    teaser: { before: "I am so ", after: ", Anna. I love you more than every book here." },
    reveal: { section: 0, line: 3, light: ["sorry", "love"] },
  },
];
