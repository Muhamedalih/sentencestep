/**
 * Series (permission passageSeries): passages that follow one another with the same people, each
 * ending on a question the next episode answers. Which passage is which episode lives here, with the
 * few words the screens say about it. Pure: nothing here reads or writes anything.
 */

import type { SupportLocale } from "@/lib/i18n/locales";
import type { PassageProgress } from "@/lib/passages/types";

type Said = Record<"en" | SupportLocale, string>;

export interface PassageSeries {
  id: string;
  title: Said;
  /** How many episodes the season has, written or not. */
  total: number;
  /** The characters who are women; everyone else, and the narrator, is a man. */
  women: readonly string[];
  /** The written episodes, in order. */
  episodes: { passageId: string; next: Said }[];
}

export const PASSAGE_SERIES: readonly PassageSeries[] = [
  {
    id: "red-book",
    title: { en: "The Red Book", ar: "الكتاب الأحمر", es: "El libro rojo", tr: "Kırmızı Kitap" },
    total: 7,
    women: ["Sara", "Mom"],
    episodes: [
      {
        passageId: "open-on-your-first-day",
        next: {
          en: "Who wrote to Sara twenty years ago?",
          ar: "من كتب لسارة قبل عشرين عاماً؟",
          es: "¿Quién le escribió a Sara hace veinte años?",
          tr: "Yirmi yıl önce Sara'ya kim yazdı?",
        },
      },
      {
        passageId: "a-letter-from-nora",
        next: {
          en: "What is inside the old clock?",
          ar: "ماذا يوجد داخل الساعة القديمة؟",
          es: "¿Qué hay dentro del viejo reloj?",
          tr: "Eski saatin içinde ne var?",
        },
      },
      {
        passageId: "ten-past-four",
        next: {
          en: "Why is Mom afraid of the small key?",
          ar: "لماذا تخاف الأم من المفتاح الصغير؟",
          es: "¿Por qué mamá le tiene miedo a la llave pequeña?",
          tr: "Annesi küçük anahtardan neden korkuyor?",
        },
      },
      {
        passageId: "the-rose-under-the-floor",
        next: {
          en: "What is under the white rose?",
          ar: "ماذا يوجد تحت الوردة البيضاء؟",
          es: "¿Qué hay debajo de la rosa blanca?",
          tr: "Beyaz gülün altında ne var?",
        },
      },
      {
        passageId: "twenty-birthdays",
        next: {
          en: "Why does the quiet reader want the shop?",
          ar: "لماذا يريد القارئ الصامت المحل؟",
          es: "¿Por qué el lector callado quiere la tienda?",
          tr: "Sessiz okur dükkânı neden istiyor?",
        },
      },
      {
        passageId: "the-man-in-the-grey-hat",
        next: {
          en: "What did Nora write to her daughter?",
          ar: "ماذا كتبت نورا لابنتها؟",
          es: "¿Qué le escribió Nora a su hija?",
          tr: "Nora kızına ne yazdı?",
        },
      },
      {
        passageId: "eleven-past-four",
        next: {
          en: "The Red Book is closed. Thank you for reading.",
          ar: "انتهت حكاية «الكتاب الأحمر». شكراً لأنك قرأتها.",
          es: "El libro rojo se cierra. Gracias por leer.",
          tr: "Kırmızı Kitap kapandı. Okuduğun için teşekkürler.",
        },
      },
    ],
  },
];

/** The written episodes of every series, in order. */
export const SERIES_PASSAGE_IDS: readonly string[] = PASSAGE_SERIES.flatMap((series) =>
  series.episodes.map((episode) => episode.passageId),
);

/** Whose voice a line of a series episode is, or null when the passage is in no series. */
export function seriesLineGender(
  passageId: string,
  speaker: string | null,
): "female" | "male" | null {
  const series = PASSAGE_SERIES.find((entry) =>
    entry.episodes.some((episode) => episode.passageId === passageId),
  );
  if (!series) return null;
  return speaker && series.women.includes(speaker) ? "female" : "male";
}

export interface EpisodeInfo {
  seriesTitle: string;
  number: number;
  total: number;
  /** The question the next episode answers. */
  next: string;
}

/** What a passage is in a series, in the learner's support language, or null when it is in none. */
export function episodeOf(
  passageId: string,
  locale: SupportLocale | null | undefined,
): EpisodeInfo | null {
  for (const series of PASSAGE_SERIES) {
    const index = series.episodes.findIndex((episode) => episode.passageId === passageId);
    if (index < 0) continue;
    return {
      seriesTitle: series.title[locale ?? "en"],
      number: index + 1,
      total: series.total,
      next: series.episodes[index]!.next[locale ?? "en"],
    };
  }
  return null;
}

/**
 * The episode today's scene is made of: the one finished latest today (so its lines and words stay the
 * day's), else the first one not finished yet. Null once every written episode was finished earlier:
 * the day is then built from the usual passages.
 */
export function seriesDayEpisode(args: {
  episodes: readonly string[];
  progress: readonly Pick<PassageProgress, "passageId" | "completedAt">[];
  todayISO: string;
  dayOf: (iso: string) => string;
}): string | null {
  const done = new Map(
    args.progress.flatMap((entry) =>
      entry.completedAt ? [[entry.passageId, entry.completedAt] as const] : [],
    ),
  );
  const today = args.episodes
    .filter((id) => done.has(id) && args.dayOf(done.get(id)!) === args.todayISO)
    .sort((a, b) => done.get(b)!.localeCompare(done.get(a)!))[0];
  return today ?? args.episodes.find((id) => !done.has(id)) ?? null;
}

const LABELS: Record<
  "en" | SupportLocale,
  { episode: (n: number, total: number) => string; next: string; end: string; series: string }
> = {
  en: {
    episode: (n, total) => `Episode ${n} of ${total}`,
    next: "Next episode",
    end: "The end",
    series: "Series",
  },
  ar: {
    episode: (n, total) => `الحلقة ${n} من ${total}`,
    next: "في الحلقة القادمة",
    end: "النهاية",
    series: "مسلسل",
  },
  es: {
    episode: (n, total) => `Episodio ${n} de ${total}`,
    next: "En el próximo episodio",
    end: "Fin",
    series: "Serie",
  },
  tr: {
    episode: (n, total) => `Bölüm ${n}/${total}`,
    next: "Gelecek bölümde",
    end: "Son",
    series: "Dizi",
  },
};

export function seriesLabels(locale: SupportLocale | null | undefined) {
  return LABELS[locale ?? "en"];
}
