import type { Metadata } from "next";

import { DashboardSummary } from "@/components/app/dashboard-summary";
import { ModeProgressCard } from "@/components/app/mode-progress-card";
import { getAllLessons } from "@/lib/content";
import { LEARNING_MODES } from "@/lib/learning-modes";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function LearnDashboardPage() {
  const lessonsByMode = await getAllLessons();
  const totalLessons = LEARNING_MODES.reduce((sum, mode) => sum + lessonsByMode[mode].length, 0);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Pick up where you left off, or start something new.
        </p>
      </div>

      <DashboardSummary totalLessons={totalLessons} />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LEARNING_MODES.map((mode) => (
          <ModeProgressCard key={mode} mode={mode} units={lessonsByMode[mode]} />
        ))}
      </div>
    </div>
  );
}
