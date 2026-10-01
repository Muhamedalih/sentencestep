"use client";

import { useId, useState } from "react";
import { Check, ChevronDown, Flame, Snowflake } from "lucide-react";

import { QuestsCard } from "@/components/app/quests-card";
import { StreakStrip } from "@/components/app/streak-strip";
import { useLocale } from "@/components/providers/locale-provider";
import type { StreakCalendarData } from "@/lib/features/calendar-actions";
import { questTitle } from "@/lib/features/quest-labels";
import { questProgressPercent } from "@/lib/features/quests";
import type { DailyQuestsPayload } from "@/lib/features/quests";
import { addDays } from "@/lib/features/streak-freeze";
import { cn } from "@/lib/utils";

function WeekDots({ today, strip }: { today: string; strip: StreakCalendarData }) {
  const days = Array.from({ length: 7 }, (_unused, index) => addDays(today, index - 6));
  return (
    <div className="flex items-center gap-1.5" dir="ltr" aria-hidden="true">
      {days.map((iso) => {
        const kind = strip.days.find((day) => day.day === iso)?.kind ?? "none";
        return (
          <span
            key={iso}
            className={cn(
              "size-3.5 rounded-full border-2",
              kind === "active" && "border-primary bg-primary",
              kind === "grace" && "border-primary/50",
              kind === "frozen" && "border-sky-400 bg-sky-400/15",
              kind === "none" && (iso === today ? "border-primary/60 border-dashed" : "border-border"),
            )}
          />
        );
      })}
    </div>
  );
}

/**
 * Home's one-line summary of the week streak and today's quests. It replaces the
 * two tall cards those used to be; the full cards open beneath it on demand, so
 * Home keeps the "up next" actions above the fold.
 */
export function EngagementStrip({
  today,
  quests,
  streak,
  className,
}: {
  today: string;
  quests: DailyQuestsPayload | null;
  streak: StreakCalendarData | null;
  className?: string;
}) {
  const { t, dir } = useLocale();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (!quests && !streak) return null;

  const done = quests?.quests.filter((quest) => quest.completed).length ?? 0;
  const total = quests?.quests.length ?? 0;
  const nextQuest = quests?.quests
    .filter((quest) => !quest.completed)
    .sort((a, b) => questProgressPercent(b) - questProgressPercent(a))[0];
  const percent = total > 0 ? (done / total) * 100 : 0;
  const remaining = streak?.freezesRemaining ?? 0;

  return (
    <div className={className}>
      <div className="border-border/60 bg-card/60 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border px-4 py-3">
        {streak && (
          <div className="flex items-center gap-3">
            <Flame className="text-accent size-5 shrink-0" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-[11px] leading-none" dir={dir}>
                {t.streakCalendar.heading}
              </span>
              <WeekDots today={today} strip={streak} />
            </div>
            {remaining > 0 && (
              <span
                className="text-muted-foreground flex items-center gap-1 text-xs"
                title={t.streakCalendar.freezesLeft.replace("{n}", String(remaining))}
              >
                <Snowflake className="size-3.5 text-sky-500" aria-hidden="true" />
                <span dir="ltr">{remaining}</span>
              </span>
            )}
          </div>
        )}
        {streak && quests && <span className="bg-border/70 hidden h-8 w-px sm:block" aria-hidden="true" />}
        {quests && (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span
              className="relative flex size-10 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(var(--primary) ${percent}%, var(--border) 0)`,
              }}
              aria-hidden="true"
            >
              <span className="bg-card flex size-8 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums">
                {quests.allDone ? (
                  <Check className="text-success size-4" />
                ) : (
                  <span dir="ltr">
                    {done}/{total}
                  </span>
                )}
              </span>
            </span>
            <div className="min-w-0">
              <p className="text-muted-foreground text-[11px] leading-none" dir={dir}>
                {t.quests.heading}
              </p>
              <p className="mt-1 truncate text-sm font-medium" dir={dir}>
                {quests.allDone || !nextQuest ? (
                  t.quests.allDone
                ) : (
                  <>
                    {questTitle(t, nextQuest.type)}
                    <span className="text-muted-foreground ms-2 text-xs tabular-nums" dir="ltr">
                      {nextQuest.progress} / {nextQuest.target}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={t.quests.heading}
          className="text-muted-foreground hover:text-foreground hover:bg-muted ms-auto flex size-9 shrink-0 items-center justify-center rounded-full transition-colors"
        >
          <ChevronDown
            className={cn("size-5 transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
        </button>
      </div>
      {open && (
        <div id={panelId} className="mt-3 flex flex-col gap-3">
          <QuestsCard payload={quests} />
          <StreakStrip today={today} strip={streak} />
        </div>
      )}
    </div>
  );
}
