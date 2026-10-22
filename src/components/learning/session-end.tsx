"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AlertCircle, BookOpen, Check, Loader2, Lock, Mail, Repeat } from "lucide-react";

import { GoogleIcon } from "@/components/auth/google-icon";
import { useLocale } from "@/components/providers/locale-provider";
import type { CompletionSaveStatus } from "@/hooks/use-progress";
import { formatMinuteCount } from "@/lib/i18n/format-minutes";
import { formatReminderTime } from "@/lib/i18n/format-reminder-time";
import type { SessionEndAction } from "@/lib/session-end/action-names";
import { signInWithGoogle } from "@/lib/supabase/auth-actions";
import { WEEK_TARGET_DAYS } from "@/lib/session-end/summary";
import { cn } from "@/lib/utils";

/** Where the second button goes: the next lesson, or the lock page of a Premium one. */
export type SessionEndExtra = { href: string; locked: false } | { href: string; locked: true };

export interface SessionEndReminder {
  /** The hours offered (0-23); the last one is hidden on a narrow phone. */
  hours: readonly number[];
  /** The hour the learner picked, or null for none. */
  selected: number | null;
  status: "idle" | "saving" | "saved" | "error" | "unavailable";
  onSelect: (hour: number | null) => void;
}

export interface SessionEndProps {
  /** The learner's first session: a different heading, and the recall note says what this will be every day. */
  first: boolean;
  /** Days with a session in the last seven, today included. */
  weekDays: number;
  /** What the recall round found, or null when it was skipped or the lesson had nothing to ask. */
  recall: { clean: number; total: number } | null;
  isGuest: boolean;
  tomorrow: {
    /** False while the next lesson and the review count are still being fetched. */
    ready: boolean;
    reviewWords: number;
    nextTitle: string | null;
    minutes: number;
  };
  extra: SessionEndExtra | null;
  /** Minutes quoted on the extra-lesson button. */
  extraMinutes: number;
  /** Replaces the "one more lesson" wording of the extra button (Today's session offers five more words instead). */
  extraLabel?: string;
  /** Null for a guest, and while reminders are not switched on at the server. */
  reminder: SessionEndReminder | null;
  saveStatus: CompletionSaveStatus;
  onRetrySave?: () => void;
  onAction?: (action: SessionEndAction) => void;
}

const CARD = "border-border bg-card rounded-2xl border px-5 py-[18px]";
const LABEL = "text-muted-foreground text-[12.5px] font-semibold";
const BUTTON =
  "inline-flex h-12 items-center justify-center gap-2 rounded-[10px] px-6 text-[15px] font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:h-11 lg:flex-1";
const BUTTON_PRIMARY = `${BUTTON} bg-primary text-primary-foreground hover:opacity-90`;
const BUTTON_GHOST = `${BUTTON} border-border text-foreground hover:bg-muted border`;

/**
 * The end of a lesson when the "New lesson ending" switch is open (see
 * session-end-flow.tsx, which feeds it): a calm column instead of the stats-and-confetti screen.
 * What the learner remembered comes first — the recall round's real result, never XP or typing
 * accuracy — then what is waiting tomorrow, then either a reminder to set (signed in) or "save
 * your progress" (a guest, who has no tomorrow to promise until they have an account), and the
 * two buttons. Each card is left out when it would have nothing true to say.
 *
 * Laid out as the approved mockups: a 560px column on every screen, vertically centred from lg up
 * and with the buttons pinned to the bottom edge below that. Text carries dir="auto" like every
 * other string in this left-to-right interface.
 */
