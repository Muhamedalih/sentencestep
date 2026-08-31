import { Gauge, Target } from "lucide-react";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Compact, secondary status readout — deliberately small and low-contrast
 * (text-muted-foreground) so it never competes with the sentence itself.
 * Values come from useTypingEngine, which already owns every keystroke
 * event this is derived from; this component only formats them.
 *
 * `centered` swaps in Stories mode's variant: centered under the sentence
 * rather than left-aligned, and rendered as two soft pill badges instead of
 * bare icon+text pairs so it reads as a small deliberate readout instead of
 * stray text sitting under the translation line. In that variant, a perfect
 * (rounds to 100%) accuracy badge gets a soft accent glow — a small reward
 * cue, gone the instant a mistake drops it below 100.
 */
export function TypingStats({
  wpm,
  accuracy,
  centered = false,
}: {
  wpm: number;
  accuracy: number;
  centered?: boolean;
}) {
  const { t } = useLocale();
  const isPerfect = centered && Math.round(accuracy) >= 100;

  return (
    <div
      className={cn(
        "text-muted-foreground mt-4 flex items-center gap-4 text-xs font-medium",
        centered && "mt-7 justify-center gap-3 text-sm",
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1.5",
          centered &&
            "border-foreground/10 bg-foreground/5 gap-2 rounded-full border px-4 py-2 font-semibold",
        )}
      >
        <Gauge className={cn("size-3.5", centered && "size-4")} aria-hidden="true" />
        {Math.round(wpm)} {t.lesson.wpmLabel}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1.5",
          centered &&
            "border-foreground/10 bg-foreground/5 gap-2 rounded-full border px-4 py-2 font-semibold",
          isPerfect &&
            "border-[var(--lesson-primary)]/40 bg-[var(--lesson-primary)]/10 text-[var(--lesson-primary)] shadow-[0_0_16px_-2px_var(--lesson-primary)]",
        )}
      >
        <Target className={cn("size-3.5", centered && "size-4")} aria-hidden="true" />
        {Math.round(accuracy)}% {t.lesson.accuracyLabel}
      </span>
    </div>
  );
}
