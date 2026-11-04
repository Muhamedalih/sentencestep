/**
 * The words the Home cards add (permission "homeCards"). They live here, in four languages, instead of
 * the shared dictionaries, the way the rule of the day and Video dictation keep theirs; everything the
 * dictionaries already say (Stories, Passages, the level names, "Review now") is read from them.
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
  /** The tags that tell the Stories card (the language) from the words section (the writing). */
  languageCenter: string;
  writingCenter: string;
  /** The achievements panel: its label, the line under the level's bar, and the four counts. */
  statsLabel: string;
  levelLabel: string;
  /** "{n}" percent of the way to "{level}". */
  levelToNext: string;
  levelTop: string;
  storiesFinished: string;
  videosFinished: string;
  linesTyped: string;
  wordsTyped: string;
  /** The words section: its label, the line after the big number, and the line beside the button. */
  yourWords: string;
  wordsReady: string;
  wordsHint: string;
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
  languageCenter: "مركز تعلّم اللغة",
  writingCenter: "مركز تعلّم الكتابة",
  statsLabel: "إنجازاتك",
  levelLabel: "مستواك",
  levelToNext: "{n}% نحو {level}",
  levelTop: "أعلى مستوى",
  storiesFinished: "قصص أنهيتها",
  videosFinished: "فيديوهات أنهيتها",
  linesTyped: "جملة كتبتها",
  wordsTyped: "كلمة كتبتها",
  yourWords: "كلماتك",
  wordsReady: "كلمة جاهزة للمراجعة",
  wordsHint: "مراجعة قصيرة تثبّت الكلمات في ذاكرتك",
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
  languageCenter: "Language learning hub",
  writingCenter: "Writing learning hub",
  statsLabel: "Your achievements",
  levelLabel: "Your level",
  levelToNext: "{n}% to {level}",
  levelTop: "Top level",
  storiesFinished: "stories finished",
  videosFinished: "videos finished",
  linesTyped: "sentences typed",
  wordsTyped: "words typed",
  yourWords: "Your words",
  wordsReady: "words ready to review",
  wordsHint: "A short review keeps your words in memory",
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
  languageCenter: "Centro de idioma",
  writingCenter: "Centro de escritura",
  statsLabel: "Tus logros",
  levelLabel: "Tu nivel",
  levelToNext: "{n}% hacia {level}",
  levelTop: "Nivel máximo",
  storiesFinished: "historias terminadas",
  videosFinished: "videos terminados",
  linesTyped: "frases escritas",
  wordsTyped: "palabras escritas",
  yourWords: "Tus palabras",
  wordsReady: "palabras listas para repasar",
  wordsHint: "Un repaso corto fija tus palabras en la memoria",
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
  languageCenter: "Dil merkezi",
  writingCenter: "Yazma merkezi",
  statsLabel: "Başarıların",
  levelLabel: "Seviyen",
  levelToNext: "{level} için %{n}",
  levelTop: "En üst seviye",
  storiesFinished: "biten hikâye",
  videosFinished: "biten video",
  linesTyped: "yazılan cümle",
  wordsTyped: "yazılan kelime",
  yourWords: "Kelimelerin",
  wordsReady: "tekrara hazır kelime",
  wordsHint: "Kısa bir tekrar kelimelerini aklında tutar",
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

/** Fills the "{name}" holes of one of the strings above. */
export function fillText(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (hole, name: string) =>
    name in values ? String(values[name]) : hole,
  );
}
