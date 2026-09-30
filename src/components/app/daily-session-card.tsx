"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";

import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { Button } from "@/components/ui/button";
import { fetchDailySessionSummaryAction } from "@/lib/features/daily-session-actions";
import type { DailySessionSummary } from "@/lib/features/daily-session-actions";
import { todayLocalISODate } from "@/lib/progress/streak";
import { cn } from "@/lib/utils";

/**
 * Presentational half of the daily session card — props in, markup out, so it
 * can be exercised with fake data.
 */
export function DailySessionCardView({
  summary,
  className,
}: {
  summary: DailySessionSummary;
  className?: string;
}) {
  const { t, dir } = useLocale();
  const done = summary.completedToday;
  return (
    <section
      aria-label={t.dailySession.cardHeading}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 sm:p-6",
        done
          ? "border-success/40 bg-success/5"
          : "border-primary/40 from-primary/15 via-primary/5 bg-gradient-to-br to-transparent",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl",
              done ? "bg-success/15 text-success" : "bg-primary/15 text-primary",
            )}
            aria-hidden="true"
          >
            {done ? <CheckCircle2 className="size-6" /> : <Sparkles className="size-6" />}
          </span>
          <div dir={dir}>
            <h2 className="text-lg font-semibold tracking-tight">{t.dailySession.cardHeading}</h2>
            <p className="text-muted-foreground mt-0.5 text-sm">
              {done
                ? t.dailySession.cardBodyDone
                : t.dailySession.cardBody
                    .replace("{n}", String(summary.ready))
                    .replace("{m}", String(summary.minutes))}
            </p>
            {!done && summary.xpReward > 0 && (
              <p className="text-accent mt-1 text-xs font-semibold" dir="ltr">
                {t.dailySession.reward.replace("{xp}", String(summary.xpReward))}
              </p>
            )}
          </div>
        </div>
        {!done && (
          <Button asChild size="lg">
            <Link href="/learn/session">{t.dailySession.start}</Link>
          </Button>
        )}
      </div>
    </section>
  );
}

/**
 * Home's "Today's session" card (admin feature "Daily session"): how much is
 * ready to review and a one-tap start, or a done-for-today state. Renders
 * nothing unless the feature is open to this visitor, when nothing is ready,
 * and quietly nothing if the summary can't be loaded.
 */
export function DailySessionCard({ className }: { className?: string }) {
  const { dailySession } = useFeatures();
  const [summary, setSummary] = useState<DailySessionSummary | null | undefined>(undefined);
  const enabled = dailySession.enabled;

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetchDailySessionSummaryAction(todayLocalISODate())
      .then((data) => !cancelled && setSummary(data))
      .catch(() => !cancelled && setSummary(null));
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled || summary === null) return null;
  if (summary === undefined) {
    return (
      <div
        className={cn("bg-muted/60 h-28 animate-pulse rounded-2xl", className)}
        aria-hidden="true"
      />
    );
  }
  // Nothing to review and nothing finished today: no card, rather than an empty promise.
  if (summary.ready === 0 && !summary.completedToday) return null;
  return <DailySessionCardView summary={summary} className={className} />;
}
