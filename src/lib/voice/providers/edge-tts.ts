import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

import type { SynthesizeInput, SynthesizedAudio, TTSProvider } from "@/lib/voice/provider";

/**
 * Microsoft Edge's "Read Aloud" consumer speech endpoint, via the
 * `msedge-tts` package — the same neural voices Edge's built-in Read Aloud
 * feature uses, reachable with no API key, no Azure account, and no cost.
 * This is the zero-configuration narration provider provider-registry.ts
 * falls back to when neither Azure nor ElevenLabs is configured (see that
 * file's doc comment).
 *
 * IMPORTANT: this is an unofficial, reverse-engineered endpoint (see
 * node_modules/msedge-tts's own source — a hardcoded "trusted client
 * token" and an Origin header spoofing the Edge Read Aloud browser
 * extension), not a documented/supported Microsoft API. It works today,
 * is widely used by the open-source TTS community, and requires nothing
 * from the user to try — but it could change or stop working without
 * notice, and its SSML support is empirically narrower than the real Azure
 * Cognitive Services Speech API (see direction-to-prosody.ts's doc comment
 * for exactly what was verified to work). Azure Speech (providers/azure.ts)
 * remains the officially-supported, SLA-backed option once/if the user's
 * own Azure account works.
 *
 * `input.text` here is always a complete SSML document already built by
 * direction-to-prosody.ts — this module never constructs SSML itself,
 * exactly like providers/azure.ts and providers/elevenlabs.ts.
 * `input.voiceId`/`input.model`/`input.voiceSettings` are unused: the
 * voice name and every delivery detail are already baked into the SSML.
 */

const OUTPUT_FORMAT_MP3 = OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3;

/**
 * This is a raw WebSocket to an unofficial, undocumented endpoint (see this
 * module's own doc comment) — unlike the ElevenLabs/Azure providers' plain
 * `fetch()` calls, a stalled TCP connection here has no guarantee of ever
 * surfacing as an `error`/`close` event; nothing upstream enforces a
 * response deadline. Without a hard timeout, a single bad connection
 * attempt hangs `synthesize()` forever, which in the admin Preview button
 * (see previewEdgeTtsAction) means a spinner that never resolves and never
 * lets the learner/admin retry. 20s comfortably covers this endpoint's real
 * observed latency (consistently under 1s in testing) with a lot of margin
 * for a slow network, while still failing fast enough to be usable.
 */
const REQUEST_TIMEOUT_MS = 20_000;

export function createEdgeTtsProvider(): TTSProvider {
  return {
    name: "edge-tts",
    async synthesize(input: SynthesizeInput): Promise<SynthesizedAudio> {
      // A fresh client per call, closed when done — this endpoint's per-call
      // cost is just a WebSocket handshake (measured well under a second),
      // and a short-lived server action/background job has no good place to
      // keep a persistent connection alive between calls anyway.
      const tts = new MsEdgeTTS();
      const workPromise = synthesizeOnce(tts, input);
      // If the timeout below wins the race, `tts.close()` in `finally`
      // forces this promise to settle (msedge-tts rejects any still-open
      // stream when the socket closes) — attach a no-op catch now so that
      // late rejection is never an unhandled promise rejection; the
      // timeout's own error is what synthesize() actually throws in that
      // case, not this one.
      workPromise.catch(() => {});

      let timer: ReturnType<typeof setTimeout>;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Edge TTS request timed out after ${REQUEST_TIMEOUT_MS}ms.`)),
          REQUEST_TIMEOUT_MS,
        );
      });

      try {
        return await Promise.race([workPromise, timeoutPromise]);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Edge TTS request failed: ${message}`);
      } finally {
        clearTimeout(timer!);
        tts.close();
      }
    },
  };
}

async function synthesizeOnce(tts: MsEdgeTTS, input: SynthesizeInput): Promise<SynthesizedAudio> {
  // voiceName is embedded in the SSML itself (see direction-to-prosody.ts),
  // so setMetadata's own voiceName argument only needs to be *a*
  // valid-looking voice name to satisfy the library's locale-inference
  // check before rawToStream sends the real SSML.
  await tts.setMetadata(input.voiceId, OUTPUT_FORMAT_MP3);

  const { audioStream } = tts.rawToStream(input.text);
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    audioStream.on("close", () => resolve());
    audioStream.on("error", (err: unknown) => reject(err));
  });

  const audio = Buffer.concat(chunks);
  if (audio.length === 0) throw new Error("Edge TTS returned no audio data.");
  return { audio, durationMs: null };
}
