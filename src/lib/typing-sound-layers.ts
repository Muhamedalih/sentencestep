/**
 * The building blocks shared by every layered keystroke pack — the layer/take
 * types plus the small builders (tone, noise, pitch-shift, derived error and
 * completion sounds) the pack files are written with. Pure data and pure
 * functions: no "use client" directive, no Web Audio calls, so server-safe
 * modules can share pack names through src/lib/typing-sound-packs.ts.
 *
 * A layered pack is several simultaneous layers (pitched partials,
 * filtered-noise transients, pitch glides) and several alternative "takes"
 * per variant, which is what lets a pack sound like a physical button, a
 * glass tink or a keyboard thock instead of a beep — and what lets
 * consecutive keystrokes differ instead of repeating one identical sample.
 * Everything is synthesized at play time (see src/lib/typing-sound-synth.ts),
 * so there are no audio files to download, decode or cache, and every sound is
 * original to this project (see TYPING_SOUND_CREDITS.md).
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

export const tone = (layer: Omit<ToneLayer, "kind">): ToneLayer => ({ kind: "tone", ...layer });
export const noise = (layer: Omit<NoiseLayer, "kind">): NoiseLayer => ({ kind: "noise", ...layer });

/** Shifts a take's pitch (and noise filter centers) by `ratio`, delays it and rescales its level. */
export function shifted(take: SoundTake, ratio: number, offset = 0, gain = 1): SoundTake {
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
export function errorFrom(take: SoundTake): SoundTake {
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
export function flourishFrom(take: SoundTake): SoundTake {
  return [
    ...shifted(take, 1, 0, 0.9),
    ...shifted(take, 1.2599, 0.09, 0.9),
    ...shifted(take, 1.4983, 0.18, 1),
  ];
}

export function pack(
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
