"use client";

import { StreakStrip } from "@/components/app/streak-strip";
import { cn } from "@/lib/utils";

/**
 * The block of optional engagement widgets on the Home dashboard — each one
 * decides for itself (from the admin feature switches, see useFeatures)
 * whether it renders, so this is just their shared column. With every
 * feature off it renders nothing and takes no space.
 */
export function HomeEngagement({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 empty:hidden", className)}>
      <StreakStrip />
    </div>
  );
}
