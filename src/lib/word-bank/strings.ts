/**
 * The words of the «كلماتي» section's own page (the review round keeps its strings in the shared
 * dictionaries, under `myWords`). Kept in this folder, like the rule card's and the video section's,
 * so the page ships without touching the shared dictionaries. English is what a learner with no
 * support language reads.
 */

import type { SupportLocale } from "@/lib/i18n/locales";
import type { BankSource } from "@/lib/word-bank/types";

export interface BankStrings {
  /** The line under the page's title. */
  sub: string;
  today: string;
  /** The words beside the big number of today's words ("words today"). */
  todayLabel: (n: number) => string;
  /** How long today's round takes, for `n` words. */
  minutes: (n: number) => string;
  /** "{when}" is "yesterday", "last Sunday"... (the dictionary's myWords.when*). */
  lastReview: string;
  /** "{n}" words "from" the lesson "{title}". */
  fromTitle: string;
  /** The same for words that carry no lesson title, by where they were met. */
  fromSource: Record<BankSource, string>;
  start: string;
  /** The day's five are answered. */
  doneToday: string;
  /** Nothing is due, and nothing was asked today. */
  nothingDue: string;
  nextTomorrow: string;
  /** "{n}" days, two or more. */
  nextInDays: (n: number) => string;
  /** The words under the big number of stable words. */
  stableLabel: (n: number) => string;
  legendStable: string;
  /** "{n}" of "{cap}". */
  legendActive: string;
  legendWaiting: string;
  waitingNote: string;
  activeTitle: string;
  waitingTitle: string;
  stableTitle: string;
  /** "{count}" is `words(n)`; "{cap}" the cap. */
  activeSub: string;
  waitingSub: string;
  stableSub: string;
  show: string;
  /** A count with its noun: "14 words". */
  words: (n: number) => string;
  tabAll: string;
  dueToday: string;
  dueTomorrow: string;
  dueInDays: (n: number) => string;
  /** What kind of lesson a group of the list came from. */
  kind: Record<BankSource, string>;
  listEmpty: string;
  emptyTitle: string;
  emptyBody: string;
  emptyAction: string;
}

/** Arabic counts its nouns in the plural from three to ten only. */
function arNoun(n: number, one: string, few: string): string {
  return n >= 3 && n <= 10 ? few : one;
}

const AR: BankStrings = {
  sub: "الكلمات المستهدفة في دروسك. خمس في اليوم، لا أكثر.",
  today: "اليوم",
  todayLabel: (n) => (n === 1 ? "كلمة اليوم" : "كلمات اليوم"),
  minutes: (n) => (n <= 2 ? "دقيقة تقريباً" : "دقيقتان تقريباً"),
  lastReview: "آخر مراجعة {when}",
  fromTitle: "{n} من {title}",
  fromSource: {
    story: "{n} من قصة",
    passage: "{n} من نص",
    lesson: "{n} من درس",
    core: "{n} من كلمات الموقع",
    star: "{n} بنجمتك",
  },
  start: "ابدأ المراجعة",
  doneToday: "أنهيت كلمات اليوم",
  nothingDue: "لا كلمات مستحقة اليوم",
  nextTomorrow: "الكلمات التالية غداً",
  nextInDays: (n) => (n === 2 ? "الكلمات التالية بعد يومين" : `الكلمات التالية بعد ${n} أيام`),
  stableLabel: (n) => arNoun(n, "كلمة ثابتة", "كلمات ثابتة"),
  legendStable: "ثابتة {n}",
  legendActive: "قيد التثبيت {n} من {cap}",
  legendWaiting: "بالانتظار {n}",
  waitingNote: "الكلمات بالانتظار تدخل وحدها كلما ثبتت كلمة.",
  activeTitle: "قيد التثبيت",
  waitingTitle: "بالانتظار",
  stableTitle: "ثابتة",
  activeSub: "{count} · السقف {cap}",
  waitingSub: "{count} · لا تُحسب عليك",
  stableSub: "{count} · خرجت من جولة اليوم",
  show: "اعرضها",
  words: (n) => `${n} ${arNoun(n, "كلمة", "كلمات")}`,
  tabAll: "الكل",
  dueToday: "اليوم",
  dueTomorrow: "غداً",
  dueInDays: (n) => (n === 2 ? "بعد يومين" : `بعد ${n} ${n <= 10 ? "أيام" : "يوماً"}`),
  kind: { story: "قصة", passage: "نص", lesson: "درس", core: "كلمات الموقع", star: "نجمتك" },
  listEmpty: "لا كلمات هنا بعد.",
  emptyTitle: "لا كلمات بعد",
  emptyBody: "أكمل قصة أو كلمات اليوم، وستدخل كلماتها المستهدفة هنا وحدها.",
  emptyAction: "إلى القصص",
};

