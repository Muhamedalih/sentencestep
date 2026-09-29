/**
 * Layered keystroke sound packs — pure data, no "use client" directive, no Web
 * Audio calls — so server-safe modules can share the pack names through
 * src/lib/typing-sound-packs.ts exactly like the original ToneConfig packs.
 *
 * The original ten packs (see SOUND_PACKS) are a single oscillator per
 * variant. These packs are built from several simultaneous layers (pitched
 * partials, filtered-noise transients, pitch glides) and several alternative
 * "takes" per variant, which is what lets them sound like a marimba, a glass
 * tink or a keyboard thock instead of a beep — and what lets consecutive
 * keystrokes differ instead of repeating one identical sample.
 *
 * Everything is synthesized from these numbers at play time (see
 * src/lib/typing-sound-synth.ts), so like the original packs there are no
 * audio files to download, decode or cache, and every sound here is original
 * to this project (see TYPING_SOUND_CREDITS.md).
 */

export interface ToneLayer {
  kind: "tone";
  type: OscillatorType;
  frequency: number;
  /** Exponentially glides from `frequency` to this over `sweepTime` — chirps, drops and thumps. */
  frequencyEnd?: number;
  /** Seconds the glide takes; defaults to the layer's whole duration. */
  sweepTime?: number;
  /** Seconds after the take starts that this layer begins — lets one take hold a click followed by a body. */
  startOffset?: number;
  /** Seconds to ramp from silence to peakGain; short is snappy, long is a soft swell. */
  attack?: number;
  /** Seconds until the layer has decayed to silence. */
  duration: number;
  peakGain: number;
  /** Static lowpass on this layer — takes the raw edge off square/sawtooth waves. */
  lowpass?: number;
  /** If set, the lowpass sweeps down to this over the layer's duration (a plucked-string brightness decay). */
  lowpassEnd?: number;
}

/** Filtered white noise — what makes a sound read as a physical tap or breath rather than a note. */
export interface NoiseLayer {
  kind: "noise";
  filter: "bandpass" | "lowpass" | "highpass";
  filterFrom: number;
  filterTo?: number;
  /** Lower is broader/airier, higher is narrower/more "pitched" (a bamboo tube). */
  filterQ: number;
  startOffset?: number;
  attack?: number;
  duration: number;
  peakGain: number;
}

export type SoundLayer = ToneLayer | NoiseLayer;

/** One playable sound: every layer starts (or is offset) relative to the same keystroke. */
export type SoundTake = SoundLayer[];

export interface LayeredPack {
  /** Alternative sounds for a correct keystroke — one is picked per press. */
  letter: SoundTake[];
  error: SoundTake[];
  complete: SoundTake[];
  /**
   * "random" (default) picks a take at random but never the same one twice in
   * a row; "sequence" cycles through the takes in order (a clock's tick,
   * tock, tick, tock).
   */
  order?: "random" | "sequence";
  /** ± cents of random detune applied to each correct keystroke on top of the take choice. */
  detuneCents?: number;
  /** ± fraction of random level variation applied to each correct keystroke. */
  gainVariation?: number;
}

const tone = (layer: Omit<ToneLayer, "kind">): ToneLayer => ({ kind: "tone", ...layer });
const noise = (layer: Omit<NoiseLayer, "kind">): NoiseLayer => ({ kind: "noise", ...layer });

/** Shifts a take's pitch (and noise filter centers) by `ratio`, delays it and rescales its level. */
function shifted(take: SoundTake, ratio: number, offset = 0, gain = 1): SoundTake {
  return take.map((layer) =>
    layer.kind === "tone"
      ? {
          ...layer,
          frequency: layer.frequency * ratio,
          frequencyEnd: layer.frequencyEnd === undefined ? undefined : layer.frequencyEnd * ratio,
          lowpass: layer.lowpass === undefined ? undefined : layer.lowpass * ratio,
          lowpassEnd: layer.lowpassEnd === undefined ? undefined : layer.lowpassEnd * ratio,
          startOffset: (layer.startOffset ?? 0) + offset,
          peakGain: layer.peakGain * gain,
        }
      : {
          ...layer,
          filterFrom: layer.filterFrom * ratio,
          filterTo: layer.filterTo === undefined ? undefined : layer.filterTo * ratio,
          startOffset: (layer.startOffset ?? 0) + offset,
          peakGain: layer.peakGain * gain,
        },
  );
}

/**
 * The pack's own error sound: the pack's letter timbre dropped to roughly
 * half its pitch, slightly longer and with a downward glide on every pitched
 * layer — so a mistake always sounds like the same instrument "sagging",
 * clearly different from a correct key without being a harsh buzzer.
 */
