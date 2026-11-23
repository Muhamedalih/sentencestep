/**
 * The words Word Drop shows, in the three languages the site offers (Arabic, Spanish, Turkish).
 * Kept in this folder so the game can ship without touching the shared dictionaries.
 */

import type { SupportLocale } from "@/lib/i18n/locales";

export interface WordDropStrings {
  navLabel: string;
  headline1: string;
  headline2: string;
  easy: string;
  easyHint: string;
  mid: string;
  midHint: string;
  hard: string;
  hardHint: string;
  hardUnavailable: string;
  source: string;
  start: string;
  exit: string;
  points: string;
  placeholder: string;
  switchKeyboard: string;
  roundEnd: string;
  accuracy: string;
  accuracyLine: string;
  wordsPerMinute: string;
  wordsTyped: string;
  bestCombo: string;
  /** "{n}" points above the previous best. */
  newBest: string;
  missedTitle: string;
  tapToSave: string;
  saved: string;
  noMisses: string;
  again: string;
  back: string;
  soundLabel: string;
}

const AR: WordDropStrings = {
  navLabel: "Word Drop",
  headline1: "اكتب الكلمة",
  headline2: "قبل ما تسقط",
  easy: "سهل",
  easyHint: "ترى الكلمة وتكتبها",
  mid: "متوسط",
  midHint: "ترى المعنى بالعربي وتكتب الإنجليزي",
  hard: "صعب",
  hardHint: "تسمع الكلمة فقط وتكتب ما سمعت",
  hardUnavailable: "غير متاح لهذا المستوى بعد",
  source: "الكلمات من قوائم مستواك · دقيقتان",
  start: "ابدأ الجولة",
  exit: "خروج",
  points: "نقطة",
  placeholder: "اكتب هنا",
  switchKeyboard: "بدّل الكيبورد إلى الإنجليزي",
  roundEnd: "انتهت الجولة",
  accuracy: "الدقة",
  accuracyLine: "حروف كتبتها صح من أول مرة",
  wordsPerMinute: "كلمة بالدقيقة",
  wordsTyped: "كلمة كتبتها",
  bestCombo: "أعلى كومبو",
  newBest: "أفضل من جولتك السابقة بـ {n} نقطة.",
  missedTitle: "كلمات فاتتك",
  tapToSave: "اضغط الكلمة لتضيفها إلى كلماتي",
  saved: "في كلماتي",
  noMisses: "ما فاتتك ولا كلمة.",
  again: "جولة أخرى",
  back: "العودة",
  soundLabel: "أعد الصوت",
};

const ES: WordDropStrings = {
  navLabel: "Word Drop",
  headline1: "Escribe la palabra",
  headline2: "antes de que caiga",
  easy: "Fácil",
  easyHint: "Ves la palabra y la escribes",
  mid: "Medio",
  midHint: "Ves el significado y escribes la palabra en inglés",
  hard: "Difícil",
  hardHint: "Solo oyes la palabra y escribes lo que oyes",
  hardUnavailable: "Aún no disponible para tu nivel",
  source: "Palabras de las listas de tu nivel · 2 minutos",
  start: "Empezar la ronda",
  exit: "Salir",
  points: "puntos",
  placeholder: "Escribe aquí",
  switchKeyboard: "Cambia el teclado a inglés",
  roundEnd: "Ronda terminada",
  accuracy: "Precisión",
  accuracyLine: "Letras escritas bien a la primera",
  wordsPerMinute: "palabras por minuto",
  wordsTyped: "palabras escritas",
  bestCombo: "Mejor combo",
  newBest: "{n} puntos más que tu ronda anterior.",
  missedTitle: "Palabras que fallaste",
  tapToSave: "Toca una palabra para guardarla en Mis palabras",
  saved: "En Mis palabras",
  noMisses: "No fallaste ninguna palabra.",
  again: "Otra ronda",
  back: "Volver",
  soundLabel: "Repetir el sonido",
};

const TR: WordDropStrings = {
  navLabel: "Word Drop",
  headline1: "Kelimeyi yaz",
  headline2: "düşmeden önce",
  easy: "Kolay",
  easyHint: "Kelimeyi görür ve yazarsın",
  mid: "Orta",
  midHint: "Anlamı görür, İngilizcesini yazarsın",
  hard: "Zor",
  hardHint: "Kelimeyi yalnızca duyar ve duyduğunu yazarsın",
  hardUnavailable: "Bu seviye için henüz yok",
  source: "Seviyenin kelime listelerinden · 2 dakika",
  start: "Turu başlat",
  exit: "Çık",
  points: "puan",
  placeholder: "Buraya yaz",
  switchKeyboard: "Klavyeyi İngilizceye çevir",
  roundEnd: "Tur bitti",
  accuracy: "Doğruluk",
  accuracyLine: "İlk seferde doğru yazdığın harfler",
  wordsPerMinute: "dakikada kelime",
  wordsTyped: "yazdığın kelime",
  bestCombo: "En yüksek kombo",
  newBest: "Önceki turundan {n} puan fazla.",
  missedTitle: "Kaçırdığın kelimeler",
  tapToSave: "Kelimelerime eklemek için kelimeye dokun",
  saved: "Kelimelerimde",
  noMisses: "Hiç kelime kaçırmadın.",
  again: "Bir tur daha",
  back: "Geri",
  soundLabel: "Sesi tekrar çal",
};

export function wordDropStrings(locale: SupportLocale | null): WordDropStrings {
  if (locale === "es") return ES;
  if (locale === "tr") return TR;
  return AR;
}
