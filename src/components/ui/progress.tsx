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
    <div
      data-slot="progress"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("bg-muted relative h-2 w-full overflow-hidden rounded-full", className)}
      {...props}
    >
      <div
        className="bg-primary h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${clamped}%` }}
      />
      {showMarker && (
        <div
          aria-hidden="true"
          className="bg-foreground/60 absolute top-1/2 h-3 w-px -translate-y-1/2 rounded-full transition-[inset-inline-start] duration-500 ease-out"
          style={{ insetInlineStart: `${clampedMarker}%` }}
        />
      )}
    </div>
  );
}

export { Progress };
