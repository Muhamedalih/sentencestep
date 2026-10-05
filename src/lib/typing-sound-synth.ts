import type { LayeredPack, SoundTake } from "@/lib/typing-sound-layered-packs";

/**
 * Web Audio playback for the layered keystroke packs (see
 * src/lib/typing-sound-layered-packs.ts). Takes any BaseAudioContext rather
 * than a live AudioContext so the exact code that plays a keystroke can also
 * be rendered offline (OfflineAudioContext) and measured.
 */

const NOISE_SECONDS = 1;
/** Extra seconds an oscillator/noise source keeps running past its envelope, so the tail is never cut off. */
const STOP_PADDING = 0.03;

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();

/**
 * One shared second of white noise per context, played from a random
 * position for every noise layer — a keystroke costs a few nodes instead of
 * allocating and filling a fresh buffer each press, and two presses never
 * play the same slice of noise.
 */
function getNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * NOISE_SECONDS), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
}

export interface ScheduleTakeOptions {
  /** Master level: volume × the hook's GAIN_BOOST, applied on top of every layer's peakGain. */
  gainScale: number;
  /** Multiplies every pitch and filter frequency in the take (1 = as written). */
  pitchRatio?: number;
  /** Multiplies every layer's level (1 = as written). */
  gainRatio?: number;
}

/** Schedules every layer of one take starting at `startTime`, routed into `destination`. */
export function scheduleTake(
  ctx: BaseAudioContext,
  destination: AudioNode,
  take: SoundTake,
  startTime: number,
  { gainScale, pitchRatio = 1, gainRatio = 1 }: ScheduleTakeOptions,
): void {
  for (const layer of take) {
    const start = startTime + (layer.startOffset ?? 0);
    const attack = layer.attack ?? 0.004;
    const end = start + layer.duration;

    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(layer.peakGain * gainScale * gainRatio, start + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    envelope.connect(destination);

    if (layer.kind === "tone") {
      const oscillator = ctx.createOscillator();
      oscillator.type = layer.type;
      oscillator.frequency.setValueAtTime(layer.frequency * pitchRatio, start);
      if (layer.frequencyEnd !== undefined) {
        oscillator.frequency.exponentialRampToValueAtTime(
          layer.frequencyEnd * pitchRatio,
          start + (layer.sweepTime ?? layer.duration),
        );
      }

      if (layer.lowpass !== undefined) {
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.Q.setValueAtTime(0.7, start);
        lowpass.frequency.setValueAtTime(layer.lowpass * pitchRatio, start);
        if (layer.lowpassEnd !== undefined) {
          lowpass.frequency.exponentialRampToValueAtTime(layer.lowpassEnd * pitchRatio, end);
        }
        oscillator.connect(lowpass);
        lowpass.connect(envelope);
      } else {
        oscillator.connect(envelope);
      }

      oscillator.start(start);
      oscillator.stop(end + STOP_PADDING);
    } else {
      const source = ctx.createBufferSource();
      source.buffer = getNoiseBuffer(ctx);

      const filter = ctx.createBiquadFilter();
      filter.type = layer.filter;
      filter.Q.setValueAtTime(layer.filterQ, start);
      filter.frequency.setValueAtTime(layer.filterFrom * pitchRatio, start);
      if (layer.filterTo !== undefined) {
        filter.frequency.exponentialRampToValueAtTime(layer.filterTo * pitchRatio, end);
      }

      source.connect(filter);
      filter.connect(envelope);

      const playLength = layer.duration + STOP_PADDING;
      source.start(start, Math.random() * (NOISE_SECONDS - playLength), playLength);
    }
  }
}

/**
 * Which take to play next. "sequence" packs cycle in order; "random" packs
 * pick any take except the one just played, so two consecutive keystrokes
 * never repeat exactly. `previous` is the index played last (undefined before
 * the first press).
 */
export function pickTakeIndex(
  count: number,
  order: LayeredPack["order"],
  previous: number | undefined,
  random: () => number = Math.random,
): number {
  if (count <= 1) return 0;
  if (order === "sequence") return previous === undefined ? 0 : (previous + 1) % count;
  if (previous === undefined) return Math.floor(random() * count);
  // Draw from the other count-1 takes and skip over `previous`.
  const pick = Math.floor(random() * (count - 1));
  return pick >= previous ? pick + 1 : pick;
}

/** ±`amount` as a uniform random multiplier around 1 (e.g. 0.08 → 0.92–1.08). */
export function jitterRatio(amount: number, random: () => number = Math.random): number {
  return 1 + (random() * 2 - 1) * amount;
}

/** ±`cents` of random detune as a frequency ratio (1200 cents = one octave). */
export function detuneRatio(cents: number, random: () => number = Math.random): number {
  return 2 ** (((random() * 2 - 1) * cents) / 1200);
}
