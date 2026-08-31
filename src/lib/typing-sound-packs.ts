/**
 * Pure typing-sound pack data — no "use client" directive, no Web Audio
 * calls — so both the client-only hook (src/hooks/use-typing-sound.ts) and
 * server-safe modules (src/lib/admin/typing-sound-settings.ts and anything
 * that imports it) can share the same pack names/labels/defaults without a
 * server module ever pulling in client-only code.
 */

export type SoundVariant = "letter" | "error" | "complete";

export type SoundPack =
  "soft" | "gentle" | "minimal" | "click" | "pop" | "bubble" | "typewriter" | "premium";

export interface ToneConfig {
  type: OscillatorType;
  duration: number;
  frequency: number;
  peakGain: number;
}

/**
 * Seven hand-tuned oscillator/envelope presets, all synthesized with the Web
 * Audio API — no audio files to ship, decode, or cache, and zero network
 * requests per keystroke. Each pack keeps the same three variants
 * (letter/error/complete) so swapping packs never changes the calling
 * contract in lesson-session.tsx.
 */
export const SOUND_PACKS: Record<SoundPack, Record<SoundVariant, ToneConfig>> = {
  soft: {
    letter: { type: "sine", duration: 0.12, frequency: 660, peakGain: 0.08 },
    error: { type: "sine", duration: 0.1, frequency: 220, peakGain: 0.05 },
    complete: { type: "sine", duration: 0.4, frequency: 880, peakGain: 0.09 },
  },
  gentle: {
    letter: { type: "sine", duration: 0.1, frequency: 520, peakGain: 0.06 },
    error: { type: "sine", duration: 0.12, frequency: 200, peakGain: 0.045 },
    complete: { type: "sine", duration: 0.45, frequency: 780, peakGain: 0.08 },
  },
  minimal: {
    letter: { type: "sine", duration: 0.05, frequency: 900, peakGain: 0.04 },
    error: { type: "sine", duration: 0.06, frequency: 260, peakGain: 0.032 },
    complete: { type: "sine", duration: 0.28, frequency: 1000, peakGain: 0.055 },
  },
  click: {
    letter: { type: "square", duration: 0.025, frequency: 1400, peakGain: 0.03 },
    error: { type: "square", duration: 0.05, frequency: 180, peakGain: 0.04 },
    complete: { type: "square", duration: 0.22, frequency: 900, peakGain: 0.065 },
  },
  pop: {
    letter: { type: "triangle", duration: 0.08, frequency: 740, peakGain: 0.08 },
    error: { type: "triangle", duration: 0.09, frequency: 210, peakGain: 0.05 },
    complete: { type: "triangle", duration: 0.4, frequency: 950, peakGain: 0.09 },
  },
  bubble: {
    letter: { type: "sine", duration: 0.14, frequency: 500, peakGain: 0.07 },
    error: { type: "sine", duration: 0.12, frequency: 190, peakGain: 0.045 },
    complete: { type: "sine", duration: 0.5, frequency: 700, peakGain: 0.09 },
  },
  typewriter: {
    letter: { type: "square", duration: 0.02, frequency: 1800, peakGain: 0.045 },
    error: { type: "square", duration: 0.08, frequency: 150, peakGain: 0.06 },
    complete: { type: "square", duration: 0.18, frequency: 1200, peakGain: 0.08 },
  },
  premium: {
    letter: { type: "sine", duration: 0.11, frequency: 720, peakGain: 0.07 },
    error: { type: "sine", duration: 0.1, frequency: 230, peakGain: 0.045 },
    complete: { type: "sine", duration: 0.5, frequency: 920, peakGain: 0.1 },
  },
};

export const SOUND_PACK_NAMES = Object.keys(SOUND_PACKS) as SoundPack[];

export const SOUND_PACK_LABELS: Record<SoundPack, string> = {
  soft: "Soft",
  gentle: "Gentle",
  minimal: "Minimal",
  click: "Click",
  pop: "Pop",
  bubble: "Bubble",
  typewriter: "Typewriter",
  premium: "Premium",
};

export const DEFAULT_SOUND_PACK: SoundPack = "soft";
