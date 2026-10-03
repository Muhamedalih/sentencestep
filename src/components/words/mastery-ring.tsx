import type { ReactNode } from "react";

import { ringFractions } from "@/lib/word-mastery/dashboard";
import type { Bands } from "@/lib/word-mastery/dashboard";
import { cn } from "@/lib/utils";

/**
 * A mastery ring: one circle split into the three bands of a set of words —
 * mastered (green), learning (the brand color) and new (the faint track),
 * drawn clockwise from the top. It is the redesigned Word Lists' replacement
 * for the old grey progress bar and for celebration icons: the figure itself
 * says how far along the learner is.
 *
 * Pure SVG with no client state (the arcs ease in with a CSS transition on
 * stroke-dasharray, switched off for reduced motion), so it renders in Server
 * and Client Components alike. `children` sits in the middle (a number, an
 * icon). The ring is decorative unless `label` is given.
 */
export function MasteryRing({
  bands,
  size = 56,
  stroke = 6,
  label,
  className,
  children,
}: {
  bands: Bands;
  /** Outer diameter in px. */
  size?: number;
  /** Ring thickness in px. */
  stroke?: number;
  /** Accessible name; without it the ring is hidden from assistive technology. */
  label?: string;
  className?: string;
  children?: ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fractions = ringFractions(bands);

  // Arcs are laid end to end: each starts where the previous one stopped.
  const arcs = [
    { key: "mastered", fraction: fractions.mastered, className: "text-success" },
    { key: "learning", fraction: fractions.learning, className: "text-primary" },
  ] as const;
  let offset = 0;

  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted-foreground/20"
        />
        {arcs.map((arc) => {
          const length = arc.fraction * circumference;
          const start = offset;
          offset += length;
          if (length <= 0) return null;
          return (
            <circle
              key={arc.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={stroke}
              strokeLinecap="butt"
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-start}
              className={cn(
                arc.className,
                "transition-[stroke-dasharray,stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none",
              )}
            />
          );
        })}
      </svg>
      {children !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  );
}
