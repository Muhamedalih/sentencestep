/**
 * Pure typing-sound pack data — no "use client" directive, no Web Audio
 * calls — so both the client-only hook (src/hooks/use-typing-sound.ts) and
 * server-safe modules (src/lib/admin/typing-sound-settings.ts and anything
 * that imports it) can share the same pack names/labels/defaults without a
 * server module ever pulling in client-only code.
 */

import {
  LAB_SOUND_PACK_NAMES,
  LAYERED_SOUND_PACKS,
  LAYERED_SOUND_PACK_NAMES,
} from "@/lib/typing-sound-layered-packs";
import { BUTTON_SOUND_PACK_NAMES } from "@/lib/typing-sound-button-packs";
import type { LayeredPack, LayeredSoundPack } from "@/lib/typing-sound-layered-packs";

export type SoundVariant = "letter" | "error" | "complete";

/** The original single-oscillator packs (see SOUND_PACKS). The richer layered packs live in typing-sound-layered-packs.ts. */
export type ToneSoundPack =
  | "soft"
  | "gentle"
  | "minimal"
  | "click"
  | "pop"
  | "bubble"
  | "typewriter"
  | "premium"
  | "mechanical"
  | "crystal";

export type SoundPack = ToneSoundPack | LayeredSoundPack;

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
export const SOUND_PACKS: Record<ToneSoundPack, Record<SoundVariant, ToneConfig>> = {
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
  /** A heavier, punchier clack than "click" — a lower square-wave thump meant to read like a satisfying mechanical-keyboard switch rather than a thin beep. */
  mechanical: {
    letter: { type: "square", duration: 0.035, frequency: 1100, peakGain: 0.055 },
    error: { type: "square", duration: 0.07, frequency: 190, peakGain: 0.05 },
    complete: { type: "square", duration: 0.26, frequency: 850, peakGain: 0.08 },
  },
  /** The richest, most polished pack — a bright triangle tone with more headroom than every other pack, for an admin who wants the most "premium"-feeling keystroke sound available. */
  crystal: {
    letter: { type: "triangle", duration: 0.13, frequency: 980, peakGain: 0.075 },
    error: { type: "triangle", duration: 0.11, frequency: 240, peakGain: 0.05 },
    complete: { type: "triangle", duration: 0.55, frequency: 1050, peakGain: 0.11 },
  },
};

export { LAYERED_SOUND_PACKS };
export type { LayeredPack, LayeredSoundPack };

const TONE_SOUND_PACK_NAMES = Object.keys(SOUND_PACKS) as ToneSoundPack[];

/** Every selectable pack, original tone packs first, then the layered library. */
export const SOUND_PACK_NAMES: SoundPack[] = [
  ...TONE_SOUND_PACK_NAMES,
  ...LAYERED_SOUND_PACK_NAMES,
];

export function isLayeredSoundPack(pack: SoundPack): pack is LayeredSoundPack {
  return pack in LAYERED_SOUND_PACKS;
}

export const SOUND_PACK_LABELS: Record<SoundPack, string> = {
  soft: "Soft",
  gentle: "Gentle",
  minimal: "Minimal",
  click: "Click",
  pop: "Pop",
  bubble: "Bubble",
  typewriter: "Typewriter",
  premium: "Premium",
  mechanical: "Mechanical",
  crystal: "Crystal",
  ceramic: "Ceramic",
  aluminum: "Aluminum",
  softTouch: "Soft-Touch",
  magnetic: "Magnetic Snap",
  haptic: "Haptic",
  glassButton: "Glass Button",
  pearl: "Pearl",
  toggle: "Toggle",
  microSwitch: "Micro Switch",
  glass: "Glass",
  softTap: "Soft Tap",
  clean: "Clean",
  modern: "Modern",
  digital: "Digital",
  tactile: "Tactile",
  calm: "Calm",
  woodBlock: "Wood Block",
  marimba: "Marimba",
  kalimba: "Kalimba",
  pluck: "Harp Pluck",
  waterDrop: "Water Drop",
  thock: "Thock",
  clicky: "Clicky",
  analog: "Analog",
  handDrum: "Hand Drum",
  whisper: "Whisper",
  ticker: "Ticker",
  bamboo: "Bamboo",
  feltPiano: "Felt Piano",
};

