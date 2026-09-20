import type { Difficulty } from "@/lib/levels";

/**
 * The one color per difficulty tier every section shows a tier badge with
 * (Normal Lessons' LessonListView, Stories' StoryCard/StoriesLibrary, Word
 * Lists' WordGroupCard/WordListsLibrary) — a single shared source so
 * Beginner/Intermediate/Advanced read as the same green/blue/purple
 * progression everywhere, rather than each section inventing its own tier
 * palette (which is how Stories ended up on green/amber/red and Word Lists
 * on green/amber/violet before this module existed). `success` reuses the
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

/**
 * Same three colors as TIER_BADGE_CLASS, as a tinted-fill/icon-color pair —
 * for the icon badge on a Stories or Word List poster tile (see StoryCard
 * and WordGroupCard). Replaces two things that used to disagree: StoryCard's
 * old per-lesson random 3-hue accent (unrelated to the lesson's actual
 * difficulty) and WordGroupCard's old TIER_TINT (green/accent-amber/primary,
 * which put the app's amber "achievement" color on Intermediate — a color
 * this project deliberately avoids as a UI accent). Both cards now derive
 * their icon-badge color from this one map, so the same level reads as the
 * same color in both sections.
 */
export const TIER_ICON_CLASS: Record<Difficulty, string> = {
  beginner: "bg-success/15 text-success",
  intermediate: "bg-sky-500/15 text-sky-500",
  advanced: "bg-violet-500/15 text-violet-500",
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
