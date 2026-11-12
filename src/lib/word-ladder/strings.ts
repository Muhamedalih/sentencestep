/**
 * The words of the rounds of Word Lists (the wordLadder permission). Kept in this folder, like the
 * words bank's and the rule card's, so the rounds ship without touching the shared dictionaries.
 * English is what a learner with no support language reads.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

/** The rating card shown after a round: its words, from the loved face to the hated one. */
export interface LadderRatingStrings {
  /** The small tag over the card ("New: word rounds"). */
  tag: string;
  title: string;
  subtitle: string;
  /** The five faces' names, from 5 stars (loved) down to 1 (hated). */
  labels: readonly [string, string, string, string, string];
  /** The optional comment box's prompt, by how the learner rated. */
  placeholderPositive: string;
  placeholderNeutral: string;
  placeholderNegative: string;
  send: string;
  notNow: string;
  thanks: string;
}

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
  /** The small caption over each screen, before " · 1 of 3". */
  stepMeet: string;
  stepMeaning: string;
  stepListen: string;
  stepType: string;
  /** "{n}" of "{total}". */
  position: (n: number, total: number) => string;
  /** The button on the meeting screen. */
  next: string;
  /** The speaker's accessible name. */
  listen: string;
  /** After a wrong typed answer: "You typed: x". */
  youTyped: (typed: string) => string;
  /** Under a wrong typed answer: the word comes back once. */
  comesBackOnce: string;
  /** The finish page's big title when every word of the round is secure, and when one is not. */
  roundPassed: string;
  roundOver: (n: number) => string;
  /** What follows the big "+3": "words are yours". */
  wordsTail: (n: number) => string;
  /** Over the masked first word of the next round. */
  nextFirst: string;
  /** What follows the bold count under the bar: "of 63 words in Camping". */
  progressTail: (total: number, title: string) => string;
  /** The small line under it: the words are kept (in the bank, or only as progress). */
  savedToWords: string;
  savedProgress: string;
  /** The finish page's two buttons: another round, and leaving. */
  oneMore: string;
  done: string;
  /** "Round 5": the label in the top corner. */
  nextRound: (n: number) => string;
  /** Shown while the learner's saved progress is read. */
  loading: string;
  rating: LadderRatingStrings;
}

