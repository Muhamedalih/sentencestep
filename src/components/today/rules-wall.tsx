import Link from "next/link";

import type { Library } from "@/lib/daily-rule/library";
import { fill, ruleTextDir, type RuleStrings } from "@/lib/daily-rule/strings";
import type { SupportLocale } from "@/lib/i18n/locales";

/** The colours of the indigo box (permission rulesWall): the logo's ink family, one family for every theme. */
const INK = "#25276b";
const BRICK = "#3a3d8c";
const LIT = ["#eceeff", "#c9ccff", "#9aa0ff"] as const;

const BRICKS_PER_ROW = 10;
const BRICK_W = 24;
const BRICK_H = 18;
const GAP = 4;

/**
 * The «قواعدي» box (permission rulesWall): how many rules the learner has met, with a wall of bricks beside it
 * where every row is a level of the course (A1 at the bottom) and the bricks that are lit show how far that
 * level is, the review button, and the level the course is on. It reads only the library the page already built.
 */
export function RulesWall({
  library,
  locale,
  copy,
}: {
  library: Library;
  locale: SupportLocale | null;
  copy: RuleStrings;
}) {
  const total = library.levels.reduce((sum, level) => sum + level.total, 0);
  const rows = [...library.levels].reverse();
  const width = BRICKS_PER_ROW * (BRICK_W + GAP);
  const height = rows.length * (BRICK_H + GAP);
  return (
    <section
      className="mb-6 flex flex-col items-center justify-between gap-5 rounded-[18px] px-6 py-6 text-white sm:flex-row sm:gap-8 sm:px-8"
      style={{ backgroundColor: INK }}
      dir="ltr"
    >
      <div className="flex flex-col items-center sm:items-start" dir={ruleTextDir(locale)}>
        <div className="flex items-baseline gap-3">
          <span className="text-6xl leading-none font-medium sm:text-7xl" dir="ltr">
            {library.met}
          </span>
          <span className="text-[17px] text-[#dfe1ff]" dir="auto">
            {copy.wallLearned}
          </span>
        </div>
        {library.current && (
          <span
            className="mt-3 rounded-full bg-white/[0.12] px-3 py-1.5 text-[13px] text-[#dfe1ff]"
            dir="auto"
          >
            {fill(copy.wallProgress, { total, level: library.current.label })}
          </span>
        )}
      </div>

      {library.due.length > 0 && (
        <Link
          href="#due"
          className="flex items-center gap-2.5 rounded-xl px-5 py-3 text-[15px] font-medium"
          style={{ backgroundColor: LIT[0], color: INK }}
          dir="auto"
        >
          <span>{copy.wallReview}</span>
          <span
            className="rounded-full px-2 py-0.5 text-xs text-white"
            style={{ backgroundColor: INK }}
            dir="ltr"
          >
            {library.due.length}
          </span>
        </Link>
      )}

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="max-w-full shrink-0"
        role="img"
        aria-label={fill(copy.wallLabel, { met: library.met, total })}
      >
        {rows.map((level, row) => {
          const lit =
            level.met > 0
              ? Math.max(1, Math.round((level.met / Math.max(1, level.total)) * BRICKS_PER_ROW))
              : 0;
          const offset = row % 2 === 1 ? BRICK_W / 2 : 0;
          return Array.from({ length: BRICKS_PER_ROW - (offset ? 1 : 0) }, (_, index) => (
            <rect
              key={`${level.label}-${index}`}
              x={offset + index * (BRICK_W + GAP)}
              y={row * (BRICK_H + GAP)}
              width={BRICK_W}
              height={BRICK_H}
              rx={4}
              fill={index < lit ? LIT[(index + row) % LIT.length] : BRICK}
            />
          ));
        })}
      </svg>
    </section>
  );
}
