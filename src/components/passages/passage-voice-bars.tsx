import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * The voice drawn as a row of sound-wave bars — the way a voice assistant shows
 * that it is listening or speaking. While the narration plays the bars swing
 * like a speaking voice (each has its own height, speed and starting point, so
 * the row never moves in step, and the middle ones swing the most); paused, they
 * hold where they are; at rest they sit low and dim. The motion is CSS (see
 * `.passage-voice-bar` in globals.css), so it costs nothing per frame and stops
 * for a learner who asked for less motion.
 */

/** `peak` is how tall a bar gets (1 = the full height of the row), `rest` how tall it sits when still, `period` and `delay` (seconds) how fast it swings and where in its swing it starts. */
const BARS = [
  { peak: 0.42, rest: 0.34, period: 1.06, delay: -0.2 },
  { peak: 0.6, rest: 0.46, period: 0.88, delay: -0.55 },
  { peak: 0.8, rest: 0.6, period: 1.12, delay: -0.1 },
  { peak: 0.94, rest: 0.74, period: 0.82, delay: -0.65 },
  { peak: 1, rest: 0.86, period: 0.96, delay: -0.35 },
  { peak: 0.9, rest: 0.7, period: 1.18, delay: -0.8 },
  { peak: 0.74, rest: 0.56, period: 0.9, delay: -0.25 },
  { peak: 0.56, rest: 0.42, period: 1.08, delay: -0.5 },
  { peak: 0.4, rest: 0.32, period: 0.94, delay: -0.05 },
] as const;

export type PassageVoiceState = "idle" | "speaking" | "paused";

export function PassageVoiceBars({
  state,
  className,
}: {
  state: PassageVoiceState;
  className?: string;
}) {
  const engaged = state !== "idle";
  const speaking = state === "speaking";

  return (
    <div
      aria-hidden="true"
      className={cn("flex h-9 items-center justify-center gap-[6px]", className)}
    >
      {BARS.map((bar, index) => (
        <span
          key={index}
          data-engaged={engaged}
          data-speaking={speaking}
          className={cn(
            "passage-voice-bar block h-full w-[5px] rounded-full transition-colors duration-300",
            speaking ? "bg-foreground/80" : engaged ? "bg-foreground/45" : "bg-foreground/25",
          )}
          style={
            {
              "--bar-peak": bar.peak,
              "--bar-rest": bar.rest,
              "--bar-period": `${bar.period}s`,
              "--bar-delay": `${bar.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
