"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Flame, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { useSharedProgress } from "@/components/providers/progress-provider";
import { cn } from "@/lib/utils";

const DISMISSED_KEY = "looma:guestBannerDismissed:v1";

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function markDismissed(): void {
  try {
    window.localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // Best-effort only — worst case the banner can show again later.
  }
}

/**
 * A dismissible, low-pressure reminder on the Home dashboard that a guest's
 * streak/XP only live in this browser's localStorage. Only ever shown once
 * there's real progress worth protecting (`completions.length > 0`), never
 * to a brand-new visitor who just landed — the opening lesson's own
 * OnboardingLessonComplete screen already makes that pitch once, right when
 * it happens. Signing up here loses nothing already built: the same
 * guest→account migration useProgress's sign-in effect always runs
 * (guest-migration.ts) picks up whatever's in localStorage automatically.
 * Dismissal is permanent per browser, same "never nag twice" choice as
 * rating-storage.ts's hasRatedApp/markRatedApp — a snooze would just be this
 * component re-litigating a decision the learner already made.
 */
export function GuestProgressBanner({
  isGuest,
  className,
}: {
  isGuest: boolean;
  className?: string;
}) {
  const { t } = useLocale();
  const { isLoaded, streak, completions } = useSharedProgress();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  if (!isGuest || !isLoaded || dismissed || completions.length === 0) return null;

  const days = streak.currentStreak;
  const title =
    days > 1
      ? t.guestBanner.titlePlural.replace("{n}", String(days))
      : days === 1
        ? t.guestBanner.titleSingular
        : t.guestBanner.titleFallback;

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
          <Flame className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="text-muted-foreground text-xs">{t.guestBanner.subtitle}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button size="sm" variant="outline" asChild>
          <Link href="/register">{t.guestBanner.cta}</Link>
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={t.guestBanner.dismissAria}
          onClick={() => {
            markDismissed();
            setDismissed(true);
          }}
        >
          <X className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
