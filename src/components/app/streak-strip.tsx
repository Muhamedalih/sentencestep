"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Flame, Snowflake } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { fetchStreakCalendarAction } from "@/lib/features/calendar-actions";
import type { StreakCalendarData } from "@/lib/features/calendar-actions";
import { addDays, monthPeriod } from "@/lib/features/streak-freeze";
import { todayLocalISODate } from "@/lib/progress/streak";
import { cn } from "@/lib/utils";

type DayKind = "active" | "grace" | "frozen" | "none";

function firstOfMonth(iso: string): string {
  return `${monthPeriod(iso)}-01`;
}

function lastOfMonth(iso: string): string {
  const [year, month] = iso.split("-").map(Number);
  const last = new Date(year ?? 1970, month ?? 1, 0).getDate();
  return `${monthPeriod(iso)}-${String(last).padStart(2, "0")}`;
}

function shiftMonth(iso: string, delta: number): string {
  const [year, month] = iso.split("-").map(Number);
  const date = new Date(year ?? 1970, (month ?? 1) - 1 + delta, 1);
  return todayLocalISODate(date);
}

/** Arabic calendars conventionally start the week on Saturday; Spanish and Turkish on Monday. */
function weekStartsOn(locale: string | null): number {
  return locale === "ar" ? 6 : 1;
}

function DayDot({
  kind,
  isToday,
  label,
  size = "md",
}: {
  kind: DayKind;
  isToday: boolean;
  label: string;
  size?: "md" | "sm";
}) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        size === "md" ? "size-9" : "size-8",
        kind === "active" && "border-primary bg-primary text-primary-foreground",
        kind === "frozen" && "border-sky-400 bg-sky-400/15 text-sky-500",
        kind === "grace" && "border-primary/50 text-primary/70 bg-transparent",
        kind === "none" && "border-border/70 text-transparent",
        isToday && kind === "none" && "border-primary/60 border-dashed",
      )}
    >
      {kind === "frozen" ? (
        <Snowflake className="size-4" aria-hidden="true" />
      ) : kind === "none" ? null : (
        <Check className="size-4" aria-hidden="true" />
      )}
    </span>
  );
}

/**
 * Presentational half of the streak strip: everything it draws comes in as
 * props (so it can be exercised with fake data), and it owns no fetching.
 */
