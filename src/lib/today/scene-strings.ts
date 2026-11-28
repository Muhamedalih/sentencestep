/**
 * The words of the day's scene (permission dailyScene), and the corrected explanations of the usual
 * tasks (permission todayTidy). Kept here, like the words rounds' strings, so they ship without
 * touching the shared dictionaries. English is what a learner with no support language reads.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

export interface SceneStrings {
  /** The day's name on Home's folded tasks box. */
  name: string;
  taskListen: string;
  taskLines: string;
  taskWords: string;
  startListen: string;
  startLines: string;
  startWords: string;
  /** Under the open task: why it is worth doing. */
  whyListen: string;
  whyLines: string;
  whyWords: string;
  /** The detail line of the second task: how many lines are missing. */
  linesMeta: (count: number) => string;
  wordsMeta: string;
  /** "About 3 minutes" after the line count. */
  about: (minutes: number) => string;
  /** The reward line of the tasks box while something is left. */
  reward: (xp: number) => string;
  /** The small line over the passage title on the lines screen. */
  position: (n: number, total: number) => string;
  /** The two named buttons of the lines screen's corner toolbar. */
  showSentence: string;
  replay: string;
  /** The accessible name of the hidden answer field. */
  typeLine: string;
  /** A wrong letter, said to a screen reader. */
  wrongLetter: string;
  sideTitle: string;
  exit: string;
  /** The end of the lines. */
  doneTitle: string;
  doneBody: string;
  toWords: string;
  /** The button at the end of the passage. */
  fromPassage: string;
  /** The words step's three moves, and the small label over the line. */
  moveMeaning: string;
  moveLetters: string;
  moveType: string;
  fromScene: string;
}

const EN: SceneStrings = {
  name: "Today's scene",
  taskListen: "Hear the scene",
  taskLines: "Complete the scene",
  taskWords: "The scene's words",
  startListen: "Hear the scene",
  startLines: "Complete the scene",
  startWords: "Scene words",
  whyListen: "One scene for the whole day: first you hear it and read it",
  whyLines: "The lines you just heard: write them by ear",
  whyWords: "The words you wrote: their meaning, their letters, then from memory",
  linesMeta: (n) => (n === 1 ? "1 missing line" : `${n} missing lines`),
  wordsMeta: "Meaning, letters, then from memory",
  about: (n) => `about ${n} min`,
  reward: (xp) => `Complete the scene: +${xp} XP`,
  position: (n, total) => `Complete the scene · ${n} of ${total}`,
  showSentence: "Show sentence",
  replay: "Replay audio",
  typeLine: "Type what you hear",
  wrongLetter: "Wrong letter",
  sideTitle: "Scene words",
  exit: "Close",
  doneTitle: "Scene complete",
  doneBody: "You wrote its lines by ear. Now its words.",
  toWords: "Scene words",
  fromPassage: "Complete the scene",
  moveMeaning: "What does it mean?",
  moveLetters: "Put its letters in order",
  moveType: "Write it from memory",
  fromScene: "From the scene",
};

const AR: SceneStrings = {
  name: "مشهد اليوم",
  taskListen: "اسمع المشهد",
  taskLines: "أكمل المشهد",
  taskWords: "كلمات المشهد",
  startListen: "اسمع المشهد",
  startLines: "أكمل المشهد",
  startWords: "كلمات المشهد",
  whyListen: "مشهد واحد لليوم كله: أولاً تسمعه وتقرأه",
  whyLines: "الأسطر التي سمعتها للتو: اكتبها من أذنك",
  whyWords: "الكلمات التي كتبتها: معناها، حروفها، ثم من الذاكرة",
  linesMeta: (n) => (n === 1 ? "سطر مفقود" : n === 2 ? "سطران مفقودان" : `${n} أسطر مفقودة`),
  wordsMeta: "معنى، حروف، ثم من الذاكرة",
  about: (n) =>
    n === 1 ? "نحو دقيقة" : n === 2 ? "نحو دقيقتين" : n <= 10 ? `نحو ${n} دقائق` : `نحو ${n} دقيقة`,
  reward: (xp) => `أكمل المشهد: +${xp} XP`,
  position: (n, total) => `أكمل المشهد · ${n} من ${total}`,
  showSentence: "إظهار الجملة",
  replay: "إعادة الصوت",
  typeLine: "اكتب ما تسمعه",
  wrongLetter: "حرف خاطئ",
  sideTitle: "كلمات المشهد",
  exit: "إغلاق",
  doneTitle: "أكملت المشهد",
  doneBody: "كتبت أسطره من أذنك. الآن كلماته.",
  toWords: "كلمات المشهد",
  fromPassage: "أكمل المشهد",
  moveMeaning: "ما معناها؟",
  moveLetters: "رتّب حروفها",
  moveType: "اكتبها من الذاكرة",
  fromScene: "من المشهد",
};

