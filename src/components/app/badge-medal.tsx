import {
  BookOpenCheck,
  Flame,
  Lock,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

import type { BadgeGroup } from "@/lib/features/catalog";
import { cn } from "@/lib/utils";

const GROUP_ICON: Record<BadgeGroup, LucideIcon> = {
  streak: Flame,
  practice: BookOpenCheck,
  speed: Zap,
  level: Trophy,
  words: Sparkles,
  firsts: Star,
  quests: Target,
};

/** One accent per group so the shelf reads as families of badges, not a wall of identical circles. */
const GROUP_TONE: Record<BadgeGroup, string> = {
  streak: "bg-orange-500/15 text-orange-500 ring-orange-500/40",
  practice: "bg-primary/15 text-primary ring-primary/40",
  speed: "bg-yellow-500/15 text-yellow-500 ring-yellow-500/40",
  level: "bg-violet-500/15 text-violet-500 ring-violet-500/40",
  words: "bg-emerald-500/15 text-emerald-500 ring-emerald-500/40",
  firsts: "bg-sky-500/15 text-sky-500 ring-sky-500/40",
  quests: "bg-pink-500/15 text-pink-500 ring-pink-500/40",
};

/**
 * A badge's round medal: its group's icon in the group's tone when earned, a
 * muted padlocked version when not. Presentational only (no hooks), so both
 * the Achievements page (a Server Component) and the lesson-completion
 * celebration can use it.
 */
export function BadgeMedal({
  group,
  earned,
  className,
}: {
  group: BadgeGroup;
  earned: boolean;
  className?: string;
}) {
  const Icon = GROUP_ICON[group];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative flex size-14 shrink-0 items-center justify-center rounded-full ring-2",
        earned ? GROUP_TONE[group] : "bg-muted text-muted-foreground/60 ring-border",
        className,
      )}
    >
      <Icon className="size-7" />
      {!earned && (
        <span className="bg-background ring-border absolute -end-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full ring-1">
          <Lock className="size-3" />
        </span>
      )}
    </span>
  );
}
