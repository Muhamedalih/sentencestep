"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Headphones, LayoutList, PenLine, RotateCcw, Type } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import type { TodayData, TodayStepData } from "@/lib/today/load";
import type { StepKind } from "@/lib/today/plan";
import { cn } from "@/lib/utils";

/** The accuracy that earns the story's star. */
const STAR_ACCURACY = 0.9;

const BUTTON =
  "inline-flex h-12 items-center justify-center gap-2 rounded-[10px] px-6 text-[15px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:h-14 lg:text-base";
const BUTTON_PRIMARY = `${BUTTON} bg-primary text-primary-foreground hover:opacity-90`;
const BUTTON_OUTLINE = `${BUTTON} border-border text-foreground hover:bg-muted border`;
const CHIP_LEVEL =
  "border-success/40 bg-success/10 text-success rounded-full border px-2 py-px text-[11px] font-semibold";

const ICONS = { listen: Headphones, story: PenLine, words: Type } as const;

function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );
}

/**
 * The step's icon. The current step's moves, gently and slowly: the headphones float with two soft
 * sound rings, the pen writes, the letters breathe. Nothing moves for a learner who asked for
 * reduced motion, and a step that is done or still waiting stays still.
 */
function StepIcon({ kind, active }: { kind: StepKind; active: boolean }) {
  const reduced = useReducedMotion();
  const moving = active && !reduced;
  const Icon = ICONS[kind];
  const kindMotion =
    kind === "listen"
      ? { y: [0, -2, 0] }
      : kind === "story"
        ? { x: [0, 2.5, 0, 2.5, 0], rotate: [0, -6, 0, -6, 0] }
        : { scale: [1, 1.12, 1] };
  return (
    <span className="relative grid size-10 place-items-center" aria-hidden="true">
      {moving &&
        kind === "listen" &&
        [0, 1.2].map((delay) => (
          <motion.span
            key={delay}
            className="border-primary/40 absolute inset-1 rounded-full border"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay }}
          />
        ))}
      <motion.span
        className="grid place-items-center"
        animate={moving ? kindMotion : undefined}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon className="size-5" strokeWidth={1.8} />
      </motion.span>
    </span>
  );
}

