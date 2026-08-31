import type { SynthesizeInput, SynthesizedAudio, TTSProvider } from "@/lib/voice/provider";

const API_BASE = "https://api.elevenlabs.io/v1";

/** 64kbps mono MP3 — matches Kokoro's own MP3_BITRATE_KBPS in generation.ts: a spoken sentence doesn't need more, and this keeps generated clips small. ElevenLabs' lowest-latency/smallest MP3 output_format at this bitrate. */
const OUTPUT_FORMAT = "mp3_44100_64";

function voiceSettingsPayload(settings: SynthesizeInput["voiceSettings"]) {
  return {
    stability: settings.stability,
    similarity_boost: settings.similarityBoost,
    style: settings.style,
    speed: settings.speed,
    use_speaker_boost: settings.useSpeakerBoost,
  };
}

/**
 * Maps an ElevenLabs API failure to a message safe to log/store in
 * voice_audio_cache.last_error — never the raw response body (which could
 * echo back request details) and never the API key, which is only ever
 * sent as a request header, never interpolated into any string this
 * function builds or throws.
 */
function describeFailure(status: number, bodyText: string): string {
  if (status === 401) return "ElevenLabs rejected the API key (401 Unauthorized).";
  if (status === 429) return "ElevenLabs rate limit or quota exceeded (429).";
  if (status === 400)
    return `ElevenLabs rejected the request as malformed (400): ${bodyText.slice(0, 200)}`;
  return `ElevenLabs request failed (${status}): ${bodyText.slice(0, 200)}`;
}

/**
 * The only file that talks to ElevenLabs' HTTP API directly — everything
 * else in this app (story-voice-generation.ts, the admin preview action)
 * goes through the TTSProvider interface. Never imported from a "use
 * client" file; the API key only ever lives in this server-side closure,
 * never returned to a caller or included in a thrown error.
 */
export function createElevenLabsProvider(apiKey: string): TTSProvider {
  return {
    name: "elevenlabs",
    async synthesize(input: SynthesizeInput): Promise<SynthesizedAudio> {
      const response = await fetch(
        `${API_BASE}/text-to-speech/${encodeURIComponent(input.voiceId)}?output_format=${OUTPUT_FORMAT}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: input.text,
            model_id: input.model,
            voice_settings: voiceSettingsPayload(input.voiceSettings),
          }),
        },
      );

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        throw new Error(describeFailure(response.status, bodyText));
      }

      const arrayBuffer = await response.arrayBuffer();
      // ElevenLabs' convert endpoint doesn't return duration in the audio
      // response itself (it's a raw audio stream, not a JSON envelope) —
      // left null rather than computed via an MP3 frame-count pass that
      // nothing downstream actually depends on (see provider.ts's doc
      // comment on SynthesizedAudio.durationMs).
      return { audio: Buffer.from(arrayBuffer), durationMs: null };
    },
  };
}
