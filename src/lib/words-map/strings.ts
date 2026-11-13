/**
 * The words of the Map tab («الخريطة», the wordsMap permission) and of today's session. Kept in this
 * folder, like the other Words sections', so the feature ships without touching the shared
 * dictionaries. English is what a learner with no support language reads.
 */

import type { SupportLocale } from "@/lib/i18n/locales";
import type { MapWordState } from "@/lib/words-map/state";
import type { PickReason } from "@/lib/words-map/pick";

export interface WordsMapStrings {
  /** The tab's label. */
  tab: string;
  /** The band: "words you have learned", the settling/new line and the session button. */
  learned: string;
  bandLine: (settling: number, fresh: number) => string;
  startSession: string;
  /** The band's button when there is no new word left. */
  noneLeft: string;
  /** The two views and their accessible name. */
  viewMap: string;
  viewList: string;
  viewsLabel: string;
  levelAll: string;
  /** A topic's circle: "9 / 25"; the pill on a topic that gives a word to today's session. */
  today: string;
  /** The list: the search box, the filters, the state notes and an empty result. */
  searchPlaceholder: (n: number) => string;
  filterAll: string;
  state: Record<MapWordState, string>;
  startsToday: string;
  listEmpty: string;
  /** The session screen. */
  sessionLabel: string;
  sessionTitle: (words: number, topics: number) => string;
  sessionNote: string;
  begin: string;
  back: string;
  reason: (reason: PickReason, topic: string) => string;
  sessionEmpty: string;
  /** The title of the round's group, in the bank's lesson name. */
  roundTitle: string;
}

const AR: WordsMapStrings = {
  tab: "الخريطة",
  learned: "كلمة تعلّمتها",
  bandLine: (settling, fresh) => `${settling} قيد التثبيت · ${fresh} جديدة`,
  startSession: "ابدأ جلسة اليوم",
  noneLeft: "أنهيت كل الكلمات",
  viewMap: "خريطة",
  viewList: "قائمة الكلمات",
  viewsLabel: "طريقة العرض",
  levelAll: "الكل",
  today: "اليوم",
  searchPlaceholder: (n) => `ابحث في ${n} كلمة`,
  filterAll: "الكل",
  state: { unseen: "لم تُرَ", new: "جديدة", settling: "قيد التثبيت", stable: "ثابتة" },
  startsToday: "تبدأ بها اليوم",
  listEmpty: "لا توجد كلمات بهذا الشكل.",
  sessionLabel: "جلسة اليوم",
  sessionTitle: (words, topics) => `${words} كلمات جديدة من ${topics} مواضيع`,
  sessionNote:
    "كل كلمة تمر بخمس خطوات. تتبدّل المواضيع داخل الجلسة فلا تختلط عليك الكلمات المتشابهة.",
  begin: "ابدأ",
  back: "الخريطة",
  reason: (reason, topic) => {
    if (reason.kind === "finish")
      return `تنهي به موضوع ${topic}: ${reason.left === 1 ? "بقيت كلمة" : "بقيت كلمتان"}`;
    if (reason.kind === "seen") return `تظهر في ${reason.lessons} دروس وقصص`;
    if (reason.kind === "continue") return `بدأت ${topic} ولم تكمل`;
    return `موضوع جديد: ${topic}`;
  },
  sessionEmpty: "ما بقيت كلمات جديدة في الموضوعات المفتوحة.",
  roundTitle: "جلسة اليوم",
};

const EN: WordsMapStrings = {
  tab: "Map",
  learned: "words learned",
  bandLine: (settling, fresh) => `${settling} settling · ${fresh} new`,
  startSession: "Start today's session",
  noneLeft: "You have met every word",
  viewMap: "Map",
  viewList: "Word list",
  viewsLabel: "View",
  levelAll: "All",
  today: "Today",
  searchPlaceholder: (n) => `Search ${n} words`,
  filterAll: "All",
  state: { unseen: "Not seen", new: "New", settling: "Settling", stable: "Stable" },
  startsToday: "Starts today",
  listEmpty: "No words match.",
  sessionLabel: "Today's session",
  sessionTitle: (words, topics) => `${words} new words from ${topics} topics`,
  sessionNote:
    "Each word goes through five steps. Topics change inside the session, so similar words do not get mixed up.",
  begin: "Start",
  back: "Map",
  reason: (reason, topic) => {
    if (reason.kind === "finish")
      return `Finishes ${topic}: ${reason.left === 1 ? "one word left" : "two words left"}`;
    if (reason.kind === "seen") return `Appears in ${reason.lessons} lessons and stories`;
    if (reason.kind === "continue") return `You began ${topic} and have not finished it`;
    return `A new topic: ${topic}`;
  },
  sessionEmpty: "No new words are left in the open topics.",
  roundTitle: "Today's session",
};

