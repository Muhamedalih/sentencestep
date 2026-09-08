import { cn } from "@/lib/utils";

/**
 * A single pulsing placeholder block — formalizes the `bg-muted h-X w-X
 * animate-pulse rounded` idiom already hand-written throughout the app
 * (HomeHero, LessonListView, HomeSummary, ModeProgressCard) into one
 * shared primitive, so route-level loading.tsx skeletons (see
 * src/app/learn/(dashboard)/loading.tsx and its siblings) don't each
 * reinvent it. Purely presentational — every consumer already wraps its own
 * usage in `aria-hidden="true"`, matching how those hand-written pulses did.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-muted animate-pulse rounded-md", className)} />;
}
