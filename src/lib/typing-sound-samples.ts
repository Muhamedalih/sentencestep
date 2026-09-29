import type { SamplePack } from "@/lib/typing-sound-sample-packs";

/**
 * Web Audio playback for the recorded keystroke packs (see
 * src/lib/typing-sound-sample-packs.ts). Takes any BaseAudioContext, like
 * typing-sound-synth.ts, so the exact code that plays a keystroke can also be
 * rendered offline and measured.
 *
 * Each file is fetched and decoded at most once per context and kept, so a
 * keystroke costs one AudioBufferSourceNode and no network. Decoding is
 * memoized as a promise (concurrent requests share one fetch) and a failed
 * load is forgotten so a later attempt can retry instead of staying broken.
 */

const pending = new WeakMap<BaseAudioContext, Map<string, Promise<AudioBuffer | null>>>();
const decoded = new WeakMap<BaseAudioContext, Map<string, AudioBuffer>>();

function mapFor<V>(store: WeakMap<BaseAudioContext, Map<string, V>>, ctx: BaseAudioContext) {
  let map = store.get(ctx);
  if (!map) {
    map = new Map();
    store.set(ctx, map);
  }
  return map;
}

/** Fetches and decodes one recording; resolves to null (never rejects) if it can't be loaded. */
export function loadSample(ctx: BaseAudioContext, url: string): Promise<AudioBuffer | null> {
  const requests = mapFor(pending, ctx);
  const existing = requests.get(url);
  if (existing) return existing;

  const request = fetch(url)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.arrayBuffer();
    })
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => {
      mapFor(decoded, ctx).set(url, buffer);
      return buffer;
    })
    .catch(() => {
      requests.delete(url);
      return null;
    });
  requests.set(url, request);
  return request;
}

/** Starts loading every recording of a pack (presses and releases) and resolves once each has either loaded or failed. */
export async function loadSamplePack(ctx: BaseAudioContext, pack: SamplePack): Promise<void> {
  await Promise.all(
    [...pack.files, ...(pack.release?.files ?? [])].map((url) => loadSample(ctx, url)),
  );
}

/** The recordings among `urls` that have finished decoding, in order — synchronous, so a keystroke never has to wait. */
export function loadedSamples(ctx: BaseAudioContext, urls: string[]): AudioBuffer[] {
  const map = decoded.get(ctx);
  if (!map) return [];
  return urls.flatMap((url) => {
    const buffer = map.get(url);
    return buffer ? [buffer] : [];
  });
}

export interface PlaySampleOptions {
  /** Final linear level: master gain × the pack's trim × any per-press variation. */
  gain: number;
  /** Playback rate (1 = as recorded); also shifts pitch, like a tape speed change. */
  rate?: number;
  /** If set, low-passes the recording at this frequency in Hz — used to dull the error sound. */
  lowpass?: number;
}

/** Plays one decoded recording starting at `when`. */
export function playSample(
  ctx: BaseAudioContext,
  destination: AudioNode,
  buffer: AudioBuffer,
  when: number,
  { gain, rate = 1, lowpass }: PlaySampleOptions,
): void {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.setValueAtTime(rate, when);

  const level = ctx.createGain();
  level.gain.setValueAtTime(gain, when);

  if (lowpass !== undefined) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(lowpass, when);
    filter.Q.setValueAtTime(0.7, when);
    source.connect(filter);
    filter.connect(level);
  } else {
    source.connect(level);
  }
  level.connect(destination);
  source.start(when);
}
