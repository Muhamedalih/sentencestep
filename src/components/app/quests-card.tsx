"use client";

import { CheckCircle2, Target } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { Progress } from "@/components/ui/progress";
import { questTitle } from "@/lib/features/quest-labels";
import { questProgressPercent } from "@/lib/features/quests";
import type { DailyQuest, DailyQuestsPayload } from "@/lib/features/quests";
import { cn } from "@/lib/utils";

/**
 * Presentational half of the quests card — everything it draws comes in as
 * props, so it can be exercised with fake data.
 */
export function QuestsCardView({
  quests,
  allDone,
  className,
}: {
  quests: DailyQuest[];
  allDone: boolean;
  className?: string;
}) {
  const { t, dir } = useLocale();
  return (
    <section
      aria-label={t.quests.heading}
      className={cn("border-border/60 bg-card/60 rounded-2xl border p-4 sm:p-5", className)}
    >
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Target className="text-accent size-4" aria-hidden="true" />
        <span dir={dir}>{t.quests.heading}</span>
      </h2>
      <ul className="flex flex-col gap-3.5">
        {quests.map((quest) => (
          <li key={quest.slot} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                quest.completed ? "text-success" : "text-muted-foreground/50",
              )}
              aria-hidden="true"
            >
              <CheckCircle2 className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p
                  dir={dir}
                  className={cn(
                    "truncate text-sm font-medium",
                    quest.completed && "text-muted-foreground line-through",
                  )}
                >
                  {questTitle(t, quest.type)}
                </p>
                <span className="text-accent shrink-0 text-xs font-semibold" dir="ltr">
                  {t.quests.xpReward.replace("{xp}", String(quest.xp))}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <Progress value={questProgressPercent(quest)} className="h-1.5 flex-1" />
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums" dir="ltr">
                  {quest.progress} / {quest.target}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {allDone && (
        <p className="text-success mt-4 text-sm font-medium" dir={dir}>
          {t.quests.allDone}
        </p>
      )}
    </section>
  );
}

/**
 * Home's daily quests card (admin feature "Daily quests"): today's three
 * quests with live progress. They are loaded with the page (see
 * loadHomeEngagement) — null when quests aren't open to this visitor or
 * couldn't be loaded, in which case nothing renders.
 */
export function QuestsCard({
  payload,
  className,
}: {
  payload: DailyQuestsPayload | null;
  className?: string;
}) {
  if (!payload) return null;
  return <QuestsCardView quests={payload.quests} allDone={payload.allDone} className={className} />;
}