function errorFrom(take: SoundTake): SoundTake {
  return shifted(take, 0.5, 0, 0.9).map((layer) =>
    layer.kind === "tone"
      ? {
          ...layer,
          frequencyEnd: layer.frequencyEnd ?? layer.frequency * 0.85,
          duration: layer.duration * 1.25,
        }
      : { ...layer, duration: layer.duration * 1.25 },
  );
}

/** The pack's "complete" variant: the letter timbre as a quick rising three-note flourish (root, major third, fifth). */
function flourishFrom(take: SoundTake): SoundTake {
  return [
    ...shifted(take, 1, 0, 0.9),
    ...shifted(take, 1.2599, 0.09, 0.9),
    ...shifted(take, 1.4983, 0.18, 1),
  ];
}

function pack(
  letter: SoundTake[],
  options: Pick<LayeredPack, "order" | "detuneCents" | "gainVariation"> = {},
): LayeredPack {
  const first = letter[0]!;
  return {
    letter,
    error: [errorFrom(first)],
    complete: [flourishFrom(first)],
    ...options,
  };
}

const glassTake = (f: number): SoundTake => [
  tone({ type: "sine", frequency: f, duration: 0.13, peakGain: 0.05, attack: 0.002 }),
  tone({ type: "sine", frequency: f * 2.32, duration: 0.08, peakGain: 0.022, attack: 0.002 }),
  tone({ type: "sine", frequency: f * 3.9, duration: 0.04, peakGain: 0.008, attack: 0.001 }),
];

const softTapTake = (body: number, air: number): SoundTake => [
  tone({
    type: "sine",
    frequency: body,
    frequencyEnd: body * 0.65,
    sweepTime: 0.05,
    duration: 0.07,
    peakGain: 0.03,
    attack: 0.003,
  }),
  noise({
    filter: "lowpass",
    filterFrom: air,
    filterTo: air * 0.4,
    filterQ: 0.7,
    duration: 0.04,
    peakGain: 0.13,
    attack: 0.002,
  }),
];

const cleanTake = (f: number): SoundTake => [
  tone({ type: "sine", frequency: f, duration: 0.03, peakGain: 0.06, attack: 0.001 }),
  noise({
    filter: "bandpass",
    filterFrom: 3800,
    filterQ: 1.5,
    duration: 0.012,
    peakGain: 0.09,
    attack: 0.001,
  }),
];

const modernTake = (f: number): SoundTake => [
  tone({
    type: "sine",
    frequency: f * 1.2,
    frequencyEnd: f,
    sweepTime: 0.025,
    duration: 0.075,
    peakGain: 0.07,
    attack: 0.003,
  }),
  tone({ type: "sine", frequency: f * 2, duration: 0.04, peakGain: 0.014, attack: 0.003 }),
];

const digitalTake = (f: number): SoundTake => [
  tone({
    type: "square",
    frequency: f,
    duration: 0.05,
    peakGain: 0.045,
    attack: 0.001,
    lowpass: 2600,
  }),
  tone({
    type: "square",
    frequency: f * 1.5,
    startOffset: 0.028,
    duration: 0.04,
    peakGain: 0.03,
    attack: 0.001,
    lowpass: 2600,
  }),
];

const tactileTake = (bump: number): SoundTake => [
  noise({
    filter: "bandpass",
    filterFrom: 2800,
    filterTo: 1800,
    filterQ: 1.2,
    duration: 0.014,
    peakGain: 0.2,
    attack: 0.001,
  }),
  tone({
    type: "sine",
    frequency: bump,
    frequencyEnd: bump * 0.7,
    sweepTime: 0.05,
    startOffset: 0.006,
    duration: 0.055,
    peakGain: 0.065,
    attack: 0.004,
  }),
];

const calmTake = (f: number): SoundTake => [
  tone({ type: "sine", frequency: f, duration: 0.2, peakGain: 0.045, attack: 0.016 }),
  tone({ type: "sine", frequency: f * 2, duration: 0.13, peakGain: 0.012, attack: 0.016 }),
];

const woodBlockTake = (f: number): SoundTake => [
  tone({
    type: "triangle",
    frequency: f,
    frequencyEnd: f * 0.92,
    sweepTime: 0.04,
    duration: 0.07,
    peakGain: 0.065,
    attack: 0.001,
  }),
  tone({ type: "sine", frequency: f * 2.4, duration: 0.03, peakGain: 0.02, attack: 0.001 }),
  noise({
    filter: "bandpass",
    filterFrom: f * 3,
    filterQ: 3,
    duration: 0.012,
    peakGain: 0.1,
    attack: 0.001,
  }),
];

