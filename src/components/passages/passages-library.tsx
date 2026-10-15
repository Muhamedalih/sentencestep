"use client";

import { Headphones } from "lucide-react";

import { PassageCard } from "@/components/passages/passage-card";
import { PassagesAdminBar } from "@/components/passages/passages-admin-bar";
import { useLocale } from "@/components/providers/locale-provider";
import { passageStatus } from "@/lib/passages/progress";
import type { PassageLevel, PassageProgress, PassageSummary } from "@/lib/passages/types";

const LEVEL_KEYS: Record<PassageLevel, "a1" | "a2" | "b1" | "b2"> = {
  A1: "a1",
  A2: "a2",
  B1: "b1",
  B2: "b2",
};

/**
 * The Passages list: a heading, the cards grouped by level, and — for admins
 * only — the preview/publish bar. Levels with nothing in them are not shown at
 * all (no empty "coming soon" boxes).
 */
export function PassagesLibrary({
  passages,
  progress,
  upNextId,
  adminState,
}: {
  passages: PassageSummary[];
  progress: PassageProgress[];
  /** The passage to point at ("Up next"), or null once everything is done. */
  upNextId: string | null;
  /** For an admin: "admin" (preview) or "on" (public). Null for everyone else — they get no bar. */
  adminState: "admin" | "on" | null;
}) {
  const { t } = useLocale();
  const progressById = new Map(progress.map((entry) => [entry.passageId, entry]));

  const levels = [...new Set(passages.map((passage) => passage.level))];

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
      {adminState && <PassagesAdminBar isPublic={adminState === "on"} />}

      <header className="mb-8 flex items-start gap-4">
        <span className="bg-brand-muted text-primary flex size-12 shrink-0 items-center justify-center rounded-2xl">
          <Headphones className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t.passages.title}</h1>
          <p className="text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
            {t.passages.subtitle}
          </p>
        </div>
      </header>

      {passages.length === 0 ? (
        <div className="border-border rounded-2xl border border-dashed px-6 py-14 text-center">
          <p className="font-medium">{t.passages.emptyHeading}</p>
          <p className="text-muted-foreground mt-1 text-sm">{t.passages.emptyBody}</p>
        </div>
      ) : (
        levels.map((level) => {
          const inLevel = passages.filter((passage) => passage.level === level);
          const doneCount = inLevel.filter(
            (passage) =>
              passageStatus(progressById.get(passage.id), passage.sectionCount) === "done",
          ).length;
          return (
            <section key={level} className="mb-10 last:mb-0">
              <div className="border-border mb-5 flex items-baseline justify-between gap-4 border-b pb-3">
                <h2 className="flex items-baseline gap-2.5 text-lg font-semibold">
                  <span className="text-primary font-bold">{level}</span>
                  <bdi>{t.passages.levels[LEVEL_KEYS[level]]}</bdi>
                </h2>
                <span className="text-muted-foreground text-sm tabular-nums">
                  {doneCount} / {inLevel.length}
                </span>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inLevel.map((passage) => (
                  <li key={passage.id}>
                    <PassageCard
                      passage={passage}
                      status={passageStatus(progressById.get(passage.id), passage.sectionCount)}
                      isUpNext={passage.id === upNextId}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </div>
  );
}