export function StreakStripView({
  today,
  strip,
  month,
  expanded,
  monthCursor,
  onToggleExpanded,
  onMonthChange,
  className,
}: {
  today: string;
  /** undefined = loading, null = unavailable. */
  strip: StreakCalendarData | null | undefined;
  month: StreakCalendarData | null | undefined;
  expanded: boolean;
  /** First day (YYYY-MM-01) of the month the grid shows. */
  monthCursor: string;
  onToggleExpanded: () => void;
  onMonthChange: (delta: number) => void;
  className?: string;
}) {
  const { t, locale, dir } = useLocale();
  const intlLocale = locale ?? "en";

  const dayLabel = useMemo(
    () => new Intl.DateTimeFormat(intlLocale, { weekday: "short", month: "short", day: "numeric" }),
    [intlLocale],
  );
  const weekdayNarrow = useMemo(
    () => new Intl.DateTimeFormat(intlLocale, { weekday: "narrow" }),
    [intlLocale],
  );

  if (strip === null) return null;
  function kindOf(data: StreakCalendarData | null | undefined, iso: string): DayKind {
    return data?.days.find((day) => day.day === iso)?.kind ?? "none";
  }

  function statusText(kind: DayKind): string {
    switch (kind) {
      case "active":
        return t.streakCalendar.dayPracticed;
      case "frozen":
        return t.streakCalendar.dayFrozen;
      case "grace":
        return t.streakCalendar.dayGrace;
      default:
        return t.streakCalendar.dayMissed;
    }
  }

  function describe(iso: string, kind: DayKind): string {
    const [year, monthNumber, dayNumber] = iso.split("-").map(Number);
    const date = new Date(year ?? 1970, (monthNumber ?? 1) - 1, dayNumber ?? 1);
    return `${dayLabel.format(date)}: ${statusText(kind)}`;
  }

  const weekDays = Array.from({ length: 7 }, (_unused, index) => addDays(today, index - 6));
  const remaining = strip?.freezesRemaining ?? 0;
  const freezeText =
    remaining === 0
      ? t.streakCalendar.noFreezes
      : remaining === 1
        ? t.streakCalendar.freezesLeftOne
        : t.streakCalendar.freezesLeft.replace("{n}", String(remaining));

  // Month grid: leading blanks so the 1st lands on the right weekday column.
  const monthStart = firstOfMonth(monthCursor);
  const [startYear, startMonth] = monthStart.split("-").map(Number);
  const firstWeekday = new Date(startYear ?? 1970, (startMonth ?? 1) - 1, 1).getDay();
  const leadingBlanks = (firstWeekday - weekStartsOn(locale) + 7) % 7;
  const monthEnd = lastOfMonth(monthCursor);
  const monthDays: string[] = [];
  for (let iso = monthStart; iso <= monthEnd; iso = addDays(iso, 1)) monthDays.push(iso);
  const weekHeader = Array.from({ length: 7 }, (_unused, index) => {
    const weekday = (weekStartsOn(locale) + index) % 7;
    // 2024-01-07 is a Sunday; offset from it to land on the wanted weekday.
    return weekdayNarrow.format(new Date(2024, 0, 7 + weekday));
  });
  const isCurrentMonth = monthCursor === firstOfMonth(today);
  const monthTitle = new Intl.DateTimeFormat(intlLocale, { month: "long", year: "numeric" }).format(
    new Date(startYear ?? 1970, (startMonth ?? 1) - 1, 1),
  );

  return (
    <section
      aria-label={t.streakCalendar.heading}
      className={cn("border-border/60 bg-card/60 rounded-2xl border p-4 sm:p-5", className)}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Flame className="text-accent size-4" aria-hidden="true" />
          <span dir={dir}>{t.streakCalendar.heading}</span>
        </h2>
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
          className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
        >
          {expanded ? t.streakCalendar.hideMonth : t.streakCalendar.showMonth}
        </button>
      </div>

      <div className="flex items-start justify-between gap-1" dir="ltr">
        {weekDays.map((iso) => {
          const kind = kindOf(strip, iso);
          const [year, monthNumber, dayNumber] = iso.split("-").map(Number);
          const date = new Date(year ?? 1970, (monthNumber ?? 1) - 1, dayNumber ?? 1);
          return (
            <div key={iso} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="text-muted-foreground text-[11px] font-medium">
                {weekdayNarrow.format(date)}
              </span>
              {strip === undefined ? (
                <span className="bg-muted size-9 animate-pulse rounded-full" aria-hidden="true" />
              ) : (
                <DayDot kind={kind} isToday={iso === today} label={describe(iso, kind)} />
              )}
            </div>
          );
        })}
      </div>

      {strip && (
        <p className="text-muted-foreground mt-3 flex items-center gap-1.5 text-xs">
          <Snowflake className="size-3.5 text-sky-500" aria-hidden="true" />
          <span dir={dir}>{freezeText}</span>
        </p>
      )}

      {expanded && (
        <div className="border-border/60 mt-4 border-t pt-4">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onMonthChange(-1)}
              aria-label={t.streakCalendar.previousMonth}
              className="hover:bg-muted flex size-8 items-center justify-center rounded-full"
            >
              <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
            </button>
            <span className="text-sm font-semibold">{monthTitle}</span>
            <button
              type="button"
              onClick={() => onMonthChange(1)}
              disabled={isCurrentMonth}
              aria-label={t.streakCalendar.nextMonth}
              className="hover:bg-muted flex size-8 items-center justify-center rounded-full disabled:opacity-30"
            >
              <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </button>
          </div>
          {month === null ? (
            <p className="text-muted-foreground text-sm" dir={dir}>
              {t.streakCalendar.loadError}
            </p>
          ) : (
            <div className="grid grid-cols-7 gap-y-2" dir="ltr">
              {weekHeader.map((label, index) => (
                <span
                  key={index}
                  className="text-muted-foreground text-center text-[11px] font-medium"
                >
                  {label}
                </span>
              ))}
              {Array.from({ length: leadingBlanks }, (_unused, index) => (
                <span key={`blank-${index}`} />
              ))}
              {monthDays.map((iso) => {
                const kind = kindOf(month, iso);
                const future = iso > today;
                return (
                  <div key={iso} className="flex justify-center">
                    {month === undefined || future ? (
                      <span
                        className={cn(
                          "size-8 rounded-full border-2 border-transparent",
                          month === undefined && "bg-muted animate-pulse",
                        )}
                        aria-hidden="true"
                      />
                    ) : (
                      <DayDot
                        kind={kind}
                        isToday={iso === today}
                        label={describe(iso, kind)}
                        size="sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div
            dir={dir}
            className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
          >
            <span className="flex items-center gap-1.5">
              <span className="bg-primary size-2.5 rounded-full" />
              {t.streakCalendar.legendActive}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="border-primary/50 size-2.5 rounded-full border-2" />
              {t.streakCalendar.legendGrace}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full border-2 border-sky-400 bg-sky-400/15" />
              {t.streakCalendar.legendFrozen}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * The Home page's 7-day streak strip (admin feature "Streak calendar &
 * freeze"): each of the last seven days as a dot — practiced, forgiven, or
 * covered by a freeze — with the month's remaining freezes underneath, and a
 * tap-to-expand month grid. The strip's own data is loaded with the page (see
 * loadHomeEngagement) — null when the feature isn't open to this visitor or
 * it couldn't be loaded, in which case nothing renders; only the month grid
 * fetches, and only once the learner expands it.
 */
export function StreakStrip({
  today,
  strip,
  className,
}: {
  /** The learner's local date the strip was loaded for. */
  today: string;
  strip: StreakCalendarData | null;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [monthCursor, setMonthCursor] = useState(() => firstOfMonth(today));
  const [month, setMonth] = useState<StreakCalendarData | null | undefined>(undefined);

  const loadMonth = useCallback(
    (cursor: string) => {
      setMonth(undefined);
      fetchStreakCalendarAction(firstOfMonth(cursor), lastOfMonth(cursor), today)
        .then((data) => setMonth(data))
        .catch(() => setMonth(null));
    },
    [today],
  );

  useEffect(() => {
    if (expanded) loadMonth(monthCursor);
  }, [expanded, monthCursor, loadMonth]);

  if (strip === null) return null;

  return (
    <StreakStripView
      today={today}
      strip={strip}
      month={month}
      expanded={expanded}
      monthCursor={monthCursor}
      onToggleExpanded={() => setExpanded((open) => !open)}
      onMonthChange={(delta) => setMonthCursor((cursor) => shiftMonth(cursor, delta))}
      className={className}
    />
  );
}