const ES: WordsMapStrings = {
  tab: "Mapa",
  learned: "palabras aprendidas",
  bandLine: (settling, fresh) => `${settling} afianzando · ${fresh} nuevas`,
  startSession: "Empezar la sesión de hoy",
  noneLeft: "Ya viste todas las palabras",
  viewMap: "Mapa",
  viewList: "Lista de palabras",
  viewsLabel: "Vista",
  levelAll: "Todas",
  today: "Hoy",
  searchPlaceholder: (n) => `Buscar entre ${n} palabras`,
  filterAll: "Todas",
  state: { unseen: "Sin ver", new: "Nuevas", settling: "Afianzando", stable: "Estables" },
  startsToday: "Empiezas hoy",
  listEmpty: "No hay palabras así.",
  sessionLabel: "Sesión de hoy",
  sessionTitle: (words, topics) => `${words} palabras nuevas de ${topics} temas`,
  sessionNote:
    "Cada palabra pasa por cinco pasos. Los temas cambian dentro de la sesión, para que las palabras parecidas no se confundan.",
  begin: "Empezar",
  back: "Mapa",
  reason: (reason, topic) => {
    if (reason.kind === "finish")
      return `Termina ${topic}: ${reason.left === 1 ? "queda una palabra" : "quedan dos palabras"}`;
    if (reason.kind === "seen") return `Aparece en ${reason.lessons} lecciones e historias`;
    if (reason.kind === "continue") return `Empezaste ${topic} y no lo terminaste`;
    return `Un tema nuevo: ${topic}`;
  },
  sessionEmpty: "No quedan palabras nuevas en los temas abiertos.",
  roundTitle: "Sesión de hoy",
};

const TR: WordsMapStrings = {
  tab: "Harita",
  learned: "kelime öğrendin",
  bandLine: (settling, fresh) => `${settling} pekişiyor · ${fresh} yeni`,
  startSession: "Bugünkü oturumu başlat",
  noneLeft: "Tüm kelimeleri gördün",
  viewMap: "Harita",
  viewList: "Kelime listesi",
  viewsLabel: "Görünüm",
  levelAll: "Tümü",
  today: "Bugün",
  searchPlaceholder: (n) => `${n} kelimede ara`,
  filterAll: "Tümü",
  state: { unseen: "Görülmedi", new: "Yeni", settling: "Pekişiyor", stable: "Kalıcı" },
  startsToday: "Bugün başlıyorsun",
  listEmpty: "Böyle kelime yok.",
  sessionLabel: "Bugünkü oturum",
  sessionTitle: (words, topics) => `${topics} konudan ${words} yeni kelime`,
  sessionNote:
    "Her kelime beş adımdan geçer. Konular oturum içinde değişir, böylece benzer kelimeler karışmaz.",
  begin: "Başla",
  back: "Harita",
  reason: (reason, topic) => {
    if (reason.kind === "finish")
      return `${topic} konusunu bitirir: ${reason.left === 1 ? "bir kelime kaldı" : "iki kelime kaldı"}`;
    if (reason.kind === "seen") return `${reason.lessons} derste ve hikâyede geçiyor`;
    if (reason.kind === "continue") return `${topic} konusuna başladın, bitirmedin`;
    return `Yeni bir konu: ${topic}`;
  },
  sessionEmpty: "Açık konularda yeni kelime kalmadı.",
  roundTitle: "Bugünkü oturum",
};

const STRINGS: Record<SupportLocale, WordsMapStrings> = { ar: AR, es: ES, tr: TR };

export function wordsMapStrings(locale: SupportLocale | null): WordsMapStrings {
  return locale ? STRINGS[locale] : EN;
}