/** One short line per pack, shown under its name in the admin sound picker. */
export const SOUND_PACK_DESCRIPTIONS: Record<SoundPack, string> = {
  soft: "A round, gentle tone. The default.",
  gentle: "A touch lower and quieter than Soft.",
  minimal: "The shortest, quietest beep — barely there.",
  click: "A thin, snappy click.",
  pop: "A short, rounded pop.",
  bubble: "A long, mellow, bubbly tone.",
  typewriter: "A sharp, high typewriter-style tick.",
  premium: "A clean, polished tone with a fuller decay.",
  mechanical: "A heavier, punchier keyboard clack.",
  crystal: "Bright, ringing tones with the most headroom.",
  ceramic: "A dense, crisp ceramic click — clean and expensive.",
  aluminum: "A warm, machined-metal click with a soft key-up.",
  softTouch: "A muted, rubberized press — quiet and cushioned.",
  magnetic: "A satisfying magnetic snap: click in, click out.",
  haptic: "A deep, short phone-style haptic tap.",
  glassButton: "A cool, precise glass button with a tuned ring.",
  pearl: "A smooth, rounded press — the gentlest of the buttons.",
  toggle: "A solid lever toggle with a heavy, weighty click.",
  microSwitch: "A crisp, precise mouse-switch click.",
  glass: "Light, airy glass tinks with a hint of shimmer.",
  softTap: "A quiet finger-on-desk tap — cushioned and barely there.",
  clean: "A crisp, neutral UI tick that stays out of the way.",
  modern: "A smooth, rounded haptic-style tap.",
  digital: "Tiny retro two-note blips in a friendly scale.",
  tactile: "A satisfying click-and-bump, like a tactile switch.",
  calm: "Slow, soft notes from a gentle scale — every key a quiet chime.",
  woodBlock: "Warm, hollow wooden knocks.",
  marimba: "Rounded mallet notes, playful but soft.",
  kalimba: "Bright thumb-piano plinks with a light metallic edge.",
  pluck: "Soft harp-string plucks that ring for a moment.",
  waterDrop: "Little rising drops, like water tapping a still pool.",
  thock: "Deep, creamy keyboard thock with a muted bottom-out.",
  clicky: "A crisp two-stage click-clack, like a clicky switch.",
  analog: "Warm analog-synth blips with a soft filter sweep.",
  handDrum: "Small hand-drum taps in three pitches.",
  whisper: "Airy, brush-like whispers with no pitch at all.",
  ticker: "A dry clock tick-tock that alternates with every key.",
  bamboo: "Hollow, breathy bamboo-tube notes.",
  feltPiano: "Mellow, short felt-hammer piano notes.",
};

export interface SoundPackCollection {
  id: "premiumButtons" | "classic" | "soundLab";
  label: string;
  description: string;
  packs: SoundPack[];
}

/**
 * How the admin picker groups the packs, in display order: the refined button
 * presses first, then the original single-tone packs, then the instrument-like
 * Sound Lab. Every pack belongs to exactly one collection.
 */
export const SOUND_PACK_COLLECTIONS: SoundPackCollection[] = [
  {
    id: "premiumButtons",
    label: "Premium Buttons",
    description:
      "Refined, tactile button presses — short, dry and satisfying, like touching something well made.",
    packs: BUTTON_SOUND_PACK_NAMES,
  },
  {
    id: "classic",
    label: "Classic tones",
    description: "The original simple tones.",
    packs: TONE_SOUND_PACK_NAMES,
  },
  {
    id: "soundLab",
    label: "Sound Lab",
    description: "Instrument-like and experimental keystroke sounds.",
    packs: LAB_SOUND_PACK_NAMES,
  },
];

/** How many different sounds a correct keystroke rotates through in this pack (1 = every press identical). */
export function getSoundPackVariationCount(pack: SoundPack): number {
  return isLayeredSoundPack(pack) ? LAYERED_SOUND_PACKS[pack].letter.length : 1;
}

export const DEFAULT_SOUND_PACK: SoundPack = "soft";
