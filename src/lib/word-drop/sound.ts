/**
 * Word Drop's sound, in the browser only.
 *
 * Recordings: a word's stored recording is fetched and decoded as soon as the word is going to fall, so it plays the
 * moment its last letter is typed (an audio element that fetches the file when asked is what made it late). A
 * recording that cannot be fetched or decoded (a file that moved, a browser that refuses) is marked, and the caller
 * falls back to its own audio element.
 *
 * Effects: a few very short synthesized sounds (a key tick, a refused key, a chime that climbs with the combo, a miss,
 * the freeze, a level). All are quiet and can be switched off; the switch is remembered in this browser.
 */

const SOUND_KEY = "wordDropSound";
/** How many recordings are kept decoded at once: a round touches a few dozen, each a few kilobytes of sound. */
const MAX_BUFFERS = 80;

let context: AudioContext | null = null;
let enabled = true;
let enabledRead = false;
/** url -> decoded recording, or null when it could not be loaded. */
const buffers = new Map<string, AudioBuffer | null>();
const loading = new Set<string>();

function audioContext(): AudioContext | null {
  if (context) return context;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  } catch {
    context = null;
  }
  return context;
}

/** Called on the tap that starts a round: a browser only lets sound begin after a tap or a key. */
export function unlockAudio(): void {
  const ctx = audioContext();
  if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => undefined);
}

export function isSoundOn(): boolean {
  if (!enabledRead) {
    enabledRead = true;
    try {
      enabled = window.localStorage.getItem(SOUND_KEY) !== "off";
    } catch {
      enabled = true;
    }
  }
  return enabled;
}

export function setSoundOn(on: boolean): void {
  enabled = on;
  enabledRead = true;
  try {
    window.localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    // The choice just is not remembered.
  }
}

/** Fetches and decodes a recording ahead of time. Safe to call again and again for the same url. */
export function preloadClip(url: string | null): void {
  if (!url || buffers.has(url) || loading.has(url)) return;
  const ctx = audioContext();
  if (!ctx) return;
  loading.add(url);
  void fetch(url)
    .then((response) =>
      response.ok ? response.arrayBuffer() : Promise.reject(new Error("no clip")),
    )
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => {
      if (buffers.size >= MAX_BUFFERS) {
        const oldest = buffers.keys().next().value;
        if (oldest !== undefined) buffers.delete(oldest);
      }
      buffers.set(url, buffer);
    })
    .catch(() => {
      buffers.set(url, null);
    })
    .finally(() => {
      loading.delete(url);
    });
}

/** Plays a recording that is already decoded and answers true; false when it is not ready (the caller then plays it its own way). */
export function playBuffered(url: string | null): boolean {
  if (!url) return false;
  const buffer = buffers.get(url);
  const ctx = context;
  if (!buffer || !ctx) return false;
  if (!isSoundOn()) return true;
  try {
    if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    return true;
  } catch {
    return false;
  }
}

function tone(
  freq: number,
  seconds: number,
  type: OscillatorType,
  volume: number,
  slideTo?: number,
) {
  if (!isSoundOn()) return;
  const ctx = audioContext();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + seconds);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + seconds + 0.02);
  } catch {
    // A sound that will not play is just silence.
  }
}

export const sfx = {
  tick: () => tone(1100, 0.04, "triangle", 0.025),
  bad: () => tone(150, 0.1, "square", 0.03, 90),
  chime: (combo: number) => {
    const freq = 523 * Math.pow(2, Math.min(combo, 9) / 12);
    tone(freq, 0.16, "sine", 0.05);
    window.setTimeout(() => tone(freq * 1.5, 0.2, "sine", 0.035), 70);
  },
  miss: () => tone(220, 0.28, "sine", 0.07, 110),
  freeze: () => tone(300, 0.35, "sine", 0.06, 1100),
  level: () => {
    tone(660, 0.12, "sine", 0.05);
    window.setTimeout(() => tone(880, 0.2, "sine", 0.05), 110);
  },
};
