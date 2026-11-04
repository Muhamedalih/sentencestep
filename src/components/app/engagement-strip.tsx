"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronDown, Flame, RotateCcw, Snowflake } from "lucide-react";

import { QuestsCard } from "@/components/app/quests-card";
import { StreakStrip } from "@/components/app/streak-strip";
import { TodayGlow, TodayTasksPanel, todayTaskTitle } from "@/components/today/today-tasks";
import { useLocale } from "@/components/providers/locale-provider";
import type { StreakCalendarData } from "@/lib/features/calendar-actions";
import { questTitle } from "@/lib/features/quest-labels";
import { questProgressPercent } from "@/lib/features/quests";
import type { DailyQuestsPayload } from "@/lib/features/quests";
import { addDays } from "@/lib/features/streak-freeze";
import { todayTaskRepeatHref } from "@/lib/today/home-layout";
import { requiredQuests } from "@/lib/today/quests";
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
              kind === "none" &&
                (iso === today ? "border-primary/60 border-dashed" : "border-border"),
            )}
          />
        );
      })}
    </div>
  );
}

/**
 * The classic Home strip's small repeat button once the day is done: it opens a short menu of the
 * day's lessons, each one started again (todayTaskRepeatHref), so a learner who wants more picks one.
 */
function RepeatLessonMenu({ quests }: { quests: DailyQuestsPayload["quests"] }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const lessons = quests.filter((quest) => quest.today);
  if (lessons.length === 0) return null;

  return (
    <div ref={box} className="relative z-10">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={menuId}
        className="border-border hover:bg-muted focus-visible:ring-ring inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors outline-none focus-visible:ring-2"
      >
        <RotateCcw aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
        <span dir="auto">{t.quests.repeatPick}</span>
      </button>
      {open && (
        <ul
          id={menuId}
          className="border-border bg-popover absolute end-0 top-full z-20 mt-2 flex min-w-56 flex-col rounded-xl border p-1.5 shadow-lg"
        >
          {lessons.map((quest) => {
            const info = quest.today!;
            return (
              <li key={quest.slot}>
                <Link
                  href={todayTaskRepeatHref(info, quest.completed)}
                  className="hover:bg-muted focus-visible:bg-muted flex flex-col rounded-lg px-3 py-2 text-sm outline-none"
                >
                  <span className="font-medium" dir="auto">
                    {todayTaskTitle(t.today, info.kind)}
                  </span>
                  {info.title && (
                    <span className="text-muted-foreground truncate text-xs" dir="ltr">
                      {info.title}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * Home's one-line summary of the week streak and today's quests. It replaces the
 * two tall cards those used to be; the full cards open beneath it on demand, so
 * Home keeps the "up next" actions above the fold. The whole strip opens them (the
 * chevron button's `after` covers it), not just the chevron.
 */
export function EngagementStrip({
  today,
  quests,
  streak,
  quiet = false,
  cards = false,
  lead,
  trail,
  className,
}: {
  today: string;
  quests: DailyQuestsPayload | null;
  streak: StreakCalendarData | null;
  /** Folded and without the glow until tapped, for a learner who opens the daily tasks by choice. */
  quiet?: boolean;
  /** The Home cards permission: one slim line, the day's tasks first and the week at its end (no flame, the header has one). */
  cards?: boolean;
  /** The classic Home's merged strip, from xl up: the greeting at its start and the totals at its end (the header above is then hidden there). */
  lead?: ReactNode;
  trail?: ReactNode;
  className?: string;
}) {
  const { t, dir } = useLocale();
  // "Today's session (daily tasks)": the quests are Today's three tasks, tied to specific lessons. The
  // box then opens by itself while something is left, with a soft glow, so it is the first thing seen.
  const todayMode = Boolean(quests?.quests.some((quest) => quest.today));
  const [open, setOpen] = useState(!quiet && todayMode && quests?.allDone === false);
  const panelId = useId();

  if (!quests && !streak && !lead) return null;

  // The ring and "up next" are about the day's required quests: the sentence exam is an extra.
  const required = requiredQuests(quests?.quests ?? []);
  const done = required.filter((quest) => quest.completed).length;
  const total = required.length;
  const pendingQuests = required.filter((quest) => !quest.completed);
  // Today's tasks go in their order (listen, story, words), the random mix by how far along each is.
  const nextQuest = todayMode
    ? pendingQuests[0]
    : [...pendingQuests].sort((a, b) => questProgressPercent(b) - questProgressPercent(a))[0];
  const percent = total > 0 ? (done / total) * 100 : 0;
  const remaining = streak?.freezesRemaining ?? 0;

  return (
    <div className={className}>
      <div className="relative isolate">
        {!quiet && todayMode && quests?.allDone === false && <TodayGlow />}
        <div
          className={cn(
            "border-border bg-card hover:border-primary/40 relative flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border px-4 py-3 transition-colors",
            lead && "xl:flex-nowrap xl:gap-x-6 xl:px-5 xl:py-4",
            cards && "xl:flex-nowrap xl:gap-x-6 xl:py-2.5",
          )}
        >
          {lead && (
            <>
              <div className="hidden xl:block">{lead}</div>
              <span
                className="bg-border/70 hidden h-10 w-px shrink-0 xl:block"
                aria-hidden="true"
              />
            </>
          )}
          {streak && (
            <div className={cn("flex items-center gap-3", cards && "order-2 ms-auto")}>
              <Flame
                className={cn(
                  "size-5 shrink-0 text-orange-500 dark:text-orange-400",
                  cards && "hidden",
                )}
                aria-hidden="true"
              />
              <div className={cn("flex flex-col gap-1", cards && "flex-row items-center gap-2.5")}>
                <span className="text-muted-foreground text-xs leading-none" dir={dir}>
                  {t.streakCalendar.heading}
                </span>
                <WeekDots today={today} strip={streak} />
              </div>
              {remaining > 0 && (
                <span
                  className="text-muted-foreground relative z-10 flex items-center gap-1 text-xs"
                  title={t.streakCalendar.freezesLeft.replace("{n}", String(remaining))}
                >
                  <Snowflake className="size-3.5 text-sky-500" aria-hidden="true" />
                  <span dir="ltr">{remaining}</span>
                </span>
              )}
            </div>
          )}
          {streak && quests && (
            <span
              className={cn("bg-border/70 hidden h-8 w-px sm:block", cards && "sm:hidden")}
              aria-hidden="true"
            />
          )}
          {quests && (
            <div className={cn("flex min-w-44 flex-1 items-center gap-3", cards && "order-1")}>
              <span
                className={cn(
                  "relative flex size-10 shrink-0 items-center justify-center rounded-full",
                  cards && "size-9",
                )}
                style={{
                  background: `conic-gradient(var(--primary) ${percent}%, var(--border) 0)`,
                }}
                aria-hidden="true"
              >
                <span
                  className={cn(
                    "bg-card flex size-8 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums",
                    cards && "size-7 text-[10.5px]",
                  )}
                >
                  {quests.allDone ? (
                    <Check className="text-success size-4" />
                  ) : (
                    <span dir="ltr">
                      {done}/{total}
                    </span>
                  )}
                </span>
              </span>
              <div className={cn("min-w-0", cards && "flex min-w-0 items-center gap-3")}>
                <p className="text-muted-foreground shrink-0 text-xs leading-none" dir={dir}>
                  {t.quests.heading}
                </p>
                <p className={cn("mt-1 truncate text-sm font-medium", cards && "mt-0")} dir={dir}>
                  {quests.allDone || !nextQuest ? (
                    quiet ? (
                      t.quests.allDoneExplore
                    ) : (
                      t.quests.allDone
                    )
                  ) : nextQuest.today ? (
                    <>
                      {todayTaskTitle(t.today, nextQuest.today.kind)}
                      {nextQuest.today.title && (
                        <span className="text-muted-foreground ms-2 text-xs" dir="ltr">
                          {nextQuest.today.title}
                        </span>
                      )}
                    </>
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
          {quiet && todayMode && quests?.allDone && (
            <div className={cn("ms-auto", cards && "order-1 ms-0")}>
              <RepeatLessonMenu quests={quests.quests} />
            </div>
          )}
          {trail && <div className="hidden shrink-0 xl:block">{trail}</div>}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={t.quests.heading}
            className={cn(
              "text-muted-foreground hover:text-foreground hover:bg-muted ms-auto flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors after:absolute after:inset-0 after:rounded-2xl",
              cards && "order-3 ms-0",
            )}
          >
            <ChevronDown
              className={cn("size-5 transition-transform", open && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        </div>
        {open && (
          <div id={panelId} className="mt-3 flex flex-col gap-3">
            {todayMode && quests ? (
              <TodayTasksPanel payload={quests} />
            ) : (
              <QuestsCard payload={quests} />
            )}
            {/* The classic Home keeps the week in the strip's corner only, so the open tasks stay short. */}
            {!quiet && <StreakStrip today={today} strip={streak} />}
          </div>
        )}
      </div>
    </div>
  );
}
