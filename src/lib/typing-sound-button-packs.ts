/**
 * The "Premium Buttons" collection — nine keystroke sounds that each model one
 * refined physical button press, rather than an instrument or a beep. Pure
 * data, built from the shared layer builders in src/lib/typing-sound-layers.ts
 * and rendered by src/lib/typing-sound-synth.ts.
 *
 * Every press is built the way a real button sounds:
 *
 * - a **transient** — a 1.5–4 ms burst of filtered noise, the "tick" that
 *   makes it read as a click instead of a note;
 * - a **ring** — one to three very short, fast-decaying sines at the button's
 *   modal frequencies (the material: dense ceramic, bright aluminum, muted
 *   rubber), each gone within 10–45 ms so it colors the click without ever
 *   sounding like a held tone;
 * - a **thump** — a brief low sine with a small downward glide, the
 *   enclosure's weight that makes a press feel solid and expensive (kept above
 *   ~180 Hz so laptop and phone speakers can actually reproduce it);
 * - on some packs a quieter **release** — the button coming back up a few
 *   tens of milliseconds later, the second half of the "tk-tak" that makes
 *   real switches satisfying.
 *
 * Three takes per pack are the same button struck with slightly different
 * modal tuning (±4–6%), and the noise transient is a fresh slice of noise every
 * press, so consecutive presses are never identical. Levels are kept on the
 * quiet side of the older packs — the sound repeats with every correct key, so
 * it should feel like touching something well made, never like an alert.
 */

import { noise, pack, tone } from "@/lib/typing-sound-layers";
import type { SoundLayer, SoundTake } from "@/lib/typing-sound-layers";

/** The transient: a very short burst of band-passed noise whose center glides down a little, like a click's spectrum settling. */
const tick = (
  center: number,
  q: number,
  duration: number,
  peakGain: number,
  startOffset = 0,
  glideTo = 0.72,
): SoundLayer =>
  noise({
    filter: "bandpass",
    filterFrom: center,
    filterTo: center * glideTo,
    filterQ: q,
    duration,
    peakGain,
    attack: 0.0004,
    startOffset,
  });

/** One resonant mode of the button body: a sine that starts instantly and dies within `duration`. */
const ring = (frequency: number, duration: number, peakGain: number, startOffset = 0): SoundLayer =>
  tone({ type: "sine", frequency, duration, peakGain, attack: 0.0004, startOffset });

/** The enclosure's weight: a brief low sine that sags slightly in pitch as it decays. */
const thump = (
  frequency: number,
  duration: number,
  peakGain: number,
  startOffset = 0,
  sag = 0.75,
): SoundLayer =>
  tone({
    type: "sine",
    frequency,
    frequencyEnd: frequency * sag,
    sweepTime: duration * 0.8,
    duration,
    peakGain,
    attack: 0.001,
    startOffset,
  });

/** Dense, crisp ceramic: a tight tick, a small cluster of short rings and just enough body. */
const ceramicTake = (k: number): SoundTake => [
  tick(4000 * k, 1.3, 0.003, 0.12, 0, 0.7),
  ring(2350 * k, 0.02, 0.024),
  ring(3800 * k, 0.012, 0.011),
  ring(1560 * k, 0.026, 0.02),
  thump(300 * k, 0.03, 0.026),
];

/** Warm, machined aluminum: a lower, longer, slightly inharmonic ring and a soft key-up. */
const aluminumTake = (k: number): SoundTake => [
  tick(2800 * k, 0.8, 0.0025, 0.1, 0, 0.75),
  ring(1100 * k, 0.06, 0.03),
  ring(3036 * k, 0.035, 0.013),
  ring(5940 * k, 0.02, 0.005),
  thump(340 * k, 0.03, 0.026),
  tick(2300 * k, 1.1, 0.002, 0.05, 0.085),
  ring(1100 * k, 0.025, 0.01, 0.085),
];

/** Muted, rubberized press: a soft low-passed "pht" over a warm thump, and a faint key-up — no sharp click at all. */
const softTouchTake = (k: number): SoundTake => [
  noise({
    filter: "lowpass",
    filterFrom: 2200 * k,
    filterTo: 700 * k,
    filterQ: 0.7,
    duration: 0.012,
    peakGain: 0.13,
    attack: 0.001,
  }),
  thump(250 * k, 0.055, 0.05, 0, 0.72),
  ring(560 * k, 0.03, 0.011),
  noise({
    filter: "lowpass",
    filterFrom: 1600 * k,
    filterTo: 600 * k,
    filterQ: 0.7,
    duration: 0.01,
    peakGain: 0.06,
    attack: 0.001,
    startOffset: 0.07,
  }),
  thump(210 * k, 0.03, 0.018, 0.07),
];

