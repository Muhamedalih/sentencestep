/**
 * The words of the five-step rounds of Word Lists (the wordLadder permission). Kept in this folder,
 * like the words bank's and the rule card's, so the rounds ship without touching the shared
 * dictionaries. English is what a learner with no support language reads.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

export interface LadderStrings {
  /** The way back from a round and from a topic. */
  back: string;
  /** "{n}" of "{total}" words: under the topic's title. */
  progress: (done: number, total: number) => string;
  /** "Round 5 of 8". */
  roundOf: (n: number, count: number) => string;
  /** The button that opens round `n`. */
  startRound: (n: number) => string;
  /** The link to the topic's whole list of words. */
  allWords: (total: number) => string;
  /** The topic is finished: its title, then the button to go round again. */
  topicDone: (title: string) => string;
  again: string;
  /** The level line over a topic's title (1 to 3). */
  level: (level: number) => string;
  /** The small caption over each step, before " · 1 of 3". */
  stepMeet: string;
  stepMeaning: string;
  stepListen: string;
  stepLetters: string;
  stepType: string;
  /** "{n}" of "{total}". */
  position: (n: number, total: number) => string;
  /** The button on the meeting screen. */
  next: string;
  /** Under the letters: how to put them in. */
  lettersHint: string;
  /** The speaker's accessible name. */
  listen: string;
  /** After a wrong typed answer: "You typed: x". */
  youTyped: (typed: string) => string;
  /** Under a wrong typed answer: the word comes back once. */
  comesBackOnce: string;
  /** Round finish: the title line "Round 5 is over". */
  roundOver: (n: number) => string;
  /** "3 words are yours now". */
  gotWords: (n: number) => string;
  chipClean: string;
  chipAssisted: string;
  chipMissed: string;
  /** The line that says where the words come back (only when the words bank is open). */
  comesBack: string;
  /** "15 of 25 words in Family". */
  progressIn: (done: number, total: number, title: string) => string;
  /** The finish screen's buttons: the next round, and leaving. */
  nextRound: (n: number) => string;
  enough: string;
  /** Shown while the learner's saved progress is read. */
  loading: string;
}

const levelAr = ["المبتدئ", "المتوسط", "المتقدم"];
const levelEn = ["Beginner", "Intermediate", "Advanced"];
const levelEs = ["Principiante", "Intermedio", "Avanzado"];
const levelTr = ["Başlangıç", "Orta", "İleri"];

const arWords = (n: number) => (n === 1 ? "كلمة" : n === 2 ? "كلمتان" : n <= 10 ? "كلمات" : "كلمة");

const AR: LadderStrings = {
  back: "الكلمات",
  progress: (d, t) => `${d} من ${t} كلمة`,
  roundOf: (n, c) => `الجولة ${n} من ${c}`,
  startRound: (n) => `ابدأ الجولة ${n}`,
  allWords: (t) => `كل كلمات المجموعة (${t})`,
  topicDone: (title) => `أنهيت كل كلمات ${title}`,
  again: "ابدأ من البداية",
  level: (l) => levelAr[l - 1] ?? "",
  stepMeet: "كلمة جديدة",
  stepMeaning: "ما معنى هذه الكلمة؟",
  stepListen: "أي كلمة سمعت؟",
  stepLetters: "رتّب الحروف",
  stepType: "اكتب ما سمعت",
  position: (n, t) => `${n} من ${t}`,
  next: "كمّل",
  lettersHint: "اكتب بالكيبورد أو اضغط الحروف",
  listen: "استمع",
  youTyped: (typed) => `كتبتَ: ${typed}`,
  comesBackOnce: "هذه الكلمة تنعاد مرة واحدة في آخر الجولة",
  roundOver: (n) => `الجولة ${n} انتهت`,
  gotWords: (n) =>
    n === 1
      ? "كلمة واحدة صارت عندك"
      : n === 2
        ? "كلمتان صارتا عندك"
        : `${n} ${arWords(n)} صارت عندك`,
  chipClean: "من أول مرة",
  chipAssisted: "أعدتها مرة",
  chipMissed: "لم تثبت بعد",
  comesBack: "تعود إليك في المراجعة قبل أن تنساها.",
  progressIn: (d, t, title) => `${d} من ${t} كلمة في ${title}`,
  nextRound: (n) => `الجولة ${n}`,
  enough: "كفاية اليوم",
  loading: "جارٍ التحميل…",
};