const marimbaTake = (f: number): SoundTake => [
  tone({ type: "sine", frequency: f, duration: 0.16, peakGain: 0.06, attack: 0.002 }),
  tone({ type: "sine", frequency: f * 4, duration: 0.05, peakGain: 0.02, attack: 0.001 }),
];

const kalimbaTake = (f: number): SoundTake => [
  tone({ type: "sine", frequency: f, duration: 0.17, peakGain: 0.05, attack: 0.002 }),
  tone({ type: "sine", frequency: f * 5.4, duration: 0.05, peakGain: 0.01, attack: 0.001 }),
  noise({
    filter: "bandpass",
    filterFrom: f * 2,
    filterQ: 2,
    duration: 0.01,
    peakGain: 0.07,
    attack: 0.001,
  }),
];

const pluckTake = (f: number): SoundTake => [
  tone({
    type: "triangle",
    frequency: f,
    duration: 0.17,
    peakGain: 0.075,
    attack: 0.002,
    lowpass: f * 6,
    lowpassEnd: f * 1.2,
  }),
  tone({ type: "sine", frequency: f * 3, duration: 0.07, peakGain: 0.017, attack: 0.002 }),
];

const dropTake = (f: number): SoundTake => [
  tone({
    type: "sine",
    frequency: f,
    frequencyEnd: f * 2.6,
    sweepTime: 0.045,
    duration: 0.11,
    peakGain: 0.06,
    attack: 0.003,
  }),
];

const thockTake = (f: number): SoundTake => [
  tone({
    type: "sine",
    frequency: f * 1.5,
    frequencyEnd: f,
    sweepTime: 0.05,
    duration: 0.13,
    peakGain: 0.065,
    attack: 0.002,
  }),
  tone({
    type: "triangle",
    frequency: f * 2.2,
    duration: 0.05,
    peakGain: 0.02,
    attack: 0.002,
    lowpass: 900,
  }),
  noise({
    filter: "bandpass",
    filterFrom: 700,
    filterTo: 350,
    filterQ: 0.9,
    duration: 0.05,
    peakGain: 0.065,
    attack: 0.002,
  }),
];

const clickyTake = (hi: number): SoundTake => [
  noise({
    filter: "bandpass",
    filterFrom: hi,
    filterTo: hi * 0.7,
    filterQ: 2.2,
    duration: 0.012,
    peakGain: 0.2,
    attack: 0.001,
  }),
  noise({
    filter: "bandpass",
    filterFrom: hi * 0.6,
    filterTo: hi * 0.45,
    filterQ: 1.6,
    startOffset: 0.024,
    duration: 0.02,
    peakGain: 0.18,
    attack: 0.001,
  }),
  tone({
    type: "triangle",
    frequency: 900,
    frequencyEnd: 600,
    sweepTime: 0.03,
    startOffset: 0.024,
    duration: 0.04,
    peakGain: 0.04,
    attack: 0.002,
  }),
];

const analogTake = (f: number): SoundTake => [
  tone({
    type: "sawtooth",
    frequency: f,
    duration: 0.08,
    peakGain: 0.04,
    attack: 0.004,
    lowpass: f * 8,
    lowpassEnd: f * 1.5,
  }),
  tone({
    type: "sawtooth",
    frequency: f * 1.007,
    duration: 0.08,
    peakGain: 0.04,
    attack: 0.004,
    lowpass: f * 8,
    lowpassEnd: f * 1.5,
  }),
  tone({ type: "sine", frequency: f / 2, duration: 0.08, peakGain: 0.03, attack: 0.004 }),
];

const handDrumTake = (f: number): SoundTake => [
  tone({
    type: "sine",
    frequency: f * 1.5,
    frequencyEnd: f,
    sweepTime: 0.035,
    duration: 0.09,
    peakGain: 0.07,
    attack: 0.002,
  }),
  noise({
    filter: "bandpass",
    filterFrom: 1600,
    filterTo: 900,
    filterQ: 1.1,
    duration: 0.02,
    peakGain: 0.08,
    attack: 0.001,
  }),
];

const whisperTake = (center: number): SoundTake => [
  noise({
    filter: "bandpass",
    filterFrom: center,
    filterTo: center * 0.5,
    filterQ: 1.1,
    duration: 0.11,
    peakGain: 0.16,
    attack: 0.022,
  }),
];

