"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Check, ChevronRight, Info, Lock } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import type { TodayData } from "@/lib/today/load";
import type { TodayItem } from "@/lib/today/next";
import { SESSION_LENGTHS, isSessionLength, startHref } from "@/lib/today/plan";
import type { SessionLength, TodayPlan, TodayStep, TodayVariant } from "@/lib/today/plan";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "looma:todayLength";
const CARD = "border-border bg-card rounded-2xl border";
const LABEL = "text-muted-foreground mb-3 text-[12.5px] font-semibold";
const BUTTON =
  "inline-flex h-12 items-center justify-center rounded-[10px] px-6 text-[15px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-11";
const CHIP =
  "rounded-full border px-2 py-px text-[11px] font-semibold border-border text-muted-foreground";
const CHIP_LEVEL =
  "border-success/40 bg-success/10 text-success rounded-full border px-2 py-px text-[11px] font-semibold";

function fill(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(`{${key}}`, String(value)),
    template,
  );
}

/** Reads the length the learner picked last, when it is one of the three. */
function readStoredLength(): SessionLength | null {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY));
    return isSessionLength(value) ? value : null;
  } catch {
    return null;
  }
}

function titleKey(variant: TodayVariant) {
  switch (variant) {
    case "first":
      return "cardTitleFirst";
    case "reviewOnly":
      return "cardTitleReviewOnly";
    case "comeback":
      return "cardTitleComeback";
    case "idle":
      return "cardTitleIdle";
    default:
      return "cardTitle";
  }
}

function whyText(copy: ReturnType<typeof useLocale>["t"]["today"], plan: TodayPlan): string {
  const review = plan.steps.find((step) => step.kind === "review");
  switch (plan.variant) {
    case "first":
      return copy.whyFirst;
    case "reviewOnly":
      return copy.whyReviewOnly;
    case "comeback":
      return copy.whyComeback;
    case "idle":
      return copy.whyIdle;
    default:
      return review?.kind === "review" ? fill(copy.whyReview, { n: review.items }) : copy.whyNew;
  }
}

function StepRow({
  index,
  current,
  title,
  time,
  children,
}: {
  index: number;
  current: boolean;
  title: string;
  time: string;
  children: ReactNode;
}) {
  return (
    <li className="border-border grid grid-cols-[30px_1fr_auto] items-center gap-3 border-b py-2.5 sm:gap-3.5 sm:py-3">
      <span
        className={cn(
          "border-primary grid size-[30px] place-items-center rounded-full border-2 text-[13px] font-bold",
          current ? "bg-primary text-primary-foreground" : "bg-card text-primary",
        )}
      >
        {index}
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold">
          <span dir="auto">{title}</span>
        </p>
        <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-[13px]">
          {children}
        </div>
      </div>
      <span className="text-muted-foreground text-[13px] font-semibold whitespace-nowrap">
        <span dir="auto">{time}</span>
      </span>
    </li>
  );
}

function ItemLine({
  item,
  withLevel,
  levelCode,
}: {
  item: TodayItem;
  withLevel: boolean;
  levelCode: string;
}) {
  const { t } = useLocale();
  return (
    <>
      <span className="text-foreground font-semibold" dir="ltr" style={{ unicodeBidi: "isolate" }}>
        {item.title}
      </span>
      {item.supportTitle && item.supportTitle !== item.title && (
        <span dir="auto">{item.supportTitle}</span>
      )}
      <span className={CHIP} dir="auto">
        {item.mode === "stories" ? t.today.kindStory : t.today.kindLesson}
      </span>
      {withLevel && <span className={CHIP_LEVEL}>{levelCode}</span>}
    </>
  );
}

function PlanSteps({ plan, data }: { plan: TodayPlan; data: TodayData }) {
  const { t } = useLocale();
  const copy = t.today;
  return (
    <ol className="border-border border-t">
      {plan.steps.map((step: TodayStep, index) => {
        const time = fill(copy.minutes, { n: step.minutes });
        if (step.kind === "review") {
          const description =
            plan.variant === "comeback"
              ? copy.stepReviewDescComeback
              : plan.variant === "reviewOnly"
                ? copy.stepReviewDescMany
                : copy.stepReviewDesc;
          return (
            <StepRow
              key="review"
              index={index + 1}
              current={index === 0}
              title={copy.stepReview}
              time={time}
            >
              <span dir="auto">{fill(description, { n: step.items })}</span>
            </StepRow>
          );
        }
        if (step.kind === "new" && data.next) {
          return (
            <StepRow
              key="new"
              index={index + 1}
              current={index === 0}
              title={plan.variant === "first" ? copy.stepFirst : copy.stepNew}
              time={time}
            >
              <ItemLine item={data.next} withLevel levelCode={data.levelCode} />
            </StepRow>
          );
        }
        if (step.kind === "recall") {
          return (
            <StepRow
              key="recall"
              index={index + 1}
              current={false}
              title={copy.stepRecall}
              time={time}
            >
              <span dir="auto">{fill(copy.stepRecallDesc, { n: step.items })}</span>
            </StepRow>
          );
        }
        return null;
      })}
    </ol>
  );
}

