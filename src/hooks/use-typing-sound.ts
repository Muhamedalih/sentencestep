"use client";

import { useCallback, useRef } from "react";

type SoundVariant = "letter" | "complete";

/**
 * Generates the correct-keystroke sound with the Web Audio API instead of an
 * audio asset — a couple of short oscillator envelopes, no file to ship.
 */
export function useTypingSound() {
  const contextRef = useRef<AudioContext | undefined>(undefined);

  const getContext = useCallback(() => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    if (contextRef.current.state === "suspended") {
      void contextRef.current.resume();
    }
    return contextRef.current;
  }, []);

  const play = useCallback(
    (variant: SoundVariant = "letter") => {
      try {
        const ctx = getContext();
        const now = ctx.currentTime;
        const duration = variant === "complete" ? 0.4 : 0.15;
        const frequency = variant === "complete" ? 880 : 660;

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now);
        if (variant === "complete") {
          oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + 0.15);
        }

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(now);
        oscillator.stop(now + duration + 0.05);
      } catch {
        // Audio can be blocked by the browser (e.g. no user gesture yet); a
        // missed sound cue isn't worth surfacing an error for.
      }
    },
    [getContext],
  );

  return { play };
}
