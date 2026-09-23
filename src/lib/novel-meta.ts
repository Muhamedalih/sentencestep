import type { SupportLocale } from "@/lib/i18n/locales";

/**
 * Static, presentation-only metadata for the 6 curated Novels — a genre tag
 * (shown instead of the Beginner/Intermediate tier the nonfiction Book
 * catalog uses, which reads oddly on a classic novel), a real reading-time
 * estimate (computed once from the actual sentence content via the same
 * formula as estimateMinutes in lib/levels.ts, not fetched live), and a
 * short teaser line pulled verbatim from each novel's own retelling for the
 * Featured card. Hardcoded rather than a new DB column/table: exactly 6
 * known ids, changes only when new novels are curated by hand alongside
 * their content, and every string already has to be written and reviewed
 * directly regardless of where it lives.
 */

interface LocalizedText {
  en: string;
  ar: string;
  es: string;
  tr: string;
}

export interface NovelMeta {
  genre: LocalizedText;
  /** A real sentence from the novel's own retelling, chosen to read well standalone without spoiling the ending. */
  teaser: LocalizedText;
  /** Minutes at the app's own reading+typing pace (see estimateMinutes) — computed once from this novel's actual sentence content. */
  estimatedMinutes: number;
}

export const NOVEL_META: Record<string, NovelMeta> = {
  "book-novel-pride-prejudice": {
    genre: {
      en: "Classic romance",
      ar: "رومانسية كلاسيكية",
      es: "Romance clásico",
      tr: "Klasik romantizm",
    },
    teaser: {
      en: "He admired the warmth in her eyes even while telling himself he should not",
      ar: "أعجب بالدفء في عينيها حتى وهو يقنع نفسه بأنه لا ينبغي له ذلك",
      es: "Admiraba la calidez de sus ojos incluso mientras se decía que no debía hacerlo",
      tr: "Kendine bunu yapmaması gerektiğini söylerken bile gözlerindeki sıcaklığa hayran kalıyordu",
    },
    estimatedMinutes: 53,
  },
  "book-novel-great-gatsby": {
    genre: {
      en: "American classic",
      ar: "كلاسيكية أمريكية",
      es: "Clásico estadounidense",
      tr: "Amerikan klasiği",
    },
    teaser: {
      en: "His eyes seemed fixed on something far across the bay that only he could see",
      ar: "بدت عيناه ثابتتين على شيء بعيد عبر الخليج لا يراه سواه",
      es: "Sus ojos parecían fijos en algo lejano al otro lado de la bahía que solo él podía ver",
      tr: "Gözleri, yalnızca kendisinin görebildiği körfezin karşısındaki uzak bir şeye takılı kalmış gibiydi",
    },
    estimatedMinutes: 53,
  },
  "book-novel-little-prince": {
    genre: {
      en: "Philosophical fable",
      ar: "حكاية فلسفية",
      es: "Fábula filosófica",
      tr: "Felsefi masal",
    },
    teaser: {
      en: "The fox shared his secret that what is truly essential is invisible to the eye",
      ar: "شارك الثعلب سره وهو أن ما هو أساسي حقًا غير مرئي للعين",
      es: "El zorro compartió su secreto: lo verdaderamente esencial es invisible a los ojos",
      tr: "Tilki sırrını paylaştı: gerçekten önemli olan şey gözle görülemez",
    },
    estimatedMinutes: 55,
  },
  "book-novel-1984": {
    genre: {
      en: "Dystopian",
      ar: "ديستوبيا",
      es: "Distopía",
      tr: "Distopya",
    },
    teaser: {
      en: "Winston understood the disturbing party slogan that whoever controls the past controls the future",
      ar: "فهم وينستون الشعار المزعج للحزب بأن من يتحكم بالماضي يتحكم بالمستقبل",
      es: "Winston entendía el inquietante lema del Partido: quien controla el pasado controla el futuro",
      tr: "Winston, Parti'nin rahatsız edici sloganını anlıyordu: geçmişi kontrol eden geleceği kontrol eder",
    },
    estimatedMinutes: 53,
  },
  "book-novel-mockingbird": {
    genre: {
      en: "Coming-of-age classic",
      ar: "كلاسيكية نضج",
      es: "Clásico de iniciación",
      tr: "Büyüme hikayesi klasiği",
    },
    teaser: {
      en: "He reminded the jury softly that in a courtroom every man is truly equal",
      ar: "ذكّر هيئة المحلفين بلطف أن كل إنسان متساوٍ حقًا داخل قاعة المحكمة",
      es: "Recordó suavemente al jurado que dentro de un tribunal, todo hombre es verdaderamente igual",
      tr: "Jüriye, mahkeme salonunda her insanın gerçekten eşit olduğunu nazikçe hatırlattı",
    },
    estimatedMinutes: 53,
  },
  "book-novel-alchemist": {
    genre: {
      en: "Inspirational fable",
      ar: "حكاية ملهمة",
      es: "Fábula inspiradora",
      tr: "İlham verici masal",
    },
    teaser: {
      en: "Listening carefully to his own heart he explained was the truest form of real wisdom",
      ar: "أوضح أن الإصغاء بعناية لقلبك هو أصدق أشكال الحكمة الحقيقية",
      es: "Explicó que escuchar atentamente al propio corazón era la forma más verdadera de sabiduría real",
      tr: "Kendi kalbini dikkatle dinlemenin gerçek bilgeliğin en doğru biçimi olduğunu açıkladı",
    },
    estimatedMinutes: 54,
  },
};

/** Resolves a novel's metadata text for the current locale, English when no support locale is active — same fallback convention as tierLabel/tierSupportLabel. */
export function novelMetaText(text: LocalizedText, locale: SupportLocale | null): string {
  return locale ? text[locale] : text.en;
}