export function SessionEnd({
  first,
  weekDays,
  recall,
  isGuest,
  tomorrow,
  extra,
  extraMinutes,
  extraLabel,
  reminder,
  saveStatus,
  onRetrySave,
  onAction,
}: SessionEndProps) {
  const { t, locale } = useLocale();
  const copy = t.sessionEnd;

  const heading = first ? copy.headingFirst : copy.headingRegular;
  const subheading = first
    ? copy.subFirst
    : copy.subWeek
        .replace("{done}", String(weekDays))
        .replace("{target}", String(WEEK_TARGET_DAYS));

  const hasTomorrowRows = tomorrow.reviewWords > 0 || tomorrow.nextTitle !== null;
  const showTomorrow = !tomorrow.ready || hasTomorrowRows;
  const minutes = tomorrow.minutes > 0 ? formatMinuteCount(copy, locale, tomorrow.minutes) : null;

  return (
    <section
      aria-label={heading}
      className="flex flex-1 flex-col items-center px-4 pt-4 pb-6 lg:justify-center lg:px-6 lg:pt-0 lg:pb-12"
    >
      <div className="flex w-full max-w-[560px] flex-1 flex-col gap-3 lg:flex-none">
        <div className="mb-1 flex items-center gap-3.5">
          <div className="border-success/40 bg-success/[0.14] text-success grid size-11 shrink-0 place-items-center rounded-full border">
            <Check aria-hidden="true" className="size-4" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-[19px] font-semibold tracking-[-0.01em] lg:text-[22px]">
              <span dir="auto">{heading}</span>
            </h2>
            <p className="text-muted-foreground mt-0.5 text-sm">
              <span dir="auto">{subheading}</span>
            </p>
          </div>
        </div>

        {recall && (
          <div className={CARD}>
            <p className={cn(LABEL, "mb-2")}>
              <span dir="auto">{copy.recallLabel}</span>
            </p>
            <p className="text-[34px] leading-none font-semibold tracking-[-0.01em] lg:text-[40px]">
              <span dir="auto">
                {copy.recallScore
                  .replace("{clean}", String(recall.clean))
                  .replace("{total}", String(recall.total))}
              </span>
            </p>
            <div className="mt-3 mb-2.5 flex gap-1.5" aria-hidden="true">
              {Array.from({ length: recall.total }, (_unused, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-2 max-w-[30px] flex-1 rounded",
                    index < recall.clean ? "bg-success" : "bg-muted",
                  )}
                />
              ))}
            </div>
            <p className="text-muted-foreground text-[12.5px]">
              <span dir="auto">
                {first
                  ? copy.recallFirstNote
                  : recall.clean === recall.total
                    ? copy.recallAll
                    : copy.recallSome}
              </span>
            </p>
          </div>
        )}

        {showTomorrow && (
          <div className={CARD}>
            <p className={cn(LABEL, "mb-1.5")}>
              <span dir="auto">
                {minutes
                  ? copy.tomorrowLabelMinutes.replace("{time}", minutes)
                  : copy.tomorrowLabel}
              </span>
            </p>
            {!tomorrow.ready ? (
              <div className="py-[7px]" aria-hidden="true">
                <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
              </div>
            ) : (
              <>
                {tomorrow.reviewWords > 0 && (
                  <div className="flex items-start gap-2.5 py-[7px] text-sm">
                    <Repeat aria-hidden="true" className="text-primary mt-[3px] size-4 shrink-0" />
                    <p dir="auto">
                      {copy.tomorrowReview.replace("{n}", String(tomorrow.reviewWords))}
                    </p>
                  </div>
                )}
                {tomorrow.nextTitle !== null && (
                  <div className="flex items-start gap-2.5 py-[7px] text-sm">
                    <BookOpen
                      aria-hidden="true"
                      className="text-primary mt-[3px] size-3.5 shrink-0"
                    />
                    <p dir="auto">
                      {(tomorrow.reviewWords > 0
                        ? copy.tomorrowNextAfterReview
                        : copy.tomorrowNextOnly
                      ).replace("{title}", "")}
                      <span className="font-semibold" dir="ltr">
                        {tomorrow.nextTitle}
                      </span>
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {isGuest ? (
          <div className={CARD}>
            <p className={cn(LABEL, "mb-2.5")}>
              <span dir="auto">{copy.saveHeading}</span>
            </p>
            <form action={signInWithGoogle}>
              <input type="hidden" name="next" value="/learn" />
              <button
                type="submit"
                onClick={() => onAction?.("save_google")}
                className={cn(BUTTON_PRIMARY, "w-full gap-2.5 lg:flex-none")}
              >
                <span className="grid size-[18px] place-items-center rounded-full bg-white">
                  <GoogleIcon className="size-3" />
                </span>
                <span dir="auto">{t.auth.googleSignIn}</span>
              </button>
            </form>
            <div className="text-muted-foreground mt-2.5 flex items-center justify-between gap-3 text-[12.5px]">
              <span dir="auto">{copy.saveFree}</span>
              <Link
                href="/register"
                onClick={() => onAction?.("save_email")}
                className="underline underline-offset-2"
              >
                <span dir="auto">{copy.saveEmail}</span>
              </Link>
            </div>
          </div>
        ) : (
          reminder &&
          tomorrow.ready &&
          hasTomorrowRows && (
            <div className={CARD}>
              <p className={cn(LABEL, "mb-2")}>
                <span dir="auto">{copy.reminderLabel}</span>
              </p>
              <div
                role="radiogroup"
                aria-label={copy.reminderLabel}
                className="mt-1.5 flex flex-wrap gap-2"
              >
                {reminder.hours.map((hour, index) => (
                  <ReminderChip
                    key={hour}
                    selected={reminder.selected === hour}
                    disabled={reminder.status === "saving"}
                    className={index === reminder.hours.length - 1 ? "max-sm:hidden" : undefined}
                    onClick={() => {
                      onAction?.("reminder_set");
                      reminder.onSelect(hour);
                    }}
                  >
                    {formatReminderTime(hour, locale)}
                  </ReminderChip>
                ))}
                <ReminderChip
                  selected={reminder.selected === null && reminder.status !== "idle"}
                  disabled={reminder.status === "saving"}
                  onClick={() => {
                    onAction?.("reminder_none");
                    reminder.onSelect(null);
                  }}
                >
                  {copy.reminderNone}
                </ReminderChip>
              </div>
              <p
                aria-live="polite"
                className={cn(
                  "mt-2.5 flex items-center gap-1.5 text-[12.5px]",
                  reminder.status === "error" || reminder.status === "unavailable"
                    ? "text-danger"
                    : "text-muted-foreground",
                )}
              >
                {reminder.status === "saved" && reminder.selected !== null ? (
                  <>
                    <Check aria-hidden="true" className="text-success size-4 shrink-0" />
                    <span dir="auto">
                      {copy.reminderSaved.replace(
                        "{time}",
                        formatReminderTime(reminder.selected, locale),
                      )}
                    </span>
                  </>
                ) : reminder.status === "error" || reminder.status === "unavailable" ? (
                  <span dir="auto">
                    {reminder.status === "unavailable"
                      ? copy.reminderUnavailable
                      : copy.reminderError}
                  </span>
                ) : (
                  <>
                    <Mail aria-hidden="true" className="size-4 shrink-0" />
                    <span dir="auto">{copy.reminderNote}</span>
                  </>
                )}
              </p>
            </div>
          )
        )}

        {saveStatus === "saving" && (
          <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs font-medium">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            <span dir="auto">{t.lesson.savingProgress}</span>
          </p>
        )}
        {saveStatus === "error" && (
          <div className="border-danger/40 bg-danger/10 text-danger flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            <span dir="auto">{t.lesson.saveFailed}</span>
            {onRetrySave && (
              <button
                type="button"
                onClick={onRetrySave}
                className="border-border hover:bg-muted text-foreground h-7 rounded-md border px-2.5 text-xs font-semibold"
              >
                {t.lesson.retry}
              </button>
            )}
          </div>
        )}

        {isGuest && first ? (
          <div className="flex justify-center pt-1 pb-1">
            <Link
              href="/learn"
              onClick={() => onAction?.("not_now")}
              className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm"
            >
              <span dir="auto">{copy.notNow}</span>
            </Link>
          </div>
        ) : (
          <div
            className={cn(
              "mt-auto flex flex-col gap-2 pt-3 lg:mt-1 lg:flex-row lg:gap-2.5 lg:pt-0",
              "max-lg:from-background max-lg:via-background max-lg:sticky max-lg:bottom-0 max-lg:-mx-4 max-lg:bg-gradient-to-t max-lg:to-transparent max-lg:px-4 max-lg:pb-4",
            )}
          >
            {extra &&
              (extra.locked ? (
                <Link
                  href={extra.href}
                  onClick={() => onAction?.("locked_lesson")}
                  className={BUTTON_PRIMARY}
                >
                  <Lock aria-hidden="true" className="size-4" />
                  <span dir="auto">{copy.extraLessonLocked}</span>
                </Link>
              ) : (
                <Link
                  href={extra.href}
                  onClick={() => onAction?.("extra_lesson")}
                  className={BUTTON_PRIMARY}
                >
                  <span dir="auto">
                    {extraLabel ??
                      copy.extraLesson.replace(
                        "{time}",
                        formatMinuteCount(copy, locale, extraMinutes),
                      )}
                  </span>
                </Link>
              ))}
            <Link
              href="/learn"
              onClick={() => onAction?.("finish")}
              className={extra ? BUTTON_GHOST : BUTTON_PRIMARY}
            >
              <span dir="auto">{copy.finish}</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function ReminderChip({
  selected,
  disabled,
  className,
  onClick,
  children,
}: {
  selected: boolean;
  disabled: boolean;
  className?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "focus-visible:ring-ring rounded-full border px-3.5 py-[7px] text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2 disabled:opacity-60",
        selected
          ? "bg-brand-muted text-primary border-transparent"
          : "border-border text-muted-foreground hover:bg-muted",
        className,
      )}
    >
      <span dir="auto">{children}</span>
    </button>
  );
}
