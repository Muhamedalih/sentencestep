"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, Headphones, LayoutList, PenLine, RotateCcw, Type } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import type { TodayData, TodayStepData } from "@/lib/today/load";
import type { StepKind } from "@/lib/today/plan";
import { cn } from "@/lib/utils";

const CARD = "border-border bg-card rounded-2xl border";
const BUTTON =
  "inline-flex h-12 items-center justify-center gap-2 rounded-[10px] px-6 text-[15px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
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

function Stepper({ data }: { data: TodayData }) {
  const { t } = useLocale();
  const copy = t.today;
  const labels: Record<StepKind, string> = {
    listen: copy.stepListen,
    story: copy.stepStory,
    words: copy.stepWords,
  };
  return (
    <ol className="mb-3 grid grid-cols-3 gap-2" aria-label={copy.heading}>
      {data.steps.map((step) => {
        const current = step.kind === data.current;
        return (
          <li
            key={step.kind}
            aria-current={current ? "step" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 text-center transition-colors",
              step.done
                ? "border-success/40 bg-success/10 text-success"
                : current
                  ? "border-primary/50 bg-brand-muted text-primary"
                  : "border-border bg-card text-muted-foreground",
            )}
          >
            {step.done ? (
              <span className="grid size-10 place-items-center" aria-hidden="true">
                <Check className="size-5" strokeWidth={2} />
              </span>
            ) : (
              <StepIcon kind={step.kind} active={current} />
            )}
            <span className="text-[13px] font-semibold">
              <span dir="auto">{labels[step.kind]}</span>
            </span>
            <span className="text-[11.5px] opacity-80">
              <span dir="auto">{fill(copy.minutes, { n: step.minutes })}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ChooseYourself({ className }: { className?: string }) {
  const { t } = useLocale();
  return (
    <Link href="/learn?classic=1" className={cn(BUTTON_OUTLINE, className)}>
      <LayoutList aria-hidden="true" className="size-4" strokeWidth={1.8} />
      <span dir="auto">{t.today.chooseYourself}</span>
    </Link>
  );
}

function CurrentStepCard({ data, step }: { data: TodayData; step: TodayStepData }) {
  const { t } = useLocale();
  const copy = t.today;
  const index = data.steps.findIndex((entry) => entry.kind === step.kind) + 1;
  const title = step.kind === "words" ? copy.titleWords : step.title;
  const why = { listen: copy.whyListen, story: copy.whyStory, words: copy.whyWords }[step.kind];
  const start = { listen: copy.startListen, story: copy.startStory, words: copy.startWords }[
    step.kind
  ];
  return (
    <section className={cn(CARD, "p-5 sm:p-6")}>
      <p className="text-muted-foreground text-[12.5px] font-semibold">
        <span dir="auto">{fill(copy.stepOf, { n: index, total: data.steps.length })}</span>
      </p>
      <h2 className="mt-1.5 text-[22px] leading-tight font-semibold tracking-[-0.01em]">
        <span dir={step.kind === "words" ? "auto" : "ltr"} style={{ unicodeBidi: "isolate" }}>
          {title}
        </span>
      </h2>
      {(step.supportTitle || step.levelCode) && (
        <div className="text-muted-foreground mt-1.5 flex flex-wrap items-center gap-2 text-sm">
          {step.supportTitle && <span dir="auto">{step.supportTitle}</span>}
          {step.levelCode && <span className={CHIP_LEVEL}>{step.levelCode}</span>}
        </div>
      )}
      <p className="text-muted-foreground mt-3 text-sm">
        <span dir="auto">{why}</span>
      </p>
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <Link href={step.href} className={cn(BUTTON_PRIMARY, "sm:flex-1")}>
          <span dir="auto">{`${start} · ${fill(copy.minutes, { n: step.minutes })}`}</span>
        </Link>
        <ChooseYourself className="sm:flex-none" />
      </div>
    </section>
  );
}

function DoneCard({ data }: { data: TodayData }) {
  const { t } = useLocale();
  const copy = t.today;
  const [showRedo, setShowRedo] = useState(false);
  const rows = data.steps.filter((step) => step.redoHref);
  const redoLabel = { listen: copy.redoListen, story: copy.redoStory, words: copy.redoWords };
  return (
    <section className="border-success/40 bg-success/5 rounded-2xl border p-5 sm:p-6">
      <div className="flex items-center gap-3.5">
        <span className="border-success/40 bg-success/[0.14] text-success grid size-11 shrink-0 place-items-center rounded-full border">
          <Check aria-hidden="true" className="size-5" strokeWidth={1.8} />
        </span>
        <div>
          <h2 className="text-[19px] font-semibold tracking-[-0.01em] sm:text-[22px]">
            <span dir="auto">{copy.doneHeading}</span>
          </h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            <span dir="auto">{copy.doneBody}</span>
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <button
          type="button"
          aria-expanded={showRedo}
          onClick={() => setShowRedo((open) => !open)}
          className={cn(BUTTON_PRIMARY, "sm:flex-1")}
        >
          <RotateCcw aria-hidden="true" className="size-4" strokeWidth={1.8} />
          <span dir="auto">{copy.redo}</span>
        </button>
        <ChooseYourself className="sm:flex-none" />
      </div>
      {showRedo && (
        <ul className="border-border mt-4 divide-y border-t">
          {rows.map((step) => {
            const Icon = ICONS[step.kind];
            return (
              <li key={step.kind}>
                <Link
                  href={step.redoHref ?? "/learn"}
                  className="hover:bg-muted/60 flex items-center gap-3 px-1 py-3 transition-colors"
                >
                  <Icon
                    aria-hidden="true"
                    className="text-primary size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <span className="min-w-0 flex-1 text-sm font-semibold">
                    <span dir="auto">{redoLabel[step.kind]}</span>
                    {step.title && (
                      <span
                        className="text-muted-foreground ms-2 font-normal"
                        dir="ltr"
                        style={{ unicodeBidi: "isolate" }}
                      >
                        {step.title}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function IdleCard() {
  const { t } = useLocale();
  return (
    <section className={cn(CARD, "p-5 sm:p-6")}>
      <h2 className="text-[19px] font-semibold tracking-[-0.01em] sm:text-[22px]">
        <span dir="auto">{t.today.idleHeading}</span>
      </h2>
      <p className="text-muted-foreground mt-1.5 text-sm">
        <span dir="auto">{t.today.idleBody}</span>
      </p>
      <div className="mt-5">
        <ChooseYourself className="max-sm:w-full" />
      </div>
    </section>
  );
}

/**
 * Home when "Today's session (new Home)" is open: one calm column. A week rhythm at the top, the
 * three steps — listen, write a story, write words — as a row of small tiles whose current icon
 * moves gently, and under them ONE card for the step the learner is on, with one big button and a
 * plain "Choose yourself" button beside it. Finished, it turns into a done card with a way to redo
 * the day's lessons. The learner can stop after any step: each counts on its own.
 */
export function TodayHome({
  data,
  banners,
  className,
}: {
  data: TodayData;
  banners?: ReactNode;
  className?: string;
}) {
  const { t } = useLocale();
  const copy = t.today;
  const current = data.steps.find((step) => step.kind === data.current);
  const labels: Record<StepKind, string> = {
    listen: copy.stepListen,
    story: copy.stepStory,
    words: copy.stepWords,
  };
  const currentIndex = data.steps.findIndex((step) => step.kind === data.current);
  const after = currentIndex >= 0 ? data.steps.slice(currentIndex + 1) : [];
  const doneCount = data.steps.filter((step) => step.done).length;

  return (
    <div className={cn("mx-auto w-full max-w-[640px] px-4 pt-6 pb-12 sm:px-6 sm:pt-10", className)}>
      <div className="mb-5 flex min-h-[52px] items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl leading-[1.2] font-semibold tracking-[-0.01em] sm:text-[28px]">
            <span dir="auto">{copy.heading}</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            <span dir="auto">{data.dateLabel}</span>
          </p>
        </div>
        <div className="text-muted-foreground flex flex-col items-end gap-[7px] text-xs sm:text-[13px]">
          <span dir="auto">
            {fill(copy.weekSessions, { done: data.week.done, target: data.week.target })}
          </span>
          <div className="flex gap-[9px]" aria-hidden="true">
            {data.week.dots.map((dot) => (
              <div key={dot.date} className="flex flex-col items-center gap-[3px] text-[10.5px]">
                <span
                  className={cn(
                    "size-2.5 rounded-full border-[1.5px]",
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

      {data.steps.length > 0 && !data.allDone && <Stepper data={data} />}

      {data.allDone ? (
        <DoneCard data={data} />
      ) : current ? (
        <CurrentStepCard data={data} step={current} />
      ) : (
        <IdleCard />
      )}

      {current && (
        <p className="text-muted-foreground mt-3 px-1 text-[13px]">
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
