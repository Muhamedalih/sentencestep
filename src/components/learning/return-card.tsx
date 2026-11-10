"use client";

import { BellRing, BookOpen, Check, Loader2, Mail } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import type { ReturnPlan } from "@/components/learning/use-return-plan";
import { formatMinuteCount } from "@/lib/i18n/format-minutes";
import { formatReminderTime, reminderTimeParts } from "@/lib/i18n/format-reminder-time";
import type { ReturnChoice } from "@/lib/return-loop/choices";
import { cn } from "@/lib/utils";

const CARD = "border-border bg-card rounded-2xl border px-5 py-[18px]";
const LABEL = "text-muted-foreground text-[12.5px] font-semibold";

/**
 * One time to press. The clock time is the thing on the tile: set large, bold and in the brand colour
 * (the digits only; the morning/evening marker stays small beside them), with one small line under it
 * that says why this time is offered. The first time (the hour of today's session) has a brand outline
 * before anything is pressed, so the eye lands there first.
 */
function TimeTile({
  choice,
  selected,
  disabled,
  onPress,
}: {
  choice: ReturnChoice;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { t, locale } = useLocale();
  const copy = t.returnLoop;
  const { digits, marker } = reminderTimeParts(choice.hour, locale);
  const caption = choice.sameTime ? copy.sameTime : choice.hour < 17 ? copy.midday : copy.evening;
  const accent = selected || choice.sameTime;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onPress}
      className={cn(
        "focus-visible:ring-ring flex min-w-[104px] flex-col items-center rounded-xl border px-4 py-2.5 transition-colors outline-none focus-visible:ring-2 disabled:opacity-60",
        selected
          ? "bg-brand-muted border-primary/60"
          : choice.sameTime
            ? "border-primary/45 hover:bg-brand-muted/60"
            : "border-border hover:bg-muted",
      )}
    >
      <span dir="ltr" className="flex items-baseline gap-1 leading-none">
        <span
          className={cn(
            "text-[22px] font-bold tracking-tight tabular-nums",
            accent ? "text-primary" : "text-foreground",
          )}
        >
          {digits}
        </span>
        {marker && (
          <span
            className={cn("text-[12px] font-semibold", accent ? "text-primary" : "text-foreground")}
          >
            {marker}
          </span>
        )}
      </span>
      <span
        dir="auto"
        className={cn(
          "mt-1.5 text-[11.5px] leading-none font-medium",
          accent ? "text-primary/90" : "text-muted-foreground",
        )}
      >
        {caption}
      </span>
    </button>
  );
}

/**
 * The ask itself, without a frame (SessionEnd puts it inside its "Tomorrow" card, ReturnCard inside
 * its own): why press a time, the two times, "No thanks", and one line that says what the press did.
 * Renders nothing when no reminder could reach this learner (no notifications, no Google address)
 * and nothing was pressed.
 */
export function ReturnPlanBody({ plan }: { plan: ReturnPlan }) {
  const { t, locale } = useLocale();
  const copy = t.returnLoop;
  const { channel, status, selectedHour, choices } = plan;
  if (channel === "none" && status === "idle") return null;

  const busy = status === "saving";
  const time = selectedHour === null ? "" : formatReminderTime(selectedHour, locale);
  const idleNote =
    channel === "push"
      ? choices.primary.sameTime
        ? copy.notePush
        : copy.notePushPlain
      : choices.primary.sameTime
        ? copy.noteEmail
        : copy.noteEmailPlain;

  return (
    <div>
      <p className="text-[15px] font-semibold">
        <span dir="auto">{copy.title}</span>
      </p>
      <p className="text-muted-foreground mt-1 text-[13px]">
        <span dir="auto">{copy.sub}</span>
      </p>
      <div
        role="radiogroup"
        aria-label={copy.title}
        className="mt-3 flex flex-wrap items-center gap-2"
      >
        <TimeTile
          choice={choices.primary}
          selected={selectedHour === choices.primary.hour && status !== "none"}
          disabled={busy}
          onPress={() => plan.choose(choices.primary.hour)}
        />
        <TimeTile
          choice={choices.secondary}
          selected={selectedHour === choices.secondary.hour && status !== "none"}
          disabled={busy}
          onPress={() => plan.choose(choices.secondary.hour)}
        />
        <button
          type="button"
          disabled={busy}
          onClick={plan.decline}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-md px-2 py-2 text-[13px] font-medium underline-offset-4 transition-colors outline-none hover:underline focus-visible:ring-2 disabled:opacity-60"
        >
          <span dir="auto">{copy.none}</span>
        </button>
      </div>
      <p
        aria-live="polite"
        className={cn(
          "mt-3 flex items-start gap-1.5 text-[12.5px]",
          status === "error" ? "text-danger" : "text-muted-foreground",
        )}
      >
        {status === "saving" ? (
          <Loader2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 animate-spin" />
        ) : status === "push" || status === "email" || status === "fallback_email" ? (
          <Check aria-hidden="true" className="text-success mt-0.5 size-4 shrink-0" />
        ) : status === "idle" ? (
          channel === "push" ? (
            <BellRing aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          ) : (
            <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          )
        ) : null}
        <span dir="auto">
          {status === "push"
            ? copy.savedPush.replace("{time}", time)
            : status === "email"
              ? copy.savedEmail.replace("{time}", time)
              : status === "fallback_email"
                ? copy.fallbackEmail.replace("{time}", time)
                : status === "none"
                  ? copy.savedNone
                  : status === "error"
                    ? copy.error
                    : status === "blocked"
                      ? copy.blocked
                      : status === "idle"
                        ? idleNote
                        : ""}
        </span>
      </p>
    </div>
  );
}

/**
 * The return loop's card on the first-lesson page and on the page after a guest signs up: tomorrow's
 * lesson by name (when one is known), then the ask. SessionEnd builds its own version from the same
 * body so its existing "Tomorrow" rows stay as they are.
 */
export function ReturnCard({
  plan,
  nextTitle,
  minutes,
  className,
}: {
  plan: ReturnPlan;
  nextTitle: string | null;
  minutes: number;
  className?: string;
}) {
  const { t, locale } = useLocale();
  const copy = t.sessionEnd;
  const body = <ReturnPlanBody plan={plan} />;
  const hasBody = !(plan.channel === "none" && plan.status === "idle");
  if (!nextTitle && !hasBody) return null;
  return (
    <div className={cn(CARD, "w-full text-start", className)}>
      {nextTitle && (
        <>
          <p className={cn(LABEL, "mb-1.5")}>
            <span dir="auto">
              {copy.tomorrowLabelMinutes.replace(
                "{time}",
                formatMinuteCount(copy, locale, minutes),
              )}
            </span>
          </p>
          <div className="flex items-start gap-2.5 py-[5px] text-sm">
            <BookOpen aria-hidden="true" className="text-primary mt-[3px] size-3.5 shrink-0" />
            <p dir="auto">
              {copy.tomorrowNextOnly.replace("{title}", "")}
              <span className="font-semibold" dir="ltr">
                {nextTitle}
              </span>
            </p>
          </div>
          {hasBody && <div className="bg-border my-3 h-px" />}
        </>
      )}
      {hasBody && body}
    </div>
  );
}
