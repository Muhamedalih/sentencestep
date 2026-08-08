"use client";

import { Flame } from "lucide-react";

import { useProgress } from "@/hooks/use-progress";

export function DashboardSummary({ totalLessons }: { totalLessons: number }) {
  const { isLoaded, completions, streak } = useProgress();
  const completed = isLoaded ? completions.length : 0;

  return (
    <div className="text-muted-foreground mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium">
      <span className="inline-flex items-center gap-1.5">
        <Flame
          className={streak.currentStreak > 0 ? "text-accent size-4" : "size-4"}
          aria-hidden="true"
        />
        {streak.currentStreak > 0
          ? `${streak.currentStreak} day streak`
          : "Complete a lesson to start a streak"}
      </span>
      <span>
        {completed} / {totalLessons} lessons complete overall
      </span>
    </div>
  );
}
