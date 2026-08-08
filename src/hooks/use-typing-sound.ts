"use client";

import { useCallback, useRef } from "react";

type SoundVariant = "letter" | "error" | "complete";

interface ToneConfig {
  duration: number;
  frequency: number;
  peakGain: number;
}

const TONES: Record<SoundVariant, ToneConfig> = {
  letter: { duration: 0.12, frequency: 660, peakGain: 0.08 },
  error: { duration: 0.1, frequency: 220, peakGain: 0.05 },
  complete: { duration: 0.4, frequency: 880, peakGain: 0.09 },
};

/**
 * Generates keystroke sounds with the Web Audio API instead of audio assets
 * — a few short oscillator envelopes, no files to ship. `play(variant)` is
 * the whole public surface, so this can be swapped for real audio files
 * later (e.g. HTMLAudioElement playback) without touching the typing engine
 * or any lesson component.
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
        const { duration, frequency, peakGain } = TONES[variant];

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now);
        if (variant === "complete") {
          oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + 0.15);
        }
        if (variant === "error") {
          oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.85, now + duration);
        }

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(peakGain, now + 0.01);
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
