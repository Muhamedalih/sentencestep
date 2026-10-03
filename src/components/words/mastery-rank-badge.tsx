"use client";

import { Medal } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";
import type { MasteryRank } from "@/lib/word-mastery/dashboard";

type EarnedRank = Exclude<MasteryRank, "none">;

/**
 * Metal colors, fixed rather than themed: a bronze, silver or gold rank must
 * read as that metal in both light and dark. Tinted fill, ring and a medal in
 * the metal's own tone — a rank, not a party popper.
 */
const RANK_CLASS: Record<EarnedRank, string> = {
  bronze: "bg-[oklch(0.62_0.1_55)]/15 text-[oklch(0.58_0.1_55)] ring-[oklch(0.62_0.1_55)]/35",
  silver: "bg-[oklch(0.75_0.01_250)]/20 text-[oklch(0.58_0.02_250)] ring-[oklch(0.7_0.02_250)]/40",
  gold: "bg-[oklch(0.82_0.15_85)]/20 text-[oklch(0.62_0.14_80)] ring-[oklch(0.8_0.15_85)]/45",
};

/** Whether a rank has been earned yet (the badge shows nothing for "none" unless asked to). */
export function isEarnedRank(rank: MasteryRank): rank is EarnedRank {
  return rank !== "none";
}

/**
 * The mastery rank of a topic as a small chip: a medal in the rank's metal and
 * its name (Bronze / Silver / Gold). Renders nothing for "none" — a topic with
 * no rank yet shows no chip rather than an empty one.
 */
export function MasteryRankBadge({
  rank,
  size = "sm",
  className,
}: {
  rank: MasteryRank;
  size?: "sm" | "md";
  className?: string;
}) {
  const { t, dir } = useLocale();
  if (!isEarnedRank(rank)) return null;

  const names: Record<EarnedRank, string> = {
    bronze: t.wordLists.redesign.rankBronze,
    silver: t.wordLists.redesign.rankSilver,
    gold: t.wordLists.redesign.rankGold,
  };

  return (
    <span
      dir={dir}
      title={`${t.wordLists.redesign.rankTitle}: ${names[rank]}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold ring-1 ring-inset",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-sm",
        RANK_CLASS[rank],
        className,
      )}
    >
      <Medal className={size === "sm" ? "size-3" : "size-4"} aria-hidden="true" />
      {names[rank]}
    </span>
  );
}