const levelAr = ["المبتدئ", "المتوسط", "المتقدم"];
const levelEn = ["Beginner", "Intermediate", "Advanced"];
const levelEs = ["Principiante", "Intermedio", "Avanzado"];
const levelTr = ["Başlangıç", "Orta", "İleri"];

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
  stepType: "اكتب ما سمعت",
  position: (n, t) => `${n} من ${t}`,
  next: "كمّل",
  listen: "استمع",
  youTyped: (typed) => `كتبتَ: ${typed}`,
  comesBackOnce: "هذه الكلمة تنعاد مرة واحدة في آخر الجولة",
  roundPassed: "اجتزت الجولة",
  roundOver: (n) => `الجولة ${n} انتهت`,
  wordsTail: (n) =>
    n === 1
      ? "كلمة صارت عندك"
      : n === 2
        ? "كلمتان صارتا عندك"
        : n <= 10
          ? "كلمات صارت عندك"
          : "كلمة صارت عندك",
  nextFirst: "أول كلمة في جولتك القادمة",
  progressTail: (t, title) => `من ${t} كلمة في ${title}`,
  savedToWords: "حُفظت في كلماتك.",
  savedProgress: "حُفظ تقدّمك.",
  oneMore: "جولة أخرى",
  done: "انتهيت",
  nextRound: (n) => `الجولة ${n}`,
  loading: "جارٍ التحميل…",
  rating: {
    tag: "جديد: جولات الكلمات",
    title: "ما رأيك في جولات الكلمات؟",
    subtitle: "الميزة جديدة، ورأيك يحدد ما نبنيه بعدها.",
    labels: ["أحبها", "تعجبني", "مقبولة", "لا تعجبني", "أكرهها"],
    placeholderPositive: "ما الذي أعجبك فيها؟ (اختياري)",
    placeholderNeutral: "ما الذي يمكن أن يتحسن؟ (اختياري)",
    placeholderNegative: "ما الذي لم يعجبك؟ (اختياري)",
    send: "إرسال",
    notNow: "ليس الآن",
    thanks: "شكراً لك!",
  },
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
  stepType: "Type what you hear",
  position: (n, t) => `${n} of ${t}`,
  next: "Continue",
  listen: "Listen",
  youTyped: (typed) => `You typed: ${typed}`,
  comesBackOnce: "This word comes back once at the end of the round",
  roundPassed: "Round passed",
  roundOver: (n) => `Round ${n} is over`,
  wordsTail: (n) => (n === 1 ? "word is yours" : "words are yours"),
  nextFirst: "First in your next round",
  progressTail: (t, title) => `of ${t} words in ${title}`,
  savedToWords: "Saved to your words.",
  savedProgress: "Your progress is saved.",
  oneMore: "One more",
  done: "Done",
  nextRound: (n) => `Round ${n}`,
  loading: "Loading…",
  rating: {
    tag: "New: word rounds",
    title: "What do you think of word rounds?",
    subtitle: "It is brand new, and what you say decides what we build next.",
    labels: ["Love it", "Like it", "It's okay", "Don't like it", "Hate it"],
    placeholderPositive: "What did you like? (optional)",
    placeholderNeutral: "What could be better? (optional)",
    placeholderNegative: "What did you not like? (optional)",
    send: "Send",
    notNow: "Not now",
    thanks: "Thank you!",
  },
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
  stepType: "Escribe lo que oyes",
  position: (n, t) => `${n} de ${t}`,
  next: "Continuar",
  listen: "Escuchar",
  youTyped: (typed) => `Escribiste: ${typed}`,
  comesBackOnce: "Esta palabra vuelve una vez al final de la ronda",
  roundPassed: "Ronda superada",
  roundOver: (n) => `La ronda ${n} terminó`,
  wordsTail: (n) => (n === 1 ? "palabra ya es tuya" : "palabras ya son tuyas"),
  nextFirst: "La primera de tu próxima ronda",
  progressTail: (t, title) => `de ${t} palabras en ${title}`,
  savedToWords: "Guardadas en tus palabras.",
  savedProgress: "Tu progreso está guardado.",
  oneMore: "Una más",
  done: "Listo",
  nextRound: (n) => `Ronda ${n}`,
  loading: "Cargando…",
  rating: {
    tag: "Nuevo: rondas de palabras",
    title: "¿Qué te parecen las rondas de palabras?",
    subtitle: "Es nueva, y lo que digas decide lo que construimos después.",
    labels: ["Me encanta", "Me gusta", "Está bien", "No me gusta", "La odio"],
    placeholderPositive: "¿Qué te gustó? (opcional)",
    placeholderNeutral: "¿Qué podría mejorar? (opcional)",
    placeholderNegative: "¿Qué no te gustó? (opcional)",
    send: "Enviar",
    notNow: "Ahora no",
    thanks: "¡Gracias!",
  },
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
  stepType: "Duyduğunu yaz",
  position: (n, t) => `${n} / ${t}`,
  next: "Devam",
  listen: "Dinle",
  youTyped: (typed) => `Yazdığın: ${typed}`,
  comesBackOnce: "Bu kelime turun sonunda bir kez daha gelir",
  roundPassed: "Tur geçildi",
  roundOver: (n) => `${n}. tur bitti`,
  wordsTail: () => "kelime artık senin",
  nextFirst: "Sonraki turunun ilk kelimesi",
  progressTail: (t, title) => `${title} konusunda ${t} kelimeden`,
  savedToWords: "Kelimelerine kaydedildi.",
  savedProgress: "İlerlemen kaydedildi.",
  oneMore: "Bir tur daha",
  done: "Bitti",
  nextRound: (n) => `Tur ${n}`,
  loading: "Yükleniyor…",
  rating: {
    tag: "Yeni: kelime turları",
    title: "Kelime turlarını nasıl buldun?",
    subtitle: "Yepyeni bir özellik, söylediklerin sonra ne yapacağımızı belirler.",
    labels: ["Bayıldım", "Beğendim", "İdare eder", "Beğenmedim", "Nefret ettim"],
    placeholderPositive: "Neyi beğendin? (isteğe bağlı)",
    placeholderNeutral: "Ne daha iyi olabilir? (isteğe bağlı)",
    placeholderNegative: "Neyi beğenmedin? (isteğe bağlı)",
    send: "Gönder",
    notNow: "Şimdi değil",
    thanks: "Teşekkürler!",
  },
};

const LADDER_STRINGS: Record<SupportLocale, LadderStrings> = { ar: AR, es: ES, tr: TR };

export function ladderStrings(locale: SupportLocale | null): LadderStrings {
  return locale ? LADDER_STRINGS[locale] : EN;
}
