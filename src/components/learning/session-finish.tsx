"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Bell, BellOff, Loader2 } from "lucide-react";

import { GoogleIcon } from "@/components/auth/google-icon";
import { FinishButton, GREEN, type StoryFinishAction } from "@/components/learning/story-finish";
import { useLocale } from "@/components/providers/locale-provider";
import { formatMinuteCount } from "@/lib/i18n/format-minutes";
import { formatReminderTime } from "@/lib/i18n/format-reminder-time";
import { signInWithGoogle } from "@/lib/supabase/auth-actions";
import type { SessionEndProps } from "@/components/learning/session-end";

type FinishProps = Pick<
  SessionEndProps,
  | "isGuest"
  | "tomorrow"
  | "extra"
  | "extraMinutes"
  | "extraLabel"
  | "test"
  | "reminder"
  | "saveStatus"
  | "onRetrySave"
  | "onAction"
>;

const INK = "#14192b";

/** What the new finish page shows besides the session end's own props: the lesson's accuracy and where the XP bar moved. */
export interface SessionFinishStats {
  accuracyPercent: number;
  /** The learner's level name, written under the bar. */
  levelLabel: string;
  /** The bar's start and end, in percent of the current level. */
  fromPercent: number;
  toPercent: number;
}

/**
 * The end of a daily lesson in the look of the Words and Stories finish pages (permission
 * sessionFinish): the accuracy as one large number, the XP as a bar that fills, the reminder as a
 * pale card with large time choices, and large buttons whose first names the next lesson. Nothing
 * else is written on it.
 */
