"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
 * `below` (Book Reading's instruction stack) lets a caller stack one more
 * line of purely informational hint text directly under the Shift pill,
 * sharing this exact bottom-right anchor, gap, and non-interactive/
 * aria-hidden treatment, rather than a second screen inventing its own
 * fixed-position wrapper next to this one. Every existing caller (main
 * lessons, Fix Your Mistakes, Word Lists) omits it and renders byte-for-byte
 * as before. Unlike the Shift pill itself, `below` is NOT gated on
 * `isActive` — it stays visible even where Shift-replay isn't (e.g. no
 * voice resolved), matching Book Reading's click-hint having always been
 * unconditional before this component started rendering it.
 */
export function ShiftReplayHint({ below }: { below?: ReactNode } = {}) {
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

  if (!isActive && !below) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-4 bottom-4 z-30 flex flex-col items-end gap-2 select-none sm:right-6 sm:bottom-6"
    >
      {isActive && (
        <div className="border-border/50 bg-background/80 flex items-center gap-2.5 rounded-2xl border py-1.5 pr-3.5 pl-1.5 shadow-sm backdrop-blur-md">
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
      )}
      {below}
    </div>
  );
}
