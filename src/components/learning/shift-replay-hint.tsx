"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowBigUp } from "lucide-react";

import { usePronunciationSettings } from "@/components/providers/pronunciation-settings-provider";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Purely informational — tells the learner the Shift key replays whatever
 * pronunciation is currently on screen (see PronunciationSettingsProvider's
 * global keyboard shortcut). Never interactive, so it can never steal focus
 * from the typing input. Renders nothing outside a real provider (e.g. the
 * Admin content preview) since the shortcut isn't wired up there.
 *
 * The keycap is a layered CSS construction (gradient surface + inset
 * highlight + a resting "base" shadow line + a soft drop shadow), not an
 * image or icon font — chosen so it stays crisp at any size and adapts to
 * light/dark automatically via the existing --border/--card/--secondary
 * tokens, the same way every other themed surface in this app does.
 *
 * `className` lets a caller nudge this pill's own fixed position (Book
 * Reading pushes it a little further toward the bottom edge, per reader
 * feedback) without touching the shared default every other lesson type
 * still gets untouched.
 */
export function ShiftReplayHint({ className }: { className?: string } = {}) {
  const { isActive, shiftPulse } = usePronunciationSettings();
  const { dir, t } = useLocale();
  const [isPressed, setIsPressed] = useState(false);
  const isFirstPulseRef = useRef(true);

  // Briefly flips the keycap into its "pressed" state whenever a real
  // standalone Shift press actually triggers a replay (see shiftPulse's doc
  // comment) — skips the initial mount so the key doesn't animate before
  // the learner has touched anything.
  useEffect(() => {
    if (isFirstPulseRef.current) {
      isFirstPulseRef.current = false;
      return;
    }
    setIsPressed(true);
    const timer = window.setTimeout(() => setIsPressed(false), 130);
    return () => window.clearTimeout(timer);
  }, [shiftPulse]);

  if (!isActive) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "border-border/50 bg-background/80 pointer-events-none fixed right-4 bottom-4 z-30 flex items-center gap-2.5 rounded-2xl border py-1.5 pr-3.5 pl-1.5 shadow-sm backdrop-blur-md select-none sm:right-6 sm:bottom-6",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex h-8 min-w-[3.4rem] items-center justify-center gap-1 rounded-[7px] border px-2.5",
          "border-border/70 from-card to-secondary text-foreground bg-gradient-to-b",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45),0_1px_0_0_var(--border),0_3px_5px_-2px_rgba(0,0,0,0.35)]",
          "transition-[transform,box-shadow] duration-100 ease-out",
          isPressed
            ? "translate-y-[2px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_0px_0_0_var(--border),0_1px_2px_-1px_rgba(0,0,0,0.3)]"
            : "translate-y-0",
        )}
      >
        <ArrowBigUp className="size-3.5 opacity-80" aria-hidden="true" />
        <span className="text-[10.5px] font-semibold tracking-wide">Shift</span>
      </div>
      <span dir={dir} className="text-muted-foreground text-xs font-medium">
        {t.pronunciation.replayHint}
      </span>
    </div>
  );
}