export function SessionFinish({
  stats,
  props,
  nextTitle,
  endExtras,
}: {
  stats: SessionFinishStats;
  props: FinishProps;
  nextTitle: string | null;
  endExtras?: ReactNode;
}) {
  const reduced = useReducedMotion();
  const { t, locale, dir } = useLocale();
  const copy = t.sessionEnd;
  const { reminder, isGuest, tomorrow, extra, saveStatus, onRetrySave, onAction, test } = props;
  const hasTomorrowRows = tomorrow.reviewWords > 0 || tomorrow.nextTitle !== null;
  const showReminder = !isGuest && reminder && tomorrow.ready && hasTomorrowRows;
  const noReminder = reminder?.selected === null && reminder.status !== "idle";

  const actions: (StoryFinishAction & { sub?: string; locked?: boolean })[] = [];
  if (test) actions.push({ id: "test", label: test.label, href: test.href });
  if (extra) {
    actions.push({
      id: "extra",
      label: extra.locked ? copy.extraLessonLocked : (nextTitle ?? copy.extraLessonLocked),
      sub: extra.locked
        ? undefined
        : (props.extraLabel ??
          copy.extraLesson.replace("{time}", formatMinuteCount(copy, locale, props.extraMinutes))),
      href: extra.href,
    });
  }
  actions.push({ id: "finish", label: copy.finish, href: "/learn" });

  return (
    <section
      aria-label={copy.headingRegular}
      className="flex min-h-0 flex-1 flex-col bg-black text-white lg:overflow-y-auto"
    >
      <div
        style={{ zoom: 0.9 }}
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-9 px-6 py-10 sm:px-10"
      >
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6"
        >
          <div className="flex items-end gap-3" dir="ltr">
            <span
              style={{ color: stats.accuracyPercent >= 80 ? GREEN : undefined }}
              className="text-[clamp(4rem,10vw,7rem)] leading-none font-extrabold tabular-nums"
            >
              {stats.accuracyPercent}%
            </span>
            <span className="text-muted-foreground pb-3 text-xl font-medium tracking-wide uppercase">
              {t.lesson.accuracyLabel}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-muted-foreground text-lg font-medium">{stats.levelLabel}</span>
            <div
              role="progressbar"
              aria-valuenow={stats.toPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-3 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: "#151515" }}
            >
              <motion.div
                initial={{ width: `${reduced ? stats.toPercent : stats.fromPercent}%` }}
                animate={{ width: `${stats.toPercent}%` }}
                transition={reduced ? { duration: 0 } : { duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: GREEN }}
              />
            </div>
          </div>
        </motion.div>

        {isGuest ? (
          <div
            style={{ background: "#ece9e0", color: INK }}
            className="flex flex-col gap-4 rounded-3xl p-6"
          >
            <span className="text-xl font-semibold" dir="auto">
              {copy.saveHeading}
            </span>
            <form action={signInWithGoogle}>
              <input type="hidden" name="next" value="/learn" />
              <button
                type="submit"
                onClick={() => onAction?.("save_google")}
                className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl text-xl font-semibold text-white"
                style={{ background: INK }}
              >
                <span className="grid size-6 place-items-center rounded-full bg-white">
                  <GoogleIcon className="size-4" />
                </span>
                <span dir="auto">{t.auth.googleSignIn}</span>
              </button>
            </form>
          </div>
        ) : (
          showReminder && (
            <motion.div
              style={{ background: "#ece9e0", color: INK }}
              className="flex flex-col gap-4 rounded-3xl p-6"
            >
              <div className="flex items-center gap-3">
                <motion.span
                  key={`${reminder.selected}-${reminder.status}`}
                  animate={
                    reduced || noReminder || reminder.selected === null
                      ? undefined
                      : { rotate: [0, -18, 15, -10, 6, 0] }
                  }
                  transition={{ duration: 0.7 }}
                  style={{ transformOrigin: "50% 10%", display: "inline-flex" }}
                >
                  {noReminder ? (
                    <BellOff className="size-6" aria-hidden="true" />
                  ) : (
                    <Bell className="size-6" aria-hidden="true" />
                  )}
                </motion.span>
                <span className="text-xl font-semibold" dir="auto">
                  {noReminder ? copy.reminderNone : copy.reminderLabel}
                </span>
              </div>
              <div
                role="radiogroup"
                aria-label={copy.reminderLabel}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                {reminder.hours.map((hour, index) => (
                  <ReminderChoice
                    key={hour}
                    selected={reminder.selected === hour}
                    disabled={reminder.status === "saving"}
                    reduced={Boolean(reduced)}
                    className={index === reminder.hours.length - 1 ? "max-sm:hidden" : undefined}
                    onClick={() => {
                      onAction?.("reminder_set");
                      reminder.onSelect(hour);
                    }}
                  >
                    <span dir="ltr" className="text-[1.6rem] font-semibold">
                      {formatReminderTime(hour, locale)}
                    </span>
                  </ReminderChoice>
                ))}
                <ReminderChoice
                  selected={noReminder}
                  disabled={reminder.status === "saving"}
                  reduced={Boolean(reduced)}
                  onClick={() => {
                    onAction?.("reminder_none");
                    reminder.onSelect(null);
                  }}
                >
                  <span dir="auto" className="text-xl">
                    {copy.reminderNone}
                  </span>
                </ReminderChoice>
              </div>
              {(reminder.status === "error" || reminder.status === "unavailable") && (
                <p className="text-sm text-red-700" dir="auto" aria-live="polite">
                  {reminder.status === "unavailable"
                    ? copy.reminderUnavailable
                    : copy.reminderError}
                </p>
              )}
            </motion.div>
          )
        )}

        {saveStatus === "saving" && (
          <p className="flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span dir="auto">{t.lesson.savingProgress}</span>
          </p>
        )}
        {saveStatus === "error" && (
          <p className="flex items-center gap-3 text-sm text-red-400">
            <AlertCircle className="size-4" aria-hidden="true" />
            <span dir="auto">{t.lesson.saveFailed}</span>
            {onRetrySave && (
              <button type="button" onClick={onRetrySave} className="underline">
                {t.lesson.retry}
              </button>
            )}
          </p>
        )}

        <div className="flex flex-wrap gap-4" dir={dir}>
          {actions.map((action, index) => (
            <div
              key={action.id}
              className={index === 0 ? "min-w-[14rem] flex-[1.4]" : "min-w-[11rem] flex-1"}
            >
              <FinishButton
                action={{
                  id: action.id,
                  label: action.label,
                  href: action.href,
                  onClick: () =>
                    onAction?.(
                      action.id === "extra"
                        ? extra?.locked
                          ? "locked_lesson"
                          : "extra_lesson"
                        : "finish",
                    ),
                }}
                primary={index === 0}
              >
                {action.sub ? (
                  <span className="flex flex-col items-center gap-1">
                    <span className="text-sm font-medium text-[#5a5f6e]">{action.sub}</span>
                    <span dir="ltr">{action.label}</span>
                  </span>
                ) : (
                  action.label
                )}
              </FinishButton>
            </div>
          ))}
        </div>
      </div>
      {endExtras}
    </section>
  );
}

function ReminderChoice({
  selected,
  disabled,
  reduced,
  className,
  onClick,
  children,
}: {
  selected: boolean;
  disabled: boolean;
  reduced: boolean;
  className?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      whileHover={reduced ? undefined : { y: -5, scale: 1.03 }}
      whileTap={reduced ? undefined : { scale: 0.95, y: 0 }}
      animate={selected && !reduced ? { scale: [0.92, 1.07, 1] } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      style={{
        background: selected ? INK : "transparent",
        color: selected ? "#fff" : INK,
        borderColor: selected ? INK : "rgba(20,25,43,0.25)",
      }}
      className={
        "flex h-[5.25rem] items-center justify-center rounded-2xl border px-3 transition-shadow hover:shadow-[0_14px_24px_-14px_rgba(20,25,43,0.55)] disabled:opacity-60 " +
        (className ?? "")
      }
    >
      {children}
    </motion.button>
  );
}
