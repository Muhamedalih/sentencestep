import { FISH_AUDIO_MODEL } from "@/lib/voice/content-provider-map";
import { fetchWithTimeout } from "@/lib/voice/providers/fetch-with-timeout";
import type { SynthesizeInput, SynthesizedAudio, TTSProvider } from "@/lib/voice/provider";

const API_BASE = "https://api.fish.audio";

/** 128kbps mono MP3 — the exact output the approved Fish Audio samples (2026-10-11) were generated at. */
const MP3_BITRATE = 128;

function describeFailure(status: number, bodyText: string): string {
  if (status === 401) return "Fish Audio rejected the API key (401 Unauthorized).";
  if (status === 402)
    return `Fish Audio wants a paid balance for this request (402) — the free model (${FISH_AUDIO_MODEL}) may have been withdrawn or isn't available to this account.`;
  if (status === 429) return "Fish Audio rate limit exceeded (429) — too many requests at once.";
  if (status === 503) return "Fish Audio is overloaded right now (503). Try again shortly.";
  if (status === 400 || status === 422)
    return `Fish Audio rejected the request (${status}): ${bodyText.slice(0, 200)}`;
  return `Fish Audio request failed (${status}): ${bodyText.slice(0, 200)}`;
}

/**
 * The only file that talks to Fish Audio's HTTP API directly — everything
 * else goes through the TTSProvider interface, exactly like
 * providers/cartesia.ts. `input.voiceId` is the Fish voice's `reference_id`
 * (a voice from fish.audio's public library; empty means Fish's default
 * voice). `input.model` carries the `model` request header —
 * FISH_AUDIO_MODEL ("s2.1-pro-free") in practice, the $0 tier (see
 * content-provider-map.ts for its limits and why it's pinned).
 * `input.voiceSettings` is unused: Fish has no stability/similarity knobs,
 * and the approved samples used its defaults.
 */
export function createFishAudioProvider(apiKey: string): TTSProvider {
  return {
    name: "fish-audio",
    async synthesize(input: SynthesizeInput): Promise<SynthesizedAudio> {
      const body: Record<string, unknown> = {
        text: input.text,
        format: "mp3",
        mp3_bitrate: MP3_BITRATE,
      };
      if (input.voiceId) body.reference_id = input.voiceId;

      const response = await fetchWithTimeout(`${API_BASE}/v1/tts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          model: input.model,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => "");
        throw new Error(describeFailure(response.status, bodyText));
      }

      const audio = Buffer.from(await response.arrayBuffer());
      if (audio.length === 0) throw new Error("Fish Audio returned no audio data.");
      return { audio, durationMs: null };
    },
  };
}

export type FishAudioSort = "score" | "task_count" | "created_at";

export interface FishAudioVoiceSummary {
  /** Fish's own model id — what goes in `reference_id` (voices.provider_voice_id). */
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  /** A public sample clip on Fish's CDN, or null. Played through a server action (see fish-audio-actions.ts) because the site's CSP only allows media from its own origins. */
  sampleAudioUrl: string | null;
  likeCount: number;
  usageCount: number;
  author: string | null;
  gender: "female" | "male" | null;
}

const ACCENT_TAG =
  /^(american|british|australian|irish|scottish|canadian|indian|south african|new zealand)\b|accent/i;

/** female/male from a library voice's tags, or null when it doesn't say. */
export function fishVoiceGender(tags: readonly string[]): "female" | "male" | null {
  const lower = tags.map((tag) => tag.toLowerCase());
  if (lower.includes("female")) return "female";
  if (lower.includes("male")) return "male";
  return null;
}

/** The accent a library voice advertises in its tags (e.g. "Indian Accent" -> "Indian"), or "Neutral". */
export function fishVoiceAccent(tags: readonly string[]): string {
  const hit = tags.find((tag) => ACCENT_TAG.test(tag.trim()));
  if (!hit) return "Neutral";
  const cleaned = hit
    .replace(/accent/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Neutral";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Tags are interpolated into a query string — keep them to the plain words the library actually uses. */
const SAFE_TAG = /^[A-Za-z][A-Za-z0-9 \-]{0,30}$/;

/**
 * Lists English voices from Fish Audio's public library — the same catalog
 * fish.audio/discovery shows. `sort: "score"` is the "recommended" order
 * (what the site's Discover page leads with). `GET /model` is what the
 * dashboard itself calls; verified 2026-10-11 against the live API with a
 * free-tier key (returns `{ items, has_more, total }`). Deliberately not
 * part of the TTSProvider interface — same reasoning as
 * providers/cartesia.ts's listCartesiaVoices.
 */
export async function listFishAudioVoices(
  apiKey: string,
  opts: {
    query?: string;
    tags?: string[];
    sort?: FishAudioSort;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<{ voices: FishAudioVoiceSummary[]; hasMore: boolean }> {
  const params = new URLSearchParams({
    page_size: String(opts.pageSize ?? 20),
    page_number: String(opts.page ?? 1),
    language: "en",
    sort_by: opts.sort ?? "score",
    self: "false",
  });
  if (opts.query?.trim()) params.set("title", opts.query.trim());
  for (const tag of opts.tags ?? []) {
    if (SAFE_TAG.test(tag)) params.append("tag", tag);
  }

  const response = await fetchWithTimeout(`${API_BASE}/model?${params.toString()}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(describeFailure(response.status, bodyText));
  }

  const json = (await response.json()) as { items?: unknown[]; has_more?: boolean };
  const voices: FishAudioVoiceSummary[] = [];
  for (const raw of json.items ?? []) {
    const v = raw as Record<string, unknown>;
    // Only voices that can actually synthesize: public, trained, not taken down.
    if (typeof v._id !== "string") continue;
    if (v.state !== "trained" || v.visibility !== "public" || v.dmca_taken_down === true) continue;

    const tags = Array.isArray(v.tags)
      ? v.tags.filter((t): t is string => typeof t === "string")
      : [];
    const samples = Array.isArray(v.samples) ? (v.samples as Record<string, unknown>[]) : [];
    const sampleAudio = samples.find((s) => typeof s.audio === "string")?.audio;
    const author = (v.author as Record<string, unknown> | null | undefined)?.nickname;

    voices.push({
      id: v._id,
      name: typeof v.title === "string" && v.title.trim() ? v.title.trim() : v._id,
      description: typeof v.description === "string" && v.description.trim() ? v.description : null,
      tags,
      sampleAudioUrl: typeof sampleAudio === "string" ? sampleAudio : null,
      likeCount: typeof v.like_count === "number" ? v.like_count : 0,
      usageCount: typeof v.task_count === "number" ? v.task_count : 0,
      author: typeof author === "string" && author.trim() ? author : null,
      gender: fishVoiceGender(tags),
    });
  }
  return { voices, hasMore: json.has_more === true };
}