/** A soft brand glow breathing behind the card while there is something to do: the one thing on the page that draws the eye. */
function Glow() {
  const reduced = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      className="bg-primary/25 pointer-events-none absolute -inset-2 -z-10 rounded-[2rem] blur-2xl"
      initial={{ opacity: 0.35 }}
      animate={reduced ? { opacity: 0.35 } : { opacity: [0.3, 0.65, 0.3] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/** Today's tasks done out of all, as a ring — the same ring the daily quests had. */
function Ring({ done, total }: { done: number; total: number }) {
  const percent = total > 0 ? (done / total) * 100 : 0;
  return (
    <span
      className="grid size-14 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(var(--primary) ${percent}%, var(--border) 0)` }}
      aria-hidden="true"
    >
      <span
        className="bg-card grid size-11 place-items-center rounded-full text-sm font-semibold tabular-nums"
        dir="ltr"
      >
        {done}/{total}
      </span>
    </span>
  );
}

function TaskRow({ step, current }: { step: TodayStepData; current: boolean }) {
  const { t } = useLocale();
  const copy = t.today;
  const label = { listen: copy.taskListen, story: copy.taskStory, words: copy.taskWords }[
    step.kind
  ];
  const Icon = ICONS[step.kind];
  const parts: string[] = [];
  if (step.kind === "story" && step.done && step.accuracy !== null) {
    parts.push(
      fill(step.accuracy >= STAR_ACCURACY ? copy.starEarned : copy.accuracyIs, {
        n: Math.round(step.accuracy * 100),
      }),
    );
  } else if (!step.done) {
    parts.push(fill(copy.minutes, { n: step.minutes }));
    if (step.quest && step.quest.progress > 0) {
      parts.push(`${step.quest.progress}/${step.quest.target}`);
    }
    if (step.kind === "story") parts.push(copy.starHint);
  }
  return (
    <li
      aria-current={current ? "step" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors",
        step.done
          ? "border-success/40 bg-success/10"
          : current
            ? "border-primary/50 bg-brand-muted"
            : "border-border bg-card/60",
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center",
          step.done ? "text-success" : current ? "text-primary" : "text-muted-foreground",
        )}
        aria-hidden="true"
      >
        {step.done ? (
          <Check className="size-5" strokeWidth={2} />
        ) : current ? (
          <StepIcon kind={step.kind} active />
        ) : (
          <Icon className="size-5" strokeWidth={1.8} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-[14.5px] font-semibold", step.done && "text-success")}>
          <span dir="auto">{label}</span>
        </p>
        {parts.length > 0 && (
          <p className="text-muted-foreground mt-0.5 text-[12.5px]">
            <span dir="auto">{parts.join(" · ")}</span>
          </p>
        )}
      </div>
      {step.quest && step.quest.xp > 0 && (
        <span
          className={cn(
            "shrink-0 text-xs font-semibold",
            step.done ? "text-success" : "text-primary",
          )}
          dir="ltr"
        >
          {fill(copy.xpChip, { xp: step.quest.xp })}
        </span>
      )}
    </li>
  );
}

/** The day's tasks: the ring, what finishing them is worth, and the three rows. */
function TasksPanel({ data }: { data: TodayData }) {
  const { t } = useLocale();
  const copy = t.today;
  const done = data.steps.filter((step) => step.done).length;
  return (
    <div className="border-border/70 bg-background/40 rounded-2xl border p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3.5">
        <Ring done={done} total={data.steps.length} />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold">
            <span dir="auto">{copy.questsHeading}</span>
          </p>
          {data.totalXp > 0 && (
            <p
              className={cn(
                "mt-0.5 text-[12.5px]",
                data.allDone ? "text-success" : "text-muted-foreground",
              )}
            >
              <span dir="auto">
                {data.allDone
                  ? fill(copy.rewardEarned, { xp: data.earnedXp })
                  : fill(copy.rewardAll, { xp: data.totalXp })}
              </span>
            </p>
          )}
        </div>
      </div>
      <ol className="flex flex-col gap-2">
        {data.steps.map((step) => (
          <TaskRow key={step.kind} step={step} current={step.kind === data.current} />
        ))}
      </ol>
    </div>
  );
}

function ChooseYourself({ className }: { className?: string }) {
  const { t } = useLocale();
  return (
    <Link href="/learn?classic=1" className={cn(BUTTON_OUTLINE, "relative z-10", className)}>
      <LayoutList aria-hidden="true" className="size-4" strokeWidth={1.8} />
      <span dir="auto">{t.today.chooseYourself}</span>
    </Link>
  );
}

/** What the learner is on: which step, its title, why, and the one big button — which, stretched over the whole card, makes the card itself the button. */
function StepDetails({ data, step }: { data: TodayData; step: TodayStepData }) {
  const { t } = useLocale();
  const copy = t.today;
  const index = data.steps.findIndex((entry) => entry.kind === step.kind) + 1;
  const title = step.kind === "words" ? copy.titleWords : step.title;
  const why = { listen: copy.whyListen, story: copy.whyStory, words: copy.whyWords }[step.kind];
  const start = { listen: copy.startListen, story: copy.startStory, words: copy.startWords }[
    step.kind
  ];
  return (
    <div className="flex flex-col justify-center">
      <p className="text-muted-foreground text-[12.5px] font-semibold">
        <span dir="auto">{fill(copy.stepOf, { n: index, total: data.steps.length })}</span>
      </p>
      <h2 className="mt-2 text-[26px] leading-tight font-semibold tracking-[-0.01em] lg:text-[32px]">
        <span dir={step.kind === "words" ? "auto" : "ltr"} style={{ unicodeBidi: "isolate" }}>
          {title}
        </span>
      </h2>
      {(step.supportTitle || step.levelCode) && (
        <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-sm lg:text-base">
          {step.supportTitle && <span dir="auto">{step.supportTitle}</span>}
          {step.levelCode && <span className={CHIP_LEVEL}>{step.levelCode}</span>}
        </div>
      )}
      <p className="text-muted-foreground mt-4 text-sm leading-relaxed lg:text-[15px]">
        <span dir="auto">{why}</span>
      </p>
      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <Link
          href={step.href}
          className={cn(BUTTON_PRIMARY, "after:absolute after:inset-0 after:rounded-3xl sm:flex-1")}
        >
          <span dir="auto">{`${start} · ${fill(copy.minutes, { n: step.minutes })}`}</span>
        </Link>
        <ChooseYourself className="sm:flex-none" />
      </div>
    </div>
  );
}

function DoneDetails({ onRedo }: { onRedo: () => void }) {
  const { t } = useLocale();
  const copy = t.today;
  return (
    <div className="flex flex-col justify-center">
      <span className="border-success/40 bg-success/[0.14] text-success grid size-12 place-items-center rounded-full border">
        <Check aria-hidden="true" className="size-6" strokeWidth={1.8} />
      </span>
      <h2 className="mt-4 text-[26px] leading-tight font-semibold tracking-[-0.01em] lg:text-[32px]">
        <span dir="auto">{copy.doneHeading}</span>
      </h2>
      <p className="text-muted-foreground mt-2 text-sm lg:text-base">
        <span dir="auto">{copy.doneBody}</span>
      </p>
      <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
        <button type="button" onClick={onRedo} className={cn(BUTTON_PRIMARY, "sm:flex-1")}>
          <RotateCcw aria-hidden="true" className="size-4" strokeWidth={1.8} />
          <span dir="auto">{copy.redo}</span>
        </button>
        <ChooseYourself className="sm:flex-none" />
      </div>
    </div>
  );
}

function IdleDetails() {
  const { t } = useLocale();
  return (
    <div className="flex flex-col justify-center">
      <h2 className="text-[26px] leading-tight font-semibold tracking-[-0.01em] lg:text-[32px]">
        <span dir="auto">{t.today.idleHeading}</span>
      </h2>
      <p className="text-muted-foreground mt-2 text-sm lg:text-base">
        <span dir="auto">{t.today.idleBody}</span>
      </p>
      <div className="mt-6">
        <ChooseYourself className="max-sm:w-full" />
      </div>
    </div>
  );
}

/**
 * "Redo today's lessons": the same three steps again, in the same order, on what was done today —
 * today's passage and today's story (the carry-on link keeps `redo=1`, so the story that follows
 * the passage is today's own, not the next one) and another round of words. A step with nothing
 * done today to redo keeps its normal target. Nothing more is earned, so the XP is left out.
 */
function redoView(data: TodayData): TodayData {
  const steps = data.steps.map((step) => ({
    ...step,
    done: false,
    quest: null,
    href:
      step.kind === "words"
        ? step.href
        : `${step.redoHref ?? step.href.split("?")[0]}?today=1&redo=1`,
  }));
  const totalMinutes = steps.reduce((sum, step) => sum + step.minutes, 0);
  return {
    ...data,
    steps,
    current: steps[0]?.kind ?? null,
    remainingMinutes: totalMinutes,
    totalMinutes,
    allDone: false,
    earnedXp: 0,
    totalXp: 0,
  };
}

/**
 * Home when "Today's session (new Home)" is open: ONE card that is also the day's daily quests. On
 * the left what the learner is on and one big button (the whole card is the button); on the right
 * the three tasks — listen to a passage, write a story, write five words — with the ring, what
 * they are worth and the one in progress moving gently. While something is left to do a soft glow
 * breathes behind it. A week rhythm sits above. Finished, it turns green with a way to redo the
 * day's lessons. The learner can stop after any step: each counts on its own.
 */
export function TodayHome({
  data: loaded,
  banners,
  className,
}: {
  data: TodayData;
  banners?: ReactNode;
  className?: string;
}) {
  const { t } = useLocale();
  const copy = t.today;
  const [redo, setRedo] = useState(false);
  const data = redo && loaded.allDone ? redoView(loaded) : loaded;
  const current = data.steps.find((step) => step.kind === data.current);
  const labels: Record<StepKind, string> = {
    listen: copy.stepListen,
    story: copy.stepStory,
    words: copy.stepWords,
  };
  const currentIndex = data.steps.findIndex((step) => step.kind === data.current);
  const after = currentIndex >= 0 ? data.steps.slice(currentIndex + 1) : [];
  const doneCount = data.steps.filter((step) => step.done).length;
  const pending = Boolean(current);

  return (
    <div className={cn("mx-auto w-full max-w-5xl px-4 pt-6 pb-12 sm:px-6 sm:pt-8", className)}>
      <div className="mb-6 flex min-h-[56px] items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-[1.15] font-semibold tracking-[-0.01em] lg:text-[34px]">
            <span dir="auto">{copy.heading}</span>
          </h1>
          <p className="text-muted-foreground mt-1.5 text-sm lg:text-base">
            <span dir="auto">{data.dateLabel}</span>
          </p>
        </div>
        <div className="text-muted-foreground flex flex-col items-end gap-2 text-xs sm:text-[13px]">
          <span dir="auto">
            {fill(copy.weekSessions, { done: data.week.done, target: data.week.target })}
          </span>
          <div className="flex gap-[9px]" aria-hidden="true">
            {data.week.dots.map((dot) => (
              <div key={dot.date} className="flex flex-col items-center gap-[3px] text-[10.5px]">
                <span
                  className={cn(
                    "size-3 rounded-full border-[1.5px]",
                    dot.on
                      ? "bg-primary border-primary"
                      : dot.today
                        ? "border-primary"
                        : "border-border",
                  )}
                />
                <span dir="auto">{dot.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {banners}

      <div className="relative isolate">
        {pending && <Glow />}
        <section
          className={cn(
            "relative grid gap-6 rounded-3xl border p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10",
            data.allDone
              ? "border-success/40 bg-success/5"
              : pending
                ? "border-primary/40 bg-card"
                : "border-border bg-card",
          )}
        >
          {data.allDone ? (
            <DoneDetails onRedo={() => setRedo(true)} />
          ) : current ? (
            <StepDetails data={data} step={current} />
          ) : (
            <IdleDetails />
          )}
          {data.steps.length > 0 && <TasksPanel data={data} />}
        </section>
      </div>

      {current && (
        <p className="text-muted-foreground mt-4 px-1 text-[13px]">
          <span dir="auto">
            {[
              doneCount > 0
                ? fill(copy.progressToday, { done: doneCount, total: data.steps.length })
                : null,
              after.length > 0
                ? fill(copy.nextUp, { steps: after.map((step) => labels[step.kind]).join(" · ") })
                : null,
              data.remainingMinutes === data.totalMinutes
                ? fill(copy.timeAll, { n: data.totalMinutes })
                : fill(copy.timeLeft, { n: data.remainingMinutes }),
            ]
              .filter(Boolean)
              .join(" — ")}
          </span>
        </p>
      )}
    </div>
  );
}
