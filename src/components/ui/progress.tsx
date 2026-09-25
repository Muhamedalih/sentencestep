import * as React from "react";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentProps<"div"> {
  value: number;
  /**
   * A second, independent position on the same 0–100 scale as `value`,
   * drawn as a thin static tick rather than a fill — for a bar whose fill
   * tracks where the viewer currently IS (e.g. a book section they've
   * paged back into) while this marks a separate reference point (e.g.
   * their real furthest-read position) on that same scale. Omitted (the
   * default) renders no marker at all; also skipped whenever it lands
   * within half a point of `value` itself, so normal forward progress
   * (where the two coincide) never shows a redundant line sitting right on
   * the fill's own edge.
   */
  markerValue?: number;
}

function Progress({ value, markerValue, className, ...props }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const clampedMarker =
    typeof markerValue === "number" ? Math.min(100, Math.max(0, markerValue)) : undefined;
  const showMarker = clampedMarker !== undefined && clampedMarker - clamped > 0.5;

  return (
    // Marker deliberately lives in THIS outer, unclipped element — the fill
    // bar's own rounding needs overflow-hidden, but the marker needs to
    // stand visibly taller than the bar itself (reader feedback: the first
    // version, clipped flush to the bar's own 8px height, read as too small
    // to notice) — so overflow-hidden is scoped to the inner track below
    // instead of this wrapper.
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative h-2 w-full", className)}
      {...props}
    >
      <div className="bg-muted h-full w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showMarker && (
        <div
          aria-hidden="true"
          className="bg-accent ring-background absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full ring-2 transition-[inset-inline-start] duration-500 ease-out"
          style={{ insetInlineStart: `${clampedMarker}%` }}
        />
      )}
    </div>
  );
}

export { Progress };
