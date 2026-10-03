/**
 * One <audio> element for the whole learning session.
 *
 * iOS Safari only lets an <audio> element start playing without a tap if that
 * same element has already been played from a tap. Creating a fresh
 * `new Audio()` for every sentence, as the clips used to, meant every sentence
 * after a pause (a network round trip while its audio resolves) was refused and
 * only played once the learner touched the screen again. Reusing one element
 * that was "unlocked" by the first tap keeps later sentences, replays and word
 * clips playable, and also guarantees only one voice at a time.
 *
 * Opt-in (see useAudioClip's `shared` option): Books keep their own elements.
 */

let element: HTMLAudioElement | null = null;
let releaseOwner: (() => void) | null = null;
let unlockInstalled = false;
let silentUrl: string | null = null;

function getElement(): HTMLAudioElement {
  element ??= new Audio();
  return element;
}

/**
 * Hands the shared element to a new owner. The previous owner's `release` runs
 * first (it stops the old clip and tells its hook), so two clips never overlap.
 */
export function acquireSharedAudio(release: () => void): HTMLAudioElement {
  const previous = releaseOwner;
  releaseOwner = release;
  previous?.();
  return getElement();
}

/** Called when an owner goes away on its own; only clears the slot if it is still theirs. */
export function releaseSharedAudio(release: () => void): void {
  if (releaseOwner === release) releaseOwner = null;
}

/** A 1/100 second of silence as a blob: media-src allows blob: but not data:. */
function silentClipUrl(): string {
  if (silentUrl) return silentUrl;
  const samples = 80; // 8 kHz mono 16-bit
  const bytes = new Uint8Array(44 + samples * 2);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 16000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, samples * 2, true);
  silentUrl = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
  return silentUrl;
}

/**
 * On the learner's first touch, key press or click anywhere, plays a moment of
 * silence on the shared element so the browser treats it as started by the
 * learner. From then on any clip can use it without another tap.
 */
export function installAudioUnlock(): void {
  if (unlockInstalled || typeof window === "undefined") return;
  unlockInstalled = true;
  const events = ["pointerdown", "touchend", "keydown"] as const;
  const unlock = () => {
    for (const name of events) window.removeEventListener(name, unlock, true);
    if (releaseOwner) return; // a real clip is already using it
    const audio = getElement();
    try {
      audio.src = silentClipUrl();
      void audio
        .play()
        .then(() => {
          if (!releaseOwner) audio.pause();
        })
        .catch(() => {});
    } catch {
      // Unlocking is best effort; playback still falls back to the next tap.
    }
  };
  for (const name of events) window.addEventListener(name, unlock, true);
}
