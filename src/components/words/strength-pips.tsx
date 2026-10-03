"use client";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

/**
 * A word's strength (0-5) as five small bars: filled up to the strength, in the
 * word's band color. The accessible name carries the number, so the bars are
 * decorative.
 */
export function StrengthPips({
  strength,
  max = 5,
  className,
  barClassName = "bg-primary",
}: {
  strength: number;
  max?: number;
  className?: string;
  /** Color of the filled bars. */
  barClassName?: string;
}) {
  const { t } = useLocale();
  return (
    <span
      role="img"
      aria-label={t.wordLists.redesign.strengthAria.replace("{n}", String(strength))}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {Array.from({ length: max }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={cn(
            "h-1.5 w-3 rounded-full",
            index < strength ? barClassName : "bg-muted-foreground/20",
          )}
        />
      ))}
    </span>
  );
}
