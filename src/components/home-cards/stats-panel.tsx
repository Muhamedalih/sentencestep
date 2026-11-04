"use client";

import type { CSSProperties, ReactNode } from "react";
import { AlignLeft, BookOpen, CaseSensitive, SquarePlay } from "lucide-react";

import { useHeaderTotals } from "@/components/app/home-header-bar";
import type { LessonStatsMap } from "@/components/app/home-hero";
import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { learnerLevelSupportLabel } from "@/lib/progress/learner-level";

import { HOME_CARD_COLORS, STATS } from "./palette";
import { countFinishedStories, levelPercent } from "./stats";
import { fillText, homeCardsStrings } from "./strings";
import { useCountUp } from "./use-count-up";

type TileKey = keyof typeof STATS.tiles;

function Stat({
  tile,
  icon,
  value,
  label,
  ready,
}: {
  tile: TileKey;
  icon: ReactNode;
  value: number;
  label: string;
  ready: boolean;
}) {
  const { dir } = useLocale();
  const shown = useCountUp(value, ready);
  const colors = STATS.tiles[tile];
  return (
    <div className="group/stat flex items-center gap-3.5">
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-[11px] border transition-transform duration-[380ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/stat:scale-110 group-hover/stat:-rotate-3 motion-reduce:transition-none"
        style={{
          background: `linear-gradient(160deg,rgba(${colors.rgb},0.26),rgba(${colors.rgb},0.1))`,
          borderColor: `rgba(${colors.rgb},0.34)`,
          color: colors.ink,
        }}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-[3px]">
        <b dir="ltr" className="text-xl leading-none font-extrabold tabular-nums">
          {shown}
        </b>
        <span className="truncate text-[12.5px] leading-tight text-white/60" dir={dir}>
          {label}
        </span>
      </span>
    </div>
  );
}

/**
 * The achievements panel of the Home cards: the learner's level (its name and how far they are to
 * the next one) and four small counts, each with a tile in the hue of the section it counts: stories
 * finished, videos finished, sentences typed and words typed. It replaces the old words panel in the
 * first row. Every number is one the page already holds (the level comes from the learner's XP, the
 * stories from their finished lessons, the sentences and words from the lessons' own totals) except
 * the videos, which arrive from the server as `videosFinished`; a project that cannot give that
 * number (null) simply leaves the video tile out instead of saying 0.
 */
export function StatsPanel({
  lessonStats,
  sessionCount,
  videosFinished,
}: {
  lessonStats: LessonStatsMap;
  sessionCount: number | null;
  videosFinished: number | null;
}) {
  const { t, dir, locale } = useLocale();
  const s = homeCardsStrings(locale);
  const { isLoaded, completions, learnerLevel } = useSharedProgress();
  const totals = useHeaderTotals(lessonStats, sessionCount);
  const colors = HOME_CARD_COLORS.words;
  const stories = countFinishedStories(completions, lessonStats);
  const percent = levelPercent(learnerLevel.progress, learnerLevel.next !== null);
  const levelName = learnerLevelSupportLabel(learnerLevel.level.name, t);
  const nextName = learnerLevel.next ? learnerLevelSupportLabel(learnerLevel.next.name, t) : null;

  return (
    <section
      aria-label={s.statsLabel}
      className="hc-rise relative isolate flex min-h-[19.75rem] flex-col justify-between gap-3 overflow-hidden rounded-2xl border px-5 py-4 text-white xl:h-[19.75rem] xl:min-h-0"
      style={
        {
          background: colors.background,
          borderColor: colors.edge,
          "--hc-i": 2,
        } as CSSProperties
      }
    >
      <div>
        <p className="text-xs leading-none" style={{ color: colors.soft }} dir={dir}>
          {s.levelLabel}
        </p>
        <div className="mt-1.5 flex items-baseline justify-between gap-3">
          <b
            className="truncate text-[1.7rem] leading-tight font-extrabold tracking-tight"
            dir={dir}
          >
            {levelName}
          </b>
          <span className="shrink-0 text-xs" style={{ color: colors.accent }} dir={dir}>
            {nextName ? fillText(s.levelToNext, { n: percent, level: nextName }) : s.levelTop}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={s.levelLabel}
          className="mt-2.5 h-[5px] overflow-hidden rounded-[3px]"
          style={{ background: STATS.track }}
        >
          <i
            className="hc-fill bg-primary block h-full origin-left rounded-[3px]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <hr className="border-0 border-t" style={{ borderColor: STATS.hairline }} />

      <div className="flex flex-col gap-[9px]">
        <Stat
          tile="stories"
          icon={<BookOpen className="size-[19px]" strokeWidth={1.8} />}
          value={stories}
          label={s.storiesFinished}
          ready={isLoaded}
        />
        {videosFinished !== null && (
          <Stat
            tile="videos"
            icon={<SquarePlay className="size-5" strokeWidth={1.8} />}
            value={videosFinished}
            label={s.videosFinished}
            ready
          />
        )}
        <Stat
          tile="lines"
          icon={<AlignLeft className="size-[19px]" strokeWidth={1.9} />}
          value={totals.sentences}
          label={s.linesTyped}
          ready={isLoaded}
        />
        <Stat
          tile="words"
          icon={<CaseSensitive className="size-[22px]" strokeWidth={2} />}
          value={totals.words}
          label={s.wordsTyped}
          ready={isLoaded}
        />
      </div>
    </section>
  );
}
