/**
 * The "Sound Lab" keystroke packs — instrument-like and experimental sounds
 * (glass, marimba, kalimba, water drop, ...). Pure data; built from the
 * shared layer types/builders in src/lib/typing-sound-layers.ts. The
 * button-press collection lives in src/lib/typing-sound-button-packs.ts.
 */

import { noise, pack, tone } from "@/lib/typing-sound-layers";
import type { LayeredPack, SoundTake } from "@/lib/typing-sound-layers";
import { BUTTON_SOUND_PACKS } from "@/lib/typing-sound-button-packs";

export type {
  LayeredPack,
  NoiseLayer,
  SoundLayer,
  SoundTake,
  ToneLayer,
} from "@/lib/typing-sound-layers";

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

export const LAB_SOUND_PACKS = {
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

export type LabSoundPack = keyof typeof LAB_SOUND_PACKS;

export const LAB_SOUND_PACK_NAMES = Object.keys(LAB_SOUND_PACKS) as LabSoundPack[];

/** Every layered pack the player can render — the button collection first, then the Sound Lab. */
export const LAYERED_SOUND_PACKS = { ...BUTTON_SOUND_PACKS, ...LAB_SOUND_PACKS };

export type LayeredSoundPack = keyof typeof LAYERED_SOUND_PACKS;

export const LAYERED_SOUND_PACK_NAMES = Object.keys(LAYERED_SOUND_PACKS) as LayeredSoundPack[];
