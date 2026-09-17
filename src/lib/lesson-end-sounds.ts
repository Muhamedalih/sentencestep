/**
 * Pure lesson-end sound data — no "use client" directive, no Web Audio calls
 * — mirrors src/lib/sentence-complete-sounds.ts's split so both the
 * client-only hook (src/hooks/use-typing-sound.ts) and server-safe modules
 * (src/lib/admin/typing-sound-settings.ts) can share the same names/labels/
 * defaults without a server module ever pulling in client-only code.
 *
 * Distinct from SENTENCE_COMPLETE_SOUNDS: this plays exactly once, when the
 * whole lesson finishes (LessonSession's isComplete transition), not once
 * per sentence — so these are longer, more celebratory sounds than any
 * single sentence-completion cue. Reuses CompleteSoundStep (tone/noise
 * steps) from sentence-complete-sounds.ts rather than redefining the same
 * shape.
 */

import type { CompleteSoundStep } from "@/lib/sentence-complete-sounds";

export type LessonEndSound = "fanfare" | "victory" | "crowd" | "starBurst" | "grandChime";

/**
 * Five hand-tuned, whole-lesson-completion sounds, all synthesized with the
 * Web Audio API (see CompleteSoundStep) — no audio assets to ship, decode,
 * or cache. Each is longer and more festive than any SENTENCE_COMPLETE_SOUNDS
 * entry, since this fires once per lesson rather than once per sentence.
 */
export const LESSON_END_SOUNDS: Record<LessonEndSound, CompleteSoundStep[]> = {
  /** A rising major triad landing on an octave — brassy and ceremonial. */
  fanfare: [
    {
      kind: "tone",
      type: "sawtooth",
      frequency: 523.25,
      duration: 0.16,
      peakGain: 0.05,
      startOffset: 0,
    },
    {
      kind: "tone",
      type: "sawtooth",
      frequency: 659.25,
      duration: 0.16,
      peakGain: 0.055,
      startOffset: 0.12,
    },
    {
      kind: "tone",
      type: "sawtooth",
      frequency: 783.99,
      duration: 0.18,
      peakGain: 0.06,
      startOffset: 0.24,
    },
    {
      kind: "tone",
      type: "sawtooth",
      frequency: 1046.5,
      duration: 0.42,
      peakGain: 0.09,
      startOffset: 0.38,
    },
  ],
  /** A playful five-note ascending run that lands and settles — energetic rather than solemn. */
  victory: [
    {
      kind: "tone",
      type: "triangle",
      frequency: 587.33,
      duration: 0.1,
      peakGain: 0.07,
      startOffset: 0,
    },
    {
      kind: "tone",
      type: "triangle",
      frequency: 659.25,
      duration: 0.1,
      peakGain: 0.07,
      startOffset: 0.08,
    },
    {
      kind: "tone",
      type: "triangle",
      frequency: 783.99,
      duration: 0.1,
      peakGain: 0.07,
      startOffset: 0.16,
    },
    {
      kind: "tone",
      type: "triangle",
      frequency: 987.77,
      duration: 0.12,
      peakGain: 0.08,
      startOffset: 0.24,
    },
    {
      kind: "tone",
      type: "triangle",
      frequency: 1318.5,
      duration: 0.32,
      peakGain: 0.1,
      startOffset: 0.34,
    },
  ],
  /** A soft round of applause — three overlapping filtered-noise bursts sweeping upward; textural, not musical. */
  crowd: [
    {
      kind: "noise",
      duration: 0.5,
      peakGain: 0.08,
      startOffset: 0,
      filterFrom: 900,
      filterTo: 2600,
      filterQ: 0.5,
    },
    {
      kind: "noise",
      duration: 0.45,
      peakGain: 0.06,
      startOffset: 0.12,
      filterFrom: 1400,
      filterTo: 3200,
      filterQ: 0.6,
    },
    {
      kind: "noise",
      duration: 0.3,
      peakGain: 0.05,
      startOffset: 0.3,
      filterFrom: 1800,
      filterTo: 3600,
      filterQ: 0.7,
    },
  ],
  /** A cascading run of high notes — richer and longer than the per-sentence "sparkle". */
  starBurst: [
    {
      kind: "tone",
      type: "sine",
      frequency: 1046.5,
      duration: 0.1,
      peakGain: 0.055,
      startOffset: 0,
    },
    {
      kind: "tone",
      type: "sine",
      frequency: 1318.5,
      duration: 0.1,
      peakGain: 0.055,
      startOffset: 0.05,
    },
    {
      kind: "tone",
      type: "sine",
      frequency: 1567.98,
      duration: 0.1,
      peakGain: 0.06,
      startOffset: 0.1,
    },
    {
      kind: "tone",
      type: "sine",
      frequency: 2093,
      duration: 0.14,
      peakGain: 0.065,
      startOffset: 0.15,
    },
    {
      kind: "tone",
      type: "sine",
      frequency: 1567.98,
      duration: 0.3,
      peakGain: 0.07,
      startOffset: 0.24,
    },
  ],
  /** A deep fundamental plus a bright overtone, held longer than "bell"/"chime" — a full, resonant close. */
  grandChime: [
    {
      kind: "tone",
      type: "triangle",
      frequency: 392,
      duration: 0.6,
      peakGain: 0.07,
      startOffset: 0,
    },
    {
      kind: "tone",
      type: "sine",
      frequency: 783.99,
      duration: 0.5,
      peakGain: 0.06,
      startOffset: 0.04,
    },
    {
      kind: "tone",
      type: "sine",
      frequency: 1174.66,
      duration: 0.4,
      peakGain: 0.04,
      startOffset: 0.1,
    },
  ],
};

export const LESSON_END_SOUND_NAMES = Object.keys(LESSON_END_SOUNDS) as LessonEndSound[];

export const LESSON_END_SOUND_LABELS: Record<LessonEndSound, string> = {
  fanfare: "Fanfare",
  victory: "Victory",
  crowd: "Crowd cheer",
  starBurst: "Star burst",
  grandChime: "Grand chime",
};

export const DEFAULT_LESSON_END_SOUND: LessonEndSound = "fanfare";