/** A magnetic latch: a bright, dry click-in and, 55 ms later, a softer click-out — "tk-tak". */
const magneticTake = (k: number): SoundTake => [
  tick(3800 * k, 1.6, 0.002, 0.19, 0, 0.76),
  ring(2300 * k, 0.012, 0.034),
  thump(520 * k, 0.03, 0.034),
  tick(2800 * k, 1.6, 0.002, 0.14, 0.055, 0.79),
  ring(1700 * k, 0.014, 0.024, 0.055),
  thump(400 * k, 0.025, 0.018, 0.055),
];

/** A phone-style haptic tap: mostly weight — a deep, short thump with a whisper of tick on top. */
const hapticTake = (k: number): SoundTake => [
  thump(190 * k, 0.075, 0.075, 0, 0.62),
  ring(380 * k, 0.04, 0.026),
  tick(2200 * k, 1, 0.004, 0.08, 0, 0.68),
];

/** A cool glass button: a faint click, then a tuned glassy ring over a warm body. */
const glassButtonTake = (f: number): SoundTake => [
  tick(5200, 0.8, 0.0015, 0.05, 0, 0.8),
  ring(f, 0.06, 0.03),
  ring(f * 2.32, 0.03, 0.012),
  ring(f / 2, 0.03, 0.02),
  thump(420, 0.03, 0.02),
];

/** A smooth, rounded press: a soft-attack "pock" over a warm thump — the gentlest of the collection. */
const pearlTake = (k: number): SoundTake => [
  tone({
    type: "sine",
    frequency: 720 * k,
    frequencyEnd: 640 * k,
    sweepTime: 0.02,
    duration: 0.06,
    peakGain: 0.055,
    attack: 0.002,
  }),
  thump(200 * k, 0.04, 0.035),
  noise({
    filter: "lowpass",
    filterFrom: 3200 * k,
    filterTo: 1500 * k,
    filterQ: 0.7,
    duration: 0.006,
    peakGain: 0.07,
    attack: 0.001,
  }),
  ring(1280 * k, 0.03, 0.01),
];

/** A solid lever toggle: a heavy click-in and a lower click-back — the weightiest, lowest button here. */
const toggleTake = (k: number): SoundTake => [
  tick(2000 * k, 1, 0.004, 0.2, 0, 0.6),
  thump(360 * k, 0.05, 0.05),
  ring(1250 * k, 0.026, 0.024),
  tick(1600 * k, 1, 0.003, 0.11, 0.07, 0.62),
  thump(270 * k, 0.035, 0.03, 0.07),
];

/** A precise micro switch: the shortest, crispest click here, with a tiny key-up. */
const microSwitchTake = (k: number): SoundTake => [
  tick(3800 * k, 1.8, 0.0015, 0.2, 0, 0.79),
  ring(2700 * k, 0.01, 0.03),
  ring(700 * k, 0.02, 0.028),
  thump(260 * k, 0.02, 0.02),
  tick(3000 * k, 1.8, 0.001, 0.07, 0.045),
  ring(2200 * k, 0.008, 0.012, 0.045),
];

/** Three tunings of the same button (nominal, a touch sharper, a touch flatter) — the takes a keystroke rotates through. */
const TUNINGS = [1, 1.05, 0.955];

export const BUTTON_SOUND_PACKS = {
  ceramic: pack(TUNINGS.map(ceramicTake), { detuneCents: 15, gainVariation: 0.06 }),
  aluminum: pack(TUNINGS.map(aluminumTake), { detuneCents: 15, gainVariation: 0.06 }),
  softTouch: pack(TUNINGS.map(softTouchTake), { detuneCents: 20, gainVariation: 0.08 }),
  magnetic: pack(TUNINGS.map(magneticTake), { detuneCents: 15, gainVariation: 0.06 }),
  haptic: pack(TUNINGS.map(hapticTake), { detuneCents: 20, gainVariation: 0.06 }),
  glassButton: pack([1175, 1319, 1568].map(glassButtonTake), { gainVariation: 0.06 }),
  pearl: pack(TUNINGS.map(pearlTake), { detuneCents: 20, gainVariation: 0.06 }),
  toggle: pack(TUNINGS.map(toggleTake), { detuneCents: 15, gainVariation: 0.06 }),
  microSwitch: pack(TUNINGS.map(microSwitchTake), { detuneCents: 15, gainVariation: 0.06 }),
};

export type ButtonSoundPack = keyof typeof BUTTON_SOUND_PACKS;

export const BUTTON_SOUND_PACK_NAMES = Object.keys(BUTTON_SOUND_PACKS) as ButtonSoundPack[];
