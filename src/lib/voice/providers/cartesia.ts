import type { SynthesizeInput, SynthesizedAudio, TTSProvider } from "@/lib/voice/provider";

const API_BASE = "https://api.cartesia.ai";
const API_VERSION = "2025-04-16";

/** MP3 output at the same 64kbps mono this app already standardizes on for every other provider's clips (see providers/elevenlabs.ts's OUTPUT_FORMAT). */
const OUTPUT_FORMAT = {
  container: "mp3",
  bit_rate: 64000,
  sample_rate: 44100,
} as const;

function describeFailure(status: number, bodyText: string): string {
  if (status === 401) return "Cartesia rejected the API key (401 Unauthorized).";
  if (status === 429) return "Cartesia rate limit or quota exceeded (429).";
  if (status === 400)
    return `Cartesia rejected the request as malformed (400): ${bodyText.slice(0, 200)}`;
  return `Cartesia request failed (${status}): ${bodyText.slice(0, 200)}`;
}

/**
 * The only file that talks to Cartesia's HTTP API directly — everything
 * else in this app goes through the TTSProvider interface, exactly like
 * providers/elevenlabs.ts. `input.model` carries Cartesia's model_id (e.g.
 * "sonic-2"), admin-configured in the shared elevenlabs_settings.model field
 * (see .env.example). `input.voiceSettings` is unused — Cartesia has no
 * stability/similarity-boost equivalent, only the request fields below.
 */
export function createCartesiaProvider(apiKey: string): TTSProvider {
  return {
    name: "cartesia",
    async synthesize(input: SynthesizeInput): Promise<SynthesizedAudio> {
      const response = await fetch(`${API_BASE}/tts/bytes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Cartesia-Version": API_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_id: input.model,
          transcript: input.text,
          voice: { mode: "id", id: input.voiceId },
          output_format: OUTPUT_FORMAT,
        }),
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        throw new Error(describeFailure(response.status, bodyText));
      }

      const arrayBuffer = await response.arrayBuffer();
      // /tts/bytes returns raw audio bytes, not a JSON envelope — no
      // duration field to read, left null like every other provider that
      // returns a raw stream (see providers/elevenlabs.ts).
      return { audio: Buffer.from(arrayBuffer), durationMs: null };
    },
  };
}

export interface CartesiaVoiceSummary {
  id: string;
  name: string;
  description: string | null;
  language: string | null;
  gender: string | null;
}

/**
 * Lists voices from Cartesia's public catalog (`is_owner=false` — the
 * shared library every account can use, as opposed to a private clone) for
 * the admin "browse voices" picker (cartesia-actions.ts). Deliberately not
 * part of the TTSProvider interface — synthesis and catalog browsing are
 * different concerns, and no other provider adapter needs this shape.
 */
export async function listCartesiaVoices(
  apiKey: string,
  opts: { query?: string; language?: string } = {},
): Promise<CartesiaVoiceSummary[]> {
  const params = new URLSearchParams({ limit: "50", is_owner: "false" });
  if (opts.query) params.set("q", opts.query);
  if (opts.language) params.set("language", opts.language);

  const response = await fetch(`${API_BASE}/voices?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Cartesia-Version": API_VERSION,
    },
  });
  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(describeFailure(response.status, bodyText));
  }

  const json = await response.json();
  const items: unknown[] = Array.isArray(json) ? json : (json?.data ?? []);
  return items.map((raw) => {
    const v = raw as Record<string, unknown>;
    return {
      id: String(v.id),
      name: String(v.name ?? v.id),
      description: typeof v.description === "string" ? v.description : null,
      language: typeof v.language === "string" ? v.language : null,
      gender: typeof v.gender === "string" ? v.gender : null,
    };
  });
}
