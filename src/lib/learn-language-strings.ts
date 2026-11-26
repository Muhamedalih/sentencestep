import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * The words the German launch adds around the learning-language chip (permission germanTrack, Admins
 * only for now): the «new» mark, the announcement strip on the English Home, and the locked Video
 * button German shows. Four languages, kept here like the other small feature strings.
 */
export interface LearnLanguageStrings {
  /** The small «new» word beside Deutsch in the chip's list. */
  newWord: string;
  /** The lines under each language in the chip's list. */
  englishNote: string;
  germanNote: string;
  /** The announcement strip on the English Home. */
  announceLead: string;
  announceBody: string;
  announceCta: string;
  announceClose: string;
  /** The locked Video button while German is chosen: the tag on it and the hint on hover. */
  videoLockedTag: string;
  videoLockedHint: string;
}

const ar: LearnLanguageStrings = {
  newWord: "جديد",
  englishNote: "الإنجليزية",
  germanNote: "الألمانية · قصص ونصوص ومفردات ودروس",
  announceLead: "جديد:",
  announceBody: "صار تقدر تتعلم الألمانية من نفس الحساب. تقدمك في كل لغة منفصل.",
  announceCta: "جرّب Deutsch",
  announceClose: "إغلاق",
  videoLockedTag: "قريبًا",
  videoLockedHint: "غير متاح بالألمانية بعد",
};

const en: LearnLanguageStrings = {
  newWord: "New",
  englishNote: "English",
  germanNote: "German · stories, passages, words and lessons",
  announceLead: "New:",
  announceBody: "You can now learn German from the same account. Your progress in each language is separate.",
  announceCta: "Try Deutsch",
  announceClose: "Close",
  videoLockedTag: "Soon",
  videoLockedHint: "Not available in German yet",
};

const es: LearnLanguageStrings = {
  newWord: "Nuevo",
  englishNote: "Inglés",
  germanNote: "Alemán · historias, textos, palabras y lecciones",
  announceLead: "Nuevo:",
  announceBody: "Ya puedes aprender alemán desde la misma cuenta. Tu progreso en cada idioma es aparte.",
  announceCta: "Probar Deutsch",
  announceClose: "Cerrar",
  videoLockedTag: "Pronto",
  videoLockedHint: "Aún no disponible en alemán",
};

const tr: LearnLanguageStrings = {
  newWord: "Yeni",
  englishNote: "İngilizce",
  germanNote: "Almanca · hikâyeler, metinler, kelimeler ve dersler",
  announceLead: "Yeni:",
  announceBody: "Artık aynı hesaptan Almanca öğrenebilirsin. Her dildeki ilerlemen ayrıdır.",
  announceCta: "Deutsch'u dene",
  announceClose: "Kapat",
  videoLockedTag: "Yakında",
  videoLockedHint: "Almancada henüz yok",
};

const BY_LOCALE: Record<SupportLocale, LearnLanguageStrings> = { ar, es, tr };

/** The strings for a support language; English is the fallback for a visitor with none chosen. */
export function learnLanguageStrings(
  locale: SupportLocale | null | undefined,
): LearnLanguageStrings {
  return locale ? BY_LOCALE[locale] : en;
}