const EN: BankStrings = {
  sub: "The target words of your lessons. Five a day, no more.",
  today: "Today",
  todayLabel: (n) => (n === 1 ? "word today" : "words today"),
  minutes: (n) => (n <= 2 ? "about a minute" : "about two minutes"),
  lastReview: "last review {when}",
  fromTitle: "{n} from {title}",
  fromSource: {
    story: "{n} from a story",
    passage: "{n} from a passage",
    lesson: "{n} from a lesson",
    core: "{n} from the site's words",
    star: "{n} you starred",
  },
  start: "Start the review",
  doneToday: "Today's words are done",
  nothingDue: "No words due today",
  nextTomorrow: "The next words come tomorrow",
  nextInDays: (n) => `The next words come in ${n} days`,
  stableLabel: (n) => (n === 1 ? "stable word" : "stable words"),
  legendStable: "Stable {n}",
  legendActive: "Settling {n} of {cap}",
  legendWaiting: "Waiting {n}",
  waitingNote: "Waiting words move in by themselves each time a word becomes stable.",
  activeTitle: "Settling",
  waitingTitle: "Waiting",
  stableTitle: "Stable",
  activeSub: "{count} · the cap is {cap}",
  waitingSub: "{count} · not counted against you",
  stableSub: "{count} · out of the daily round",
  show: "Show them",
  words: (n) => `${n} ${n === 1 ? "word" : "words"}`,
  tabAll: "All",
  dueToday: "today",
  dueTomorrow: "tomorrow",
  dueInDays: (n) => `in ${n} days`,
  kind: {
    story: "story",
    passage: "passage",
    lesson: "lesson",
    core: "site words",
    star: "starred",
  },
  listEmpty: "No words here yet.",
  emptyTitle: "No words yet",
  emptyBody:
    "Finish a story or Today's words, and their target words will arrive here by themselves.",
  emptyAction: "To the stories",
};

const ES: BankStrings = {
  sub: "Las palabras clave de tus lecciones. Cinco al día, no más.",
  today: "Hoy",
  todayLabel: (n) => (n === 1 ? "palabra hoy" : "palabras hoy"),
  minutes: (n) => (n <= 2 ? "un minuto aprox." : "unos dos minutos"),
  lastReview: "último repaso {when}",
  fromTitle: "{n} de {title}",
  fromSource: {
    story: "{n} de una historia",
    passage: "{n} de un texto",
    lesson: "{n} de una lección",
    core: "{n} de las palabras del sitio",
    star: "{n} con tu estrella",
  },
  start: "Empezar el repaso",
  doneToday: "Has terminado las palabras de hoy",
  nothingDue: "Hoy no hay palabras pendientes",
  nextTomorrow: "Las siguientes llegan mañana",
  nextInDays: (n) => `Las siguientes llegan en ${n} días`,
  stableLabel: (n) => (n === 1 ? "palabra fijada" : "palabras fijadas"),
  legendStable: "Fijadas {n}",
  legendActive: "Afianzando {n} de {cap}",
  legendWaiting: "En espera {n}",
  waitingNote: "Las palabras en espera entran solas cada vez que una se fija.",
  activeTitle: "Afianzando",
  waitingTitle: "En espera",
  stableTitle: "Fijadas",
  activeSub: "{count} · el tope es {cap}",
  waitingSub: "{count} · no cuentan en tu contra",
  stableSub: "{count} · fuera de la ronda diaria",
  show: "Verlas",
  words: (n) => `${n} ${n === 1 ? "palabra" : "palabras"}`,
  tabAll: "Todas",
  dueToday: "hoy",
  dueTomorrow: "mañana",
  dueInDays: (n) => `en ${n} días`,
  kind: {
    story: "historia",
    passage: "texto",
    lesson: "lección",
    core: "palabras del sitio",
    star: "tu estrella",
  },
  listEmpty: "Aún no hay palabras aquí.",
  emptyTitle: "Aún no hay palabras",
  emptyBody:
    "Termina una historia o las palabras de hoy, y sus palabras clave llegarán aquí solas.",
  emptyAction: "A las historias",
};

const TR: BankStrings = {
  sub: "Derslerinin hedef kelimeleri. Günde beş kelime, daha fazla değil.",
  today: "Bugün",
  todayLabel: () => "kelime bugün",
  minutes: (n) => (n <= 2 ? "yaklaşık bir dakika" : "yaklaşık iki dakika"),
  lastReview: "son tekrar: {when}",
  fromTitle: "{title}: {n}",
  fromSource: {
    story: "bir hikâyeden {n}",
    passage: "bir metinden {n}",
    lesson: "bir dersten {n}",
    core: "site kelimelerinden {n}",
    star: "yıldızladığın {n}",
  },
  start: "Tekrara başla",
  doneToday: "Bugünün kelimeleri bitti",
  nothingDue: "Bugün tekrar edilecek kelime yok",
  nextTomorrow: "Sıradaki kelimeler yarın",
  nextInDays: (n) => `Sıradaki kelimeler ${n} gün sonra`,
  stableLabel: () => "kalıcı kelime",
  legendStable: "Kalıcı {n}",
  legendActive: "Pekişiyor {n}/{cap}",
  legendWaiting: "Bekliyor {n}",
  waitingNote: "Bekleyen kelimeler, bir kelime kalıcı oldukça kendiliğinden sıraya girer.",
  activeTitle: "Pekişiyor",
  waitingTitle: "Bekliyor",
  stableTitle: "Kalıcı",
  activeSub: "{count} · sınır {cap}",
  waitingSub: "{count} · sana yük sayılmaz",
  stableSub: "{count} · günlük turdan çıktı",
  show: "Göster",
  words: (n) => `${n} kelime`,
  tabAll: "Tümü",
  dueToday: "bugün",
  dueTomorrow: "yarın",
  dueInDays: (n) => `${n} gün sonra`,
  kind: {
    story: "hikâye",
    passage: "metin",
    lesson: "ders",
    core: "site kelimeleri",
    star: "yıldızlı",
  },
  listEmpty: "Burada henüz kelime yok.",
  emptyTitle: "Henüz kelime yok",
  emptyBody:
    "Bir hikâyeyi ya da bugünün kelimelerini bitir; hedef kelimeleri buraya kendiliğinden gelir.",
  emptyAction: "Hikâyelere",
};

const BANK_STRINGS: Record<SupportLocale, BankStrings> = { ar: AR, es: ES, tr: TR };

export function bankStrings(locale: SupportLocale | null): BankStrings {
  return locale ? BANK_STRINGS[locale] : EN;
}
