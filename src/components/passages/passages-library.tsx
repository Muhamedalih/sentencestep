"use client";

import { AudioLines, Headphones } from "lucide-react";

import { LevelBadge } from "@/components/passages/level-badge";
import { PassageCard } from "@/components/passages/passage-card";
import { PassagesAdminBar } from "@/components/passages/passages-admin-bar";
import { useLocale } from "@/components/providers/locale-provider";
import { passageStatus } from "@/lib/passages/progress";
import type { PassageLevel, PassageProgress, PassageSummary } from "@/lib/passages/types";
import { cn } from "@/lib/utils";

const LEVEL_KEYS: Record<PassageLevel, "a1" | "a2" | "b1" | "b2"> = {
  A1: "a1",
  A2: "a2",
  B1: "b1",
  B2: "b2",
};

/**
 * The Passages list: a heading (a "Listening training" tag, the title, one line on how it
 * works), the posters grouped by level, and — for admins
 * only — the preview/publish bar. Levels with nothing in them are not shown at
 * all (no empty "coming soon" boxes). The grid is five posters across on a wide
 * screen, so the ten passages of a level are two tidy rows.
 */
export function PassagesLibrary({
  passages,
  progress,
  upNextId,
  lockedIds,
  adminState,
}: {
  passages: PassageSummary[];
  progress: PassageProgress[];
  /** The passage to point at ("Up next"), or null once everything is done. */
  upNextId: string | null;
  /** The Premium passages this viewer can't open (empty for a subscriber and for an admin). */
  lockedIds: string[];
  /** For an admin: "admin" (preview) or "on" (public). Null for everyone else — they get no bar. */
  adminState: "admin" | "on" | null;
}) {
  const { t, locale } = useLocale();
  const progressById = new Map(progress.map((entry) => [entry.passageId, entry]));

  const levels = [...new Set(passages.map((passage) => passage.level))];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 sm:py-10">
      {adminState && <PassagesAdminBar isPublic={adminState === "on"} />}

      <header className="mb-9">
        {/* Says what the section is for before anything else: it trains the ear. (Arabic joins its letters, so it is never spaced out or capitalised.) */}
        <p
          className={cn(
            "border-primary/25 bg-primary/10 text-primary mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
            locale !== "ar" && "tracking-[0.14em] uppercase",
          )}
        >
          <AudioLines aria-hidden="true" className="size-3.5" />
          {t.passages.eyebrow}
        </p>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {/* Passages are lessons you listen to: the headphones sway slowly beside the title to say so (see .passage-headphones). */}
          <Headphones
            aria-hidden="true"
            className="passage-headphones text-primary size-7 shrink-0 sm:size-9"
          />
          {t.passages.title}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          {t.passages.subtitle}
        </p>
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
            <section key={level} className="mb-12 last:mb-0">
              <div className="border-border mb-6 flex items-center justify-between gap-4 border-b pb-3">
                <h2 className="flex items-center gap-3 text-lg font-semibold">
                  <LevelBadge level={level} />
                  <bdi>{t.passages.levels[LEVEL_KEYS[level]]}</bdi>
                </h2>
                <span className="text-muted-foreground text-sm tabular-nums">
                  {doneCount} / {inLevel.length}
                </span>
              </div>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {inLevel.map((passage) => (
                  <li key={passage.id}>
                    <PassageCard
                      passage={passage}
                      status={passageStatus(progressById.get(passage.id), passage.sectionCount)}
                      isUpNext={passage.id === upNextId}
                      locked={lockedIds.includes(passage.id)}
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
