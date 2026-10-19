import { Check, Lock } from "lucide-react";

import type { Difficulty } from "@/lib/levels";
import { storyMonogram } from "@/lib/story-monogram";
import { TIER_DOT_CLASS } from "@/lib/tier-colors";
import { cn } from "@/lib/utils";

/**
 * The two marks that stand in for a picture on a story's cover (StoryCard and the Home Stories
 * box): the title's first letter as a faint outline in the brand colour, and a bookmark ribbon in
 * the level's colour that carries the lock or the completed check. Both are decorative, the card's
 * link already says what the story is and whether it is locked.
 */
export function StoryMonogram({ title, className }: { title: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-quote pointer-events-none leading-none text-transparent select-none [-webkit-text-stroke:1px_color-mix(in_srgb,var(--primary)_34%,transparent)]",
        className,
      )}
    >
      {storyMonogram(title)}
    </span>
  );
}

export function StoryRibbon({
  difficulty,
  status = null,
  className,
}: {
  difficulty: Difficulty;
  status?: "locked" | "completed" | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex justify-center text-white opacity-90 [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)]",
        TIER_DOT_CLASS[difficulty],
        className,
      )}
    >
      {status === "locked" ? (
        <Lock className="size-3" />
      ) : status === "completed" ? (
        <Check className="size-3" />
      ) : null}
    </span>
  );
}
