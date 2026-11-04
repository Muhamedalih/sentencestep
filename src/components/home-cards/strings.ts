/**
 * The words the Home cards add (permission "homeCards"). They live here, in four languages, instead of
 * the shared dictionaries, the way the rule of the day and Video dictation keep theirs; everything the
 * dictionaries already say (Stories, Passages, the totals, "Review now") is read from them.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

export interface HomeCardsStrings {
  /** The one name of the merged card. */
  continueTitle: string;
  tabLessons: string;
  tabStories: string;
  /** The story's button: starting it / carrying on. */
  storyStart: string;
  storyContinue: string;
  /** The line under a story's title when it has no translated one. */
  storyLine: string;
  /** The Stories choice when the learner has nothing left in Stories. */
  storiesAllDone: string;
  /** The label of the words panel and the line under its big number. */
  yourWords: string;
  wordsTyped: string;
  /** "{n}" words are waiting for review. */
  readyToReview: string;
  /** The Passages and Video cards: the kind, the line under the title, and the «next» label. */
  passagesKind: string;
  passagesLine: string;
  videoKind: string;
  videoLine: string;
  next: string;
}

const ar: HomeCardsStrings = {
  continueTitle: "أكمل التعلّم",
  tabLessons: "الدروس اليومية",
  tabStories: "القصص",
  storyStart: "ابدأ القصة",
  storyContinue: "متابعة القصة",
  storyLine: "قصة قصيرة تكتبها جملة بجملة",
  storiesAllDone: "أنهيت قصص مستواك. تصفّح بقية القصص.",
  yourWords: "كلماتك",
  wordsTyped: "كلمة كتبتها",
  readyToReview: "{n} جاهزة للمراجعة",
  passagesKind: "استماع",
  passagesLine: "نصوص تستمع إليها وتقرؤها",
  videoKind: "إملاء",
  videoLine: "مقاطع يوتيوب قصيرة تكتب فيها ما تسمعه",
  next: "التالي",
};

const en: HomeCardsStrings = {
  continueTitle: "Keep learning",
  tabLessons: "Daily lessons",
  tabStories: "Stories",
  storyStart: "Start the story",
  storyContinue: "Continue the story",
  storyLine: "A short story you type line by line",
  storiesAllDone: "You have finished the stories at your level. Browse the rest.",
  yourWords: "Your words",
  wordsTyped: "words typed",
  readyToReview: "{n} ready to review",
  passagesKind: "Listening",
  passagesLine: "Texts you listen to and read",
  videoKind: "Dictation",
  videoLine: "Short YouTube clips where you type what you hear",
  next: "Next",
};

const es: HomeCardsStrings = {
  continueTitle: "Sigue aprendiendo",
  tabLessons: "Lecciones diarias",
  tabStories: "Historias",
  storyStart: "Empezar la historia",
  storyContinue: "Continuar la historia",
  storyLine: "Una historia corta que escribes línea a línea",
  storiesAllDone: "Terminaste las historias de tu nivel. Mira el resto.",
  yourWords: "Tus palabras",
  wordsTyped: "palabras escritas",
  readyToReview: "{n} listas para repasar",
  passagesKind: "Escucha",
  passagesLine: "Textos que escuchas y lees",
  videoKind: "Dictado",
  videoLine: "Clips cortos de YouTube donde escribes lo que oyes",
  next: "Siguiente",
};

const tr: HomeCardsStrings = {
  continueTitle: "Öğrenmeye devam et",
  tabLessons: "Günlük dersler",
  tabStories: "Hikâyeler",
  storyStart: "Hikâyeye başla",
  storyContinue: "Hikâyeye devam et",
  storyLine: "Satır satır yazdığın kısa bir hikâye",
  storiesAllDone: "Seviyendeki hikâyeleri bitirdin. Diğerlerine göz at.",
  yourWords: "Kelimelerin",
  wordsTyped: "yazılan kelime",
  readyToReview: "{n} tekrara hazır",
  passagesKind: "Dinleme",
  passagesLine: "Dinleyip okuduğun metinler",
  videoKind: "Dikte",
  videoLine: "Duyduğunu yazdığın kısa YouTube klipleri",
  next: "Sonraki",
};

const BY_LOCALE: Record<SupportLocale, HomeCardsStrings> = { ar, es, tr };

/** English is the language of a learner with no support locale (null). */
export function homeCardsStrings(locale: SupportLocale | null | undefined): HomeCardsStrings {
  return locale ? BY_LOCALE[locale] : en;
}

/** Fills the "{n}" hole of one of the strings above. */
export function fillCount(text: string, n: number): string {
  return text.replace("{n}", String(n));
}
