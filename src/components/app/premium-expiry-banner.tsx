"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarClock, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { MIN_STREAK_TO_MENTION, calendarDaysUntil } from "@/lib/billing/expiry-reminders";
import { liveStreakDays, todayLocalISODate } from "@/lib/progress/streak";
import { cn } from "@/lib/utils";

const DISMISSED_KEY = "sentencestep:expiryBannerDismissed:v1";

function readDismissedFor(): string | null {
  try {
    return window.localStorage.getItem(DISMISSED_KEY);
  } catch {
    return null;
  }
}

function markDismissedFor(endDate: string): void {
  try {
    window.localStorage.setItem(DISMISSED_KEY, endDate);
  } catch {
    // Best-effort only — worst case the banner shows again on the next visit.
  }
}

/**
 * A quiet, dismissible note on Home in the last week of a paid Premium period:
 * when it ends, that days added now stack on top of what is left, and, only
 * when there is a real streak of three or more days, that it can keep going.
 * The server only mounts it for a dated paid period inside the window, never
 * for the sitewide free-access promotion. Dismissal is remembered for that end
 * date only, so buying more days (a new end date) makes it eligible again.
 * Starts hidden and decides after mount, so the server render and the browser
 * agree and the wording uses the learner's own calendar day.
 */
export function PremiumExpiryBanner({ endsAt, className }: { endsAt: string; className?: string }) {
  const { t } = useLocale();
  const { isLoaded, streak } = useSharedProgress();
  const [daysAhead, setDaysAhead] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(endsAt);
    if (Number.isNaN(end.getTime()) || end.getTime() <= Date.now()) return;
    if (readDismissedFor() === endsAt.slice(0, 10)) return;
    setDaysAhead(calendarDaysUntil(end, new Date()));
  }, [endsAt]);

  if (daysAhead === null || !isLoaded) return null;

  const title =
    daysAhead <= 0
      ? t.premium.expiryBannerTitleToday
      : daysAhead === 1
        ? t.premium.expiryBannerTitleTomorrow
        : daysAhead === 2
          ? t.premium.expiryBannerTitleTwoDays
          : t.premium.expiryBannerTitleDays.replace("{days}", String(daysAhead));

  const liveStreak = liveStreakDays(streak, todayLocalISODate());
  const body =
    liveStreak >= MIN_STREAK_TO_MENTION
      ? t.premium.expiryBannerStreakBody.replace("{streak}", String(liveStreak))
      : t.premium.expiryBannerBody;

  return (
    <div
      role="status"
      className={cn(
        "border-border bg-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="bg-brand-muted text-primary flex size-9 shrink-0 items-center justify-center rounded-xl">
          <CalendarClock className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-muted-foreground text-xs">{body}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button size="sm" variant="outline" asChild>
          <Link href="/upgrade">{t.premium.expiryBannerCta}</Link>
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={t.premium.expiryBannerDismiss}
          onClick={() => {
            markDismissedFor(endsAt.slice(0, 10));
            setDaysAhead(null);
          }}
        >
          <X className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
