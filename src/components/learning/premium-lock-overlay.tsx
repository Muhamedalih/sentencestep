"use client";

import { Lock } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

/**
 * The locked-card treatment shared by StoryCard, HomeLessonCard and
 * lesson-list-view's LessonCard: a very light frosted veil over the cover
 * image plus one small centered "Premium" chip, so a locked lesson reads as
 * "needs a subscription" at a glance while the picture underneath stays
 * recognizable. Deliberately not a heavy blur or a dark scrim — the lesson
 * is still something the learner can see and want.
 *
 * Mount it as a sibling right after the cover image and before any chips,
 * gradients or text that should stay sharp: backdrop-filter only blurs what
 * is painted *behind* it, so DOM order is what keeps the title, the tier
 * badge and the completed check crisp. The parent must be `relative` and
 * `overflow-hidden`. Decorative (aria-hidden) — the card's link already
 * carries t.premium.lockedContentAriaLabel for assistive tech.
 *
 * Fixed dark/translucent chip rather than theme tokens, for the same reason
 * as the other chips that sit on illustrations: it has to stay legible over
 * whatever the cover paints, in either site theme.
 */
export function PremiumLockOverlay({ className }: { className?: string }) {
  const { t, dir } = useLocale();

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10 p-2 backdrop-blur-[2px]",
        className,
      )}
    >
      <span
        dir={dir}
        className="flex max-w-full items-center gap-1.5 rounded-full border border-white/20 bg-black/45 px-3 py-1 text-xs font-semibold tracking-wide text-white shadow-lg shadow-black/20 backdrop-blur-md"
      >
        <Lock className="text-accent size-3.5 shrink-0" />
        <span className="truncate">{t.premium.lockedChip}</span>
      </span>
    </div>
  );
}