function ProgressCard({ data }: { data: TodayData }) {
  const { t } = useLocale();
  const copy = t.today;
  const { stats } = data;
  if (stats.sentences === 0 && stats.lessons === 0) return null;
  const items = [
    { value: stats.sentences, label: copy.statSentences, delta: stats.sentencesThisWeek },
    { value: stats.lessons, label: copy.statLessons, delta: 0 },
    ...(stats.words > 0 ? [{ value: stats.words, label: copy.statWords, delta: 0 }] : []),
  ];
  return (
    <div className={cn(CARD, "p-5")}>
      <p className={LABEL}>
        <span dir="auto">{copy.progressLabel}</span>
      </p>
      <div className={cn("grid gap-3", items.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {items.map((item) => (
          <div key={item.label}>
            <p
              className="text-2xl leading-[1.1] font-semibold tracking-[-0.01em] sm:text-[28px]"
              dir="ltr"
            >
              {item.value}
            </p>
            <p className="text-muted-foreground mt-1 text-[12.5px] leading-normal">
              <span dir="auto">{item.label}</span>
            </p>
            {item.delta > 0 && (
              <p className="text-success mt-0.5 text-[12.5px] font-semibold">
                <span dir="auto">{fill(copy.statWeekDelta, { n: item.delta })}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PathCard({ data, todayItemShown }: { data: TodayData; todayItemShown: boolean }) {
  const { t } = useLocale();
  const copy = t.today;
  const upcoming = [data.next && !todayItemShown ? data.next : null, ...data.upcoming].filter(
    (item): item is TodayItem => item !== null,
  );
  return (
    <div className={cn(CARD, "p-5")}>
      <p className={LABEL}>
        <span dir="auto">{copy.pathLabel}</span>
      </p>
      <p className="mb-1.5 text-[14.5px] font-semibold">
        <span dir="auto">{fill(copy.pathLevel, { level: data.levelCode })}</span>
      </p>
      {data.stats.lessons > 0 && (
        <div className="grid grid-cols-[18px_1fr_auto] items-center gap-2.5 py-1 text-[13.5px]">
          <span className="bg-success border-success text-primary-foreground grid size-4 place-items-center rounded-full border-[1.5px]">
            <Check aria-hidden="true" className="size-2.5" strokeWidth={3} />
          </span>
          <span className="text-muted-foreground text-[12.5px]">
            <span dir="auto">{fill(copy.pathDone, { n: data.stats.lessons })}</span>
          </span>
          <span />
        </div>
      )}
      {todayItemShown && data.next && (
        <div className="grid grid-cols-[18px_1fr_auto] items-center gap-2.5 py-1 text-[13.5px]">
          <span className="bg-primary border-primary size-4 rounded-full border-[1.5px]" />
          <span className="font-semibold" dir="ltr" style={{ unicodeBidi: "isolate" }}>
            {data.next.title}
          </span>
          <span className="text-primary text-[11px] font-semibold">
            <span dir="auto">{copy.tagToday}</span>
          </span>
        </div>
      )}
      {upcoming.slice(0, todayItemShown ? 2 : 3).map((item) => (
        <div
          key={`${item.mode}-${item.id}`}
          className="grid grid-cols-[18px_1fr_auto] items-center gap-2.5 py-1 text-[13.5px]"
        >
          <span className="border-border size-4 rounded-full border-[1.5px]" />
          <span className="font-semibold" dir="ltr" style={{ unicodeBidi: "isolate" }}>
            {item.title}
          </span>
          <span className="text-muted-foreground text-[12.5px]">
            <span dir="auto">{item.mode === "stories" ? copy.kindStory : copy.kindLesson}</span>
          </span>
        </div>
      ))}
      {data.locked && (
        <div className="grid grid-cols-[18px_1fr_auto] items-center gap-2.5 py-1 text-[13.5px]">
          <Lock aria-hidden="true" className="text-muted-foreground size-3.5" />
          <span
            className="text-muted-foreground font-medium"
            dir="ltr"
            style={{ unicodeBidi: "isolate" }}
          >
            {data.locked.title}
          </span>
          <span className="text-muted-foreground text-[12.5px]">
            <span dir="auto">{copy.tagLocked}</span>
          </span>
        </div>
      )}
      {data.freeContent && data.freeContent.total > 0 && (
        <p className="text-muted-foreground mt-2 text-[12.5px]">
          <span dir="auto">
            {fill(copy.freeContent, { done: data.freeContent.done, total: data.freeContent.total })}
          </span>
        </p>
      )}
    </div>
  );
}

/**
 * Home when "Today's session (new Home)" is open: one card with one button, the week's rhythm above
 * it, and the learner's progress and path below. Laid out as the approved mockups (a 1024px column,
 * 16px cards, a 44px primary button, nothing but the site's own colours). The three plans — one per
 * session length — are worked out on the server, so switching 3 / 7 / 12 is instant.
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
  const [length, setLength] = useState<SessionLength>(data.defaultLength);

  // A comeback starts on the short one; everyone else on the length they picked last time.
  useEffect(() => {
    if (data.plans[7].variant === "comeback") return;
    const stored = readStoredLength();
    if (stored) setLength(stored);
  }, [data.plans]);

  function pickLength(next: SessionLength) {
    setLength(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Not saved; the choice still holds for this visit.
    }
  }

  const plan = data.plans[length];
  const href = startHref(plan, data.next);
  const comeback = plan.variant === "comeback";
  const showSeg = plan.variant !== "first" && plan.variant !== "idle" && !data.doneToday;
  const todayItemShown = plan.steps.some((step) => step.kind === "new") && data.next !== null;
  const startLabel =
    plan.variant === "first" ? copy.startFirst : comeback ? copy.startComeback : copy.start;

  return (
    <div className={cn("mx-auto max-w-5xl px-6 pt-4 pb-12 sm:pt-6 sm:pb-16", className)}>
      <div className="mb-5 flex min-h-[52px] items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl leading-[1.2] font-semibold tracking-[-0.01em] sm:text-[28px]">
            <span dir="auto">{comeback ? copy.headingComeback : copy.heading}</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            <span dir="auto">{data.dateLabel}</span>
          </p>
        </div>
        {plan.variant !== "first" && (
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
        )}
      </div>

      {banners}

      {data.doneToday ? (
        <section className="border-success/40 bg-success/5 rounded-2xl border p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="border-success/40 bg-success/[0.14] text-success grid size-11 shrink-0 place-items-center rounded-full border">
                <Check aria-hidden="true" className="size-4" strokeWidth={1.8} />
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
            {data.next && (
              <Link
                href={`/learn/${data.next.mode}/${data.next.id}`}
                className={cn(BUTTON, "border-border hover:bg-muted border max-sm:w-full")}
              >
                <span dir="auto">{copy.moreLesson}</span>
              </Link>
            )}
          </div>
        </section>
      ) : (
        <section className={cn(CARD, "p-[18px] sm:p-6")} aria-label={copy[titleKey(plan.variant)]}>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
            <h2 className="text-[19px] font-semibold tracking-[-0.01em] max-sm:w-full sm:text-[22px]">
              <span dir="auto">{copy[titleKey(plan.variant)]}</span>
            </h2>
            {showSeg && (
              <div
                role="radiogroup"
                aria-label={copy.lengthLabel}
                className="bg-muted inline-flex shrink-0 rounded-[10px] p-[3px]"
              >
                {SESSION_LENGTHS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={length === option}
                    onClick={() => pickLength(option)}
                    className={cn(
                      "focus-visible:ring-ring rounded-lg px-3 py-[5px] text-[12.5px] font-semibold transition-colors outline-none focus-visible:ring-2",
                      length === option ? "bg-brand-muted text-primary" : "text-muted-foreground",
                    )}
                  >
                    <span dir="auto">{fill(copy.minutes, { n: option })}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-muted-foreground mt-2 mb-4 flex items-start gap-2 text-sm">
            <Info
              aria-hidden="true"
              className="text-primary mt-[3px] size-4 shrink-0"
              strokeWidth={1.8}
            />
            <span dir="auto">{whyText(copy, plan)}</span>
          </p>
          {plan.steps.length > 0 && <PlanSteps plan={plan} data={data} />}
          <div className="mt-[18px] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {href ? (
              <Link
                href={href}
                className={cn(
                  BUTTON,
                  "bg-primary text-primary-foreground hover:opacity-90 max-sm:w-full",
                )}
              >
                <span dir="auto">{startLabel}</span>
              </Link>
            ) : (
              <span />
            )}
            <Link
              href="/learn?classic=1"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm max-sm:justify-center"
            >
              <span dir="auto">{copy.chooseYourself}</span>
              <ChevronRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
        </section>
      )}

      {plan.variant !== "first" && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
          <ProgressCard data={data} />
          <PathCard data={data} todayItemShown={todayItemShown} />
        </div>
      )}
    </div>
  );
}
