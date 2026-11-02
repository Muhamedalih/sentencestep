"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useFeatures } from "@/components/providers/feature-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { UpgradeMomentCard } from "@/components/upgrade-moments/upgrade-moment-card";
import { claimUpgradeMoment, trackUpgradeMoment } from "@/lib/upgrade-moments/actions";
import type { ClaimedMoment } from "@/lib/upgrade-moments/actions";
import type { UpgradeMoment } from "@/lib/upgrade-moments/rules";
import { upgradeMomentStrings } from "@/lib/upgrade-moments/strings";

/**
 * The upgrade card at a moment of progress (the "upgradeMoments" permission): the look of the lock
 * screen, drawn over the page once when the learner has just achieved something — the day's tasks,
 * a third day in a row, a story finished outside the tasks. It asks the server first (the once-a-day
 * rule and every other check live there), so it appears only when allowed; «لاحقاً», the close button,
 * Escape and a tap outside all close it, and the close is counted. The lock screens of lessons are
 * not touched by it.
 */
export function UpgradeMomentDialog({
  candidates,
  storyId,
}: {
  candidates: readonly UpgradeMoment[];
  /** For the story card: the story that was just finished (see claimUpgradeMoment). */
  storyId?: string;
}) {
  const open = useFeatures().rollouts.upgradeMoments;
  const { locale } = useLocale();
  const [claimed, setClaimed] = useState<ClaimedMoment | null>(null);
  const key = candidates.join(",");

  useEffect(() => {
    if (!open) return;
    let active = true;
    claimUpgradeMoment(key.split(",") as UpgradeMoment[], storyId)
      .then((result) => {
        if (active && result) setClaimed(result);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [open, key, storyId]);

  const dismiss = useCallback(() => {
    if (!claimed) return;
    void trackUpgradeMoment(claimed.moment, "dismissed");
    setClaimed(null);
  }, [claimed]);

  const buttonRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (!claimed) return;
    buttonRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [claimed, dismiss]);

  if (!claimed) return null;
  return (
    <UpgradeMomentCard
      figures={claimed}
      copy={upgradeMomentStrings(locale)}
      onDismiss={dismiss}
      onUpgrade={() => {
        void trackUpgradeMoment(claimed.moment, "clicked");
      }}
      buttonRef={buttonRef}
    />
  );
}