const tickerTake = (f: number): SoundTake => [
  tone({
    type: "triangle",
    frequency: f,
    frequencyEnd: f * 0.9,
    sweepTime: 0.02,
    duration: 0.03,
    peakGain: 0.06,
    attack: 0.001,
  }),
  noise({
    filter: "bandpass",
    filterFrom: f * 3,
    filterQ: 2.5,
    duration: 0.008,
    peakGain: 0.1,
    attack: 0.0005,
  }),
];

const bambooTake = (f: number): SoundTake => [
  noise({
    filter: "bandpass",
    filterFrom: f,
    filterQ: 10,
    duration: 0.1,
    peakGain: 0.6,
    attack: 0.004,
  }),
  tone({ type: "sine", frequency: f, duration: 0.07, peakGain: 0.04, attack: 0.002 }),
];

const feltPianoTake = (f: number): SoundTake => [
  tone({ type: "sine", frequency: f, duration: 0.19, peakGain: 0.055, attack: 0.003 }),
  tone({ type: "sine", frequency: f * 2, duration: 0.12, peakGain: 0.02, attack: 0.003 }),
  tone({ type: "sine", frequency: f * 3, duration: 0.07, peakGain: 0.01, attack: 0.003 }),
  noise({
    filter: "lowpass",
    filterFrom: 900,
    filterQ: 0.7,
    duration: 0.025,
    peakGain: 0.06,
    attack: 0.002,
  }),
];

/** Pentatonic scales (every note works with every other) so overlapping notes from fast typing blend into a chord instead of clashing. */
const A_MINOR_PENTATONIC_LOW = [329.63, 392, 440, 523.25, 587.33];
const C_MAJOR_PENTATONIC_MID = [523.25, 587.33, 659.25, 783.99, 880];
const G_MAJOR_PENTATONIC_HIGH = [783.99, 880, 987.77, 1174.66, 1318.51];

export const LAYERED_SOUND_PACKS = {
  glass: pack([1318.51, 1479.98, 1174.66].map(glassTake), { detuneCents: 20, gainVariation: 0.08 }),
  softTap: pack([softTapTake(240, 1800), softTapTake(210, 1500), softTapTake(270, 2100)], {
    detuneCents: 25,
    gainVariation: 0.12,
  }),
  clean: pack([1500, 1650].map(cleanTake), { detuneCents: 15, gainVariation: 0.06 }),
  modern: pack([520, 585, 460].map(modernTake), { detuneCents: 15, gainVariation: 0.06 }),
  digital: pack([523.25, 587.33, 659.25, 783.99].map(digitalTake), { gainVariation: 0.05 }),
  tactile: pack([260, 240, 280].map(tactileTake), { detuneCents: 25, gainVariation: 0.1 }),
  calm: pack(A_MINOR_PENTATONIC_LOW.map(calmTake), { gainVariation: 0.08 }),
  woodBlock: pack([560, 620, 700].map(woodBlockTake), { detuneCents: 20, gainVariation: 0.08 }),
  marimba: pack(C_MAJOR_PENTATONIC_MID.map(marimbaTake), { gainVariation: 0.08 }),
  kalimba: pack(G_MAJOR_PENTATONIC_HIGH.map(kalimbaTake), { gainVariation: 0.08 }),
  pluck: pack([440, 523.25, 587.33, 659.25, 783.99].map(pluckTake), { gainVariation: 0.08 }),
  waterDrop: pack([340, 400, 460, 520].map(dropTake), { detuneCents: 30, gainVariation: 0.1 }),
  thock: pack([142, 155, 130].map(thockTake), { detuneCents: 25, gainVariation: 0.08 }),
  clicky: pack([3200, 3000, 3400].map(clickyTake), { detuneCents: 20, gainVariation: 0.08 }),
  analog: pack([261.63, 293.66, 329.63, 392].map(analogTake), { gainVariation: 0.06 }),
  handDrum: pack([240, 300, 360].map(handDrumTake), { detuneCents: 20, gainVariation: 0.1 }),
  whisper: pack([1100, 950, 1250].map(whisperTake), { detuneCents: 30, gainVariation: 0.15 }),
  ticker: pack([1250, 900].map(tickerTake), { order: "sequence", gainVariation: 0.05 }),
  bamboo: pack([620, 700, 790].map(bambooTake), { detuneCents: 20, gainVariation: 0.08 }),
  feltPiano: pack([261.63, 293.66, 329.63, 392, 440, 523.25].map(feltPianoTake), {
    gainVariation: 0.08,
  }),
} satisfies Record<string, LayeredPack>;

export type LayeredSoundPack = keyof typeof LAYERED_SOUND_PACKS;

export const LAYERED_SOUND_PACK_NAMES = Object.keys(LAYERED_SOUND_PACKS) as LayeredSoundPack[];
