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
  /** The written episodes, in order. */
  episodes: { passageId: string; next: Said }[];
}

export const PASSAGE_SERIES: readonly PassageSeries[] = [
  {
    id: "red-book",
    title: { en: "The Red Book", ar: "الكتاب الأحمر", es: "El libro rojo", tr: "Kırmızı Kitap" },
    total: 7,
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
    ],
  },
];

/** The written episodes of every series, in order. */
export const SERIES_PASSAGE_IDS: readonly string[] = PASSAGE_SERIES.flatMap((series) =>
  series.episodes.map((episode) => episode.passageId),
);

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
  { episode: (n: number, total: number) => string; next: string; series: string }
> = {
  en: { episode: (n, total) => `Episode ${n} of ${total}`, next: "Next episode", series: "Series" },
  ar: {
    episode: (n, total) => `الحلقة ${n} من ${total}`,
    next: "في الحلقة القادمة",
    series: "مسلسل",
  },
  es: {
    episode: (n, total) => `Episodio ${n} de ${total}`,
    next: "En el próximo episodio",
    series: "Serie",
  },
  tr: { episode: (n, total) => `Bölüm ${n}/${total}`, next: "Gelecek bölümde", series: "Dizi" },
};

export function seriesLabels(locale: SupportLocale | null | undefined) {
  return LABELS[locale ?? "en"];
}
