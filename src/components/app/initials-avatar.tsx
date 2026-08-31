"use client";

import { cn, stableIndex } from "@/lib/utils";

/**
 * The account identity avatar — a plain initial on a solid color, in the
 * same spirit as Notion/Linear/GitHub/Slack's default avatars, replacing
 * the earlier curated animal-sticker picker (header/account-menu redesign,
 * round 2): the two visual languages never matched — bright cartoon
 * mascots next to this app's otherwise plain typographic wordmark. Nothing
 * to pick any more, no state to persist — the color is a deterministic
 * hash of the learner's own id, so it's stable across sessions/devices for
 * free, and two learners only ever share a color by coincidence, not by
 * both defaulting to slot #1 the way the old picker's default did.
 */
const PALETTE = [
  "bg-rose-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-teal-500",
  "bg-violet-500",
  "bg-orange-500",
  "bg-fuchsia-500",
  "bg-emerald-500",
] as const;

function colorFor(seed: string): string {
  return PALETTE[stableIndex(seed, PALETTE.length)]!;
}

function initialFor(displayName: string | null, email: string): string {
  const source = displayName?.trim() || email;
  return source.charAt(0).toUpperCase() || "?";
}

export function InitialsAvatar({
  seed,
  displayName,
  email,
  className,
  /** 0-100 — when set, draws a thin ring around the avatar filled to this percent (the daily goal, see AccountMenu/AppHeader) instead of a plain flat circle. Omitted entirely (not a 0% ring) when there's nothing meaningful to show yet. */
  ringPercent,
}: {
  /** Stable identity to hash for the background color — the user id, never the (editable) display name, so the color never changes just because someone updates their name. */
  seed: string;
  displayName: string | null;
  email: string;
  className?: string;
  ringPercent?: number;
}) {
  const initial = initialFor(displayName, email);
  const bg = colorFor(seed);

  const avatar = (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white select-none",
        bg,
        className,
      )}
    >
      {initial}
    </span>
  );

  if (ringPercent === undefined) return avatar;

  // A slightly oversized SVG ring wrapping the avatar (Apple Watch-style
  // activity ring) rather than a border on the avatar itself, so the ring's
  // own stroke width never eats into the avatar's actual circle/eclipses
  // the initial.
  const clamped = Math.max(0, Math.min(100, ringPercent));
  const r = 47;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clamped / 100);

  return (
    // Padded relative to the avatar itself, so the ring (filling this whole
    // box) sits with a visible gap around the avatar's edge rather than
    // overlapping it — Apple Watch activity-ring style, not an
    // Instagram-story edge-hugging ring.
    <span className="relative inline-flex items-center justify-center p-[3px]">
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full -rotate-90"
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="6" className="stroke-border/60" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-accent transition-[stroke-dashoffset] duration-500 ease-out"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {avatar}
    </span>
  );
}
