import type { Difficulty } from "@/lib/levels";

/**
 * The one color per difficulty tier every section shows a tier badge with
 * (Normal Lessons' LessonListView, Stories' StoryCard/StoriesLibrary, Word
 * Lists' WordListsLibrary) — a single shared source so Beginner/
 * Intermediate/Advanced read as the same green/blue/purple progression
 * everywhere, rather than each section inventing its own tier palette (which
 * is how Stories ended up on green/amber/red and Word Lists on
 * green/amber/violet before this module existed). `success` reuses the
 * app's own theme-aware green token; intermediate/advanced use fixed
 * Tailwind palette colors (not CSS variables) since no dedicated
 * "info"/"advanced" theme token exists yet — this also keeps them legible on
 * fixed-dark-surface tiles like StoryCard's, where a desaturated
 * theme-derived brand purple would read as near-invisible.
 */
export const TIER_BADGE_CLASS: Record<Difficulty, string> = {
  beginner: "bg-success/10 text-success border-success/25",
  intermediate: "bg-sky-500/10 text-sky-500 border-sky-500/25",
  advanced: "bg-violet-500/10 text-violet-500 border-violet-500/25",
};

/** Same three colors as TIER_BADGE_CLASS, as a solid fill — for a plain dot or an active-tab underline rather than a tinted pill. */
export const TIER_DOT_CLASS: Record<Difficulty, string> = {
  beginner: "bg-success",
  intermediate: "bg-sky-500",
  advanced: "bg-violet-500",
};

/** Same three colors as TIER_BADGE_CLASS, text-only — for a CEFR code or label with no fill/border of its own. */
export const TIER_TEXT_CLASS: Record<Difficulty, string> = {
  beginner: "text-success",
  intermediate: "text-sky-500",
  advanced: "text-violet-500",
};

/** Same three colors as TIER_BADGE_CLASS, as a ring-inset pill fill — for Word Lists' larger section-header chip. */
export const TIER_RING_CLASS: Record<Difficulty, string> = {
  beginner: "bg-success/15 text-success ring-success/30",
  intermediate: "bg-sky-500/10 text-sky-500 ring-sky-500/30",
  advanced: "bg-violet-500/10 text-violet-500 ring-violet-500/30",
};