const EN: LadderStrings = {
  back: "Words",
  progress: (d, t) => `${d} of ${t} words`,
  roundOf: (n, c) => `Round ${n} of ${c}`,
  startRound: (n) => `Start round ${n}`,
  allWords: (t) => `All the topic's words (${t})`,
  topicDone: (title) => `You finished every word of ${title}`,
  again: "Start again",
  level: (l) => levelEn[l - 1] ?? "",
  stepMeet: "New word",
  stepMeaning: "What does it mean?",
  stepListen: "Which word did you hear?",
  stepLetters: "Put the letters in order",
  stepType: "Type what you hear",
  position: (n, t) => `${n} of ${t}`,
  next: "Continue",
  lettersHint: "Type on the keyboard or tap the letters",
  listen: "Listen",
  youTyped: (typed) => `You typed: ${typed}`,
  comesBackOnce: "This word comes back once at the end of the round",
  roundOver: (n) => `Round ${n} is over`,
  gotWords: (n) => (n === 1 ? "1 word is yours now" : `${n} words are yours now`),
  chipClean: "First time",
  chipAssisted: "Needed a second go",
  chipMissed: "Not secure yet",
  comesBack: "They come back in your review before you forget them.",
  progressIn: (d, t, title) => `${d} of ${t} words in ${title}`,
  nextRound: (n) => `Round ${n}`,
  enough: "That's enough for today",
  loading: "Loading…",
};

const ES: LadderStrings = {
  back: "Palabras",
  progress: (d, t) => `${d} de ${t} palabras`,
  roundOf: (n, c) => `Ronda ${n} de ${c}`,
  startRound: (n) => `Empezar la ronda ${n}`,
  allWords: (t) => `Todas las palabras del tema (${t})`,
  topicDone: (title) => `Terminaste todas las palabras de ${title}`,
  again: "Empezar de nuevo",
  level: (l) => levelEs[l - 1] ?? "",
  stepMeet: "Palabra nueva",
  stepMeaning: "¿Qué significa?",
  stepListen: "¿Qué palabra oíste?",
  stepLetters: "Ordena las letras",
  stepType: "Escribe lo que oyes",
  position: (n, t) => `${n} de ${t}`,
  next: "Continuar",
  lettersHint: "Escribe con el teclado o toca las letras",
  listen: "Escuchar",
  youTyped: (typed) => `Escribiste: ${typed}`,
  comesBackOnce: "Esta palabra vuelve una vez al final de la ronda",
  roundOver: (n) => `La ronda ${n} terminó`,
  gotWords: (n) => (n === 1 ? "1 palabra ya es tuya" : `${n} palabras ya son tuyas`),
  chipClean: "A la primera",
  chipAssisted: "Necesitó otro intento",
  chipMissed: "Aún no está firme",
  comesBack: "Vuelven en tu repaso antes de que las olvides.",
  progressIn: (d, t, title) => `${d} de ${t} palabras en ${title}`,
  nextRound: (n) => `Ronda ${n}`,
  enough: "Por hoy es suficiente",
  loading: "Cargando…",
};

const TR: LadderStrings = {
  back: "Kelimeler",
  progress: (d, t) => `${d} / ${t} kelime`,
  roundOf: (n, c) => `Tur ${n} / ${c}`,
  startRound: (n) => `${n}. turu başlat`,
  allWords: (t) => `Konunun tüm kelimeleri (${t})`,
  topicDone: (title) => `${title} konusunun tüm kelimelerini bitirdin`,
  again: "Baştan başla",
  level: (l) => levelTr[l - 1] ?? "",
  stepMeet: "Yeni kelime",
  stepMeaning: "Ne anlama geliyor?",
  stepListen: "Hangi kelimeyi duydun?",
  stepLetters: "Harfleri sıraya koy",
  stepType: "Duyduğunu yaz",
  position: (n, t) => `${n} / ${t}`,
  next: "Devam",
  lettersHint: "Klavyeyle yaz ya da harflere dokun",
  listen: "Dinle",
  youTyped: (typed) => `Yazdığın: ${typed}`,
  comesBackOnce: "Bu kelime turun sonunda bir kez daha gelir",
  roundOver: (n) => `${n}. tur bitti`,
  gotWords: (n) => (n === 1 ? "1 kelime artık senin" : `${n} kelime artık senin`),
  chipClean: "İlk seferde",
  chipAssisted: "İkinci deneme gerekti",
  chipMissed: "Henüz oturmadı",
  comesBack: "Unutmadan önce tekrarında geri gelirler.",
  progressIn: (d, t, title) => `${title} konusunda ${d} / ${t} kelime`,
  nextRound: (n) => `Tur ${n}`,
  enough: "Bugünlük yeter",
  loading: "Yükleniyor…",
};

const LADDER_STRINGS: Record<SupportLocale, LadderStrings> = { ar: AR, es: ES, tr: TR };

export function ladderStrings(locale: SupportLocale | null): LadderStrings {
  return locale ? LADDER_STRINGS[locale] : EN;
}