const ES: SceneStrings = {
  name: "La escena de hoy",
  taskListen: "Escucha la escena",
  taskLines: "Completa la escena",
  taskWords: "Las palabras de la escena",
  startListen: "Escuchar la escena",
  startLines: "Completar la escena",
  startWords: "Palabras de la escena",
  whyListen: "Una sola escena para todo el día: primero la escuchas y la lees",
  whyLines: "Las líneas que acabas de oír: escríbelas de oído",
  whyWords: "Las palabras que escribiste: significado, letras y luego de memoria",
  linesMeta: (n) => (n === 1 ? "Falta 1 línea" : `Faltan ${n} líneas`),
  wordsMeta: "Significado, letras y luego de memoria",
  about: (n) => `unos ${n} min`,
  reward: (xp) => `Completa la escena: +${xp} XP`,
  position: (n, total) => `Completa la escena · ${n} de ${total}`,
  showSentence: "Mostrar la frase",
  replay: "Repetir audio",
  typeLine: "Escribe lo que oyes",
  wrongLetter: "Letra incorrecta",
  sideTitle: "Palabras de la escena",
  exit: "Cerrar",
  doneTitle: "Escena completa",
  doneBody: "Escribiste sus líneas de oído. Ahora sus palabras.",
  toWords: "Palabras de la escena",
  fromPassage: "Completar la escena",
  moveMeaning: "¿Qué significa?",
  moveLetters: "Ordena sus letras",
  moveType: "Escríbela de memoria",
  fromScene: "De la escena",
};

const TR: SceneStrings = {
  name: "Bugünün sahnesi",
  taskListen: "Sahneyi dinle",
  taskLines: "Sahneyi tamamla",
  taskWords: "Sahnenin kelimeleri",
  startListen: "Sahneyi dinle",
  startLines: "Sahneyi tamamla",
  startWords: "Sahnenin kelimeleri",
  whyListen: "Bütün gün tek bir sahne: önce dinler ve okursun",
  whyLines: "Az önce duyduğun satırları kulaktan yaz",
  whyWords: "Yazdığın kelimeler: anlamı, harfleri, sonra ezberden",
  linesMeta: (n) => `${n} eksik satır`,
  wordsMeta: "Anlam, harfler, sonra ezberden",
  about: (n) => `yaklaşık ${n} dk`,
  reward: (xp) => `Sahneyi tamamla: +${xp} XP`,
  position: (n, total) => `Sahneyi tamamla · ${n}/${total}`,
  showSentence: "Cümleyi göster",
  replay: "Sesi tekrarla",
  typeLine: "Duyduğunu yaz",
  wrongLetter: "Yanlış harf",
  sideTitle: "Sahne kelimeleri",
  exit: "Kapat",
  doneTitle: "Sahne tamamlandı",
  doneBody: "Satırlarını kulaktan yazdın. Şimdi kelimeleri.",
  toWords: "Sahnenin kelimeleri",
  fromPassage: "Sahneyi tamamla",
  moveMeaning: "Anlamı ne?",
  moveLetters: "Harflerini sırala",
  moveType: "Ezberden yaz",
  fromScene: "Sahneden",
};

const BY_LOCALE: Record<SupportLocale, SceneStrings> = { ar: AR, es: ES, tr: TR };

export function sceneStrings(locale: SupportLocale | null | undefined): SceneStrings {
  return (locale && BY_LOCALE[locale]) || EN;
}

/**
 * The two explanations of the usual tasks that said something that is not so (permission todayTidy):
 * the story is not the passage the learner heard, and the words come only from the day's passage and
 * story.
 */
const TIDY: Record<"en" | SupportLocale, { story: string; words: string }> = {
  en: {
    story: "You type a short story sentence by sentence, hearing each one",
    words: "Words from today's passage and story",
  },
  ar: {
    story: "تكتب قصة قصيرة جملة جملة وأنت تسمعها",
    words: "كلمات من نص اليوم وقصة اليوم",
  },
  es: {
    story: "Escribes una historia corta frase a frase mientras la oyes",
    words: "Palabras del texto y de la historia de hoy",
  },
  tr: {
    story: "Kısa bir hikâyeyi cümle cümle, dinleyerek yazarsın",
    words: "Bugünün metninden ve hikâyesinden kelimeler",
  },
};

export function tidyWhy(locale: SupportLocale | null | undefined): {
  story: string;
  words: string;
} {
  return TIDY[locale ?? "en"] ?? TIDY.en;
}
