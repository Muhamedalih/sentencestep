/**
 * Server-only Kokoro-82M inference (ONNX, via kokoro-js/@huggingface/transformers,
 * running on onnxruntime-node) — never imported from a "use client" file or
 * bundled to the browser. See voices-actions.ts (admin-triggered preview
 * generation) and voice-audio.ts (learner-triggered on-demand lesson audio),
 * the only two call sites.
 *
 * The model is loaded lazily and cached for the lifetime of this server
 * process (module-level singleton promise) — the first call in a freshly
 * started process pays the full load cost (~25s cold, downloading and
 * initializing the quantized ONNX weights from Hugging Face on first use,
 * cached to disk after that); every call after that in the same warm
 * process reuses the already-loaded model (~1s). See the "Production
 * feasibility" section of the final report for what this means for
 * different deployment targets.
 */
const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const MODEL_DTYPE = "q8";

/** Bump this if the model, quantization, or generation parameters ever change — see cacheKeyParts in resolution.ts, which folds this into the cache key so old and new clips are never confused with each other. */
export const KOKORO_GENERATION_VERSION = `kokoro-82m-v1.0:${MODEL_DTYPE}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- kokoro-js ships no top-level type export for the TTS instance itself; typing this precisely would mean hand-duplicating its .d.ts, and this stays entirely internal to this module.
let modelPromise: Promise<any> | null = null;

async function getModel() {
  if (!modelPromise) {
    modelPromise = import("kokoro-js").then(({ KokoroTTS }) =>
      KokoroTTS.from_pretrained(MODEL_ID, { dtype: MODEL_DTYPE, device: "cpu" }),
    );
    // A failed load must not permanently wedge the process — the next
    // caller gets a fresh attempt instead of the same rejected promise
    // forever.
    modelPromise.catch(() => {
      modelPromise = null;
    });
  }
  return modelPromise;
}

function floatTo16BitPCM(float32: Float32Array): Int16Array {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]!));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

/** 64kbps mono — a short spoken sentence doesn't benefit from higher bitrates, and this keeps generated clips small (see the "Performance" report section for real measured sizes) without audible quality loss for speech. */
const MP3_BITRATE_KBPS = 64;
const MP3_BLOCK_SIZE = 1152;

async function encodeMp3(pcm16: Int16Array, sampleRate: number): Promise<Buffer> {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const encoder = new Mp3Encoder(1, sampleRate, MP3_BITRATE_KBPS);
  const chunks: Buffer[] = [];
  for (let i = 0; i < pcm16.length; i += MP3_BLOCK_SIZE) {
    const block = pcm16.subarray(i, i + MP3_BLOCK_SIZE);
    const mp3buf = encoder.encodeBuffer(block);
    if (mp3buf.length > 0) chunks.push(Buffer.from(mp3buf));
  }
  const end = encoder.flush();
  if (end.length > 0) chunks.push(Buffer.from(end));
  return Buffer.concat(chunks);
}

/** Longer than any real lesson sentence or vocabulary word ever gets — see MAX_SENTENCE_LENGTH's use in voice-audio.ts for the actual caller-facing guard. Kept here too as a hard backstop against ever handing an unbounded string to inference. */
const MAX_GENERATE_CHARS = 500;

/**
 * Generates one MP3 clip for `text` spoken by `providerVoiceId` (a raw
 * Kokoro voice code — see KokoroVoiceDefinition.providerVoiceId). Throws on
 * failure; callers decide what "generation failed" should degrade to (see
 * voice-audio.ts's speech-synthesis fallback and voices-actions.ts's
 * partial-collection-seed handling) — this function never swallows an
 * error itself.
 */
export async function generateVoiceClip(
  text: string,
  providerVoiceId: string,
): Promise<{ mp3: Buffer; durationSeconds: number }> {
  if (text.length === 0 || text.length > MAX_GENERATE_CHARS) {
    throw new Error(`generateVoiceClip: text length ${text.length} outside allowed range`);
  }

  const tts = await getModel();
  const audio = await tts.generate(text, { voice: providerVoiceId });
  const pcm16 = floatTo16BitPCM(audio.audio);
  const mp3 = await encodeMp3(pcm16, audio.sampling_rate);
  return { mp3, durationSeconds: audio.audio.length / audio.sampling_rate };
}
