import { BADGE_DEFS } from "@/lib/features/catalog";
import type { BadgeDefinition } from "@/lib/features/catalog";
import { badgeProgress } from "@/lib/features/badges";
import type { BadgeMetrics, BadgeProgress } from "@/lib/features/badges";

export interface BadgeShelfItem {
  badge: BadgeDefinition;
  earned: boolean;
  earnedAt: string | null;
  /** Earned but not yet viewed on the Achievements page — drives the "New" marker. */
  isNew: boolean;
  progress: BadgeProgress;
}

/**
 * The Achievements shelf: every badge the admin has left on (plus any the
 * learner already earned that has since been switched off — earning is never
 * taken back), earned ones first (newest first), then locked ones ordered by
 * how close the learner is. Pure so the ordering is testable.
 */
export function buildBadgeShelf(
  metrics: BadgeMetrics,
  earned: readonly { id: string; earnedAt: string; seen: boolean }[],
  disabled: ReadonlySet<string>,
): BadgeShelfItem[] {
  const earnedById = new Map(earned.map((entry) => [entry.id, entry]));
  const items: BadgeShelfItem[] = [];
  for (const badge of BADGE_DEFS) {
    const entry = earnedById.get(badge.id);
    if (!entry && disabled.has(badge.id)) continue;
    items.push({
      badge,
      earned: entry !== undefined,
      earnedAt: entry?.earnedAt ?? null,
      isNew: entry !== undefined && !entry.seen,
      progress: badgeProgress(badge, metrics, entry !== undefined),
    });
  }
  return items.sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    if (a.earned && b.earned) return (b.earnedAt ?? "").localeCompare(a.earnedAt ?? "");
    return b.progress.fraction - a.progress.fraction;
  });
}
