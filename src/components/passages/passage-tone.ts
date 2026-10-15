import type { PassageTone } from "@/lib/passages/types";

/**
 * One colour per mood, from the palette the app already uses elsewhere (sky,
 * violet, an ember-orange for the warm one) — never yellow or amber. Each tone
 * gives the card's icon tile, its small label, and the thin accent a spoken
 * character name takes in the reader, so a learner learns "orange is the
 * funny one" without a legend.
 */
export interface PassageToneStyle {
  /** The rounded icon tile on a card and on the reader's title row. */
  tile: string;
  /** The small mood label. */
  chip: string;
  /** A character's name above a spoken line. */
  speaker: string;
}

export const PASSAGE_TONE_STYLES: Record<PassageTone, PassageToneStyle> = {
  funny: {
    tile: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    chip: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
    speaker: "text-orange-600 dark:text-orange-400",
  },
  serious: {
    tile: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    chip: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
    speaker: "text-sky-600 dark:text-sky-400",
  },
  inspiring: {
    tile: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    chip: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    speaker: "text-violet-600 dark:text-violet-400",
  },
};
