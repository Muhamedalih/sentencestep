"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { createClient } from "@/lib/supabase/server";
import { FISH_AUDIO_MODEL } from "@/lib/voice/content-provider-map";
import {
  createFishAudioProvider,
  listFishAudioVoices,
  type FishAudioSort,
  type FishAudioVoiceSummary,
} from "@/lib/voice/providers/fish-audio";

const PREVIEW_TEXT = "apple, comfortable, through.";

/** Fish voice ids are 32 hex characters today; accept the looser safe charset in case that changes. */
const FISH_VOICE_ID = /^[A-Za-z0-9_-]{8,64}$/;

/** Catalog samples live on Fish's own CDN — the only host the sample-playback action will fetch from. */
const SAMPLE_HOST = "platform.r2.fish.audio";
const MAX_SAMPLE_BYTES = 2_000_000;

export interface AddFishAudioVoiceInput {
  name: string;
  providerVoiceId: string;
  gender: "female" | "male";
  accent: string;
  description?: string | null;
}

/** Registers a `voices` row pointing at a Fish Audio library voice — either picked from browseFishAudioVoicesAction or pasted in by id, mirroring addCartesiaVoiceAction exactly: no generation step, the voice already exists upstream. The row id is derived from the Fish id so adding the same voice twice is a clean duplicate error. */
export async function addFishAudioVoiceAction(
  input: AddFishAudioVoiceInput,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const providerVoiceId = input.providerVoiceId.trim();
  if (!input.name.trim() || !providerVoiceId) {
    return { error: "Name and Fish Audio voice id are required." };
  }
  if (!FISH_VOICE_ID.test(providerVoiceId)) {
    return { error: "That doesn't look like a Fish Audio voice id." };
  }

  const id = `fish-audio-${providerVoiceId.toLowerCase()}`;
  const supabase = await createClient();
  const { error } = await supabase.from("voices").insert({
    id,
    name: input.name.trim().slice(0, 80),
    source: "fish-audio",
    provider_voice_id: providerVoiceId,
    gender: input.gender,
    accent: input.accent.trim() || "Neutral",
    language: "en",
    description: input.description?.trim().slice(0, 500) || null,
    collection: "fish-audio",
  });
  if (error) {
    if (error.code === "23505") return { error: "That voice is already added." };
    return { error: "Couldn't add the voice. Please try again." };
  }

  void logAdminAction("voice.added", "voice", id, { name: input.name, source: "fish-audio" });
  revalidatePath("/admin/voice");
  return { success: `Added "${input.name}".` };
}

export interface FishAudioBrowseInput {
  query?: string;
  tags?: string[];
  sort?: FishAudioSort;
  page?: number;
}

/** Live-searches Fish Audio's public voice library — "Suggested voices" is simply this with the default `score` (recommended) order and no filters. Kept out of page-load data fetching (admin/voice/page.tsx) since it's an on-demand call to a third party. */
export async function browseFishAudioVoicesAction(
  input: FishAudioBrowseInput,
): Promise<ActionResult & { voices?: FishAudioVoiceSummary[]; hasMore?: boolean }> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const apiKey = process.env.FISH_AUDIO_API_KEY;
  if (!apiKey) return { error: "FISH_AUDIO_API_KEY is not configured." };

  const sort: FishAudioSort =
    input.sort === "task_count" || input.sort === "created_at" ? input.sort : "score";
  try {
    const { voices, hasMore } = await listFishAudioVoices(apiKey, {
      query: input.query,
      tags: (input.tags ?? []).slice(0, 4),
      sort,
      page: Math.min(Math.max(Math.trunc(input.page ?? 1), 1), 50),
    });
    return { success: "", voices, hasMore };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't fetch Fish Audio voices." };
  }
}

/** Ephemeral preview of a registered (or about-to-be-added) voice — calls Fish directly with the free model and returns a base64 data URI, never touching Storage or voice_audio_cache. */
export async function previewFishAudioAction(input: {
  text?: string;
  providerVoiceId: string;
}): Promise<ActionResult & { audioDataUri?: string }> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const text = (input.text || PREVIEW_TEXT).trim();
  if (!text || text.length > 300) return { error: "Preview text must be 1-300 characters." };
  if (input.providerVoiceId && !FISH_VOICE_ID.test(input.providerVoiceId)) {
    return { error: "That doesn't look like a Fish Audio voice id." };
  }

  const apiKey = process.env.FISH_AUDIO_API_KEY;
  if (!apiKey) return { error: "FISH_AUDIO_API_KEY is not configured." };

  try {
    const { audio } = await createFishAudioProvider(apiKey).synthesize({
      text,
      voiceId: input.providerVoiceId,
      model: FISH_AUDIO_MODEL,
      voiceSettings: {
        stability: 0.5,
        similarityBoost: 0.75,
        style: 0,
        speed: 1,
        useSpeakerBoost: true,
      },
    });
    return {
      success: "Preview ready.",
      audioDataUri: `data:audio/mpeg;base64,${audio.toString("base64")}`,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Preview generation failed." };
  }
}

/**
 * Plays a library voice's own sample clip BEFORE it is added — free (no
 * synthesis). Fetched server-side and returned as a data URI because the
 * site's Content-Security-Policy only allows media from its own origins
 * (src/middleware.ts); the URL is checked against Fish's CDN host so this
 * can never be used to fetch arbitrary addresses.
 */
export async function fetchFishAudioSampleAction(
  sampleUrl: string,
): Promise<ActionResult & { audioDataUri?: string }> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  let url: URL;
  try {
    url = new URL(sampleUrl);
  } catch {
    return { error: "Invalid sample URL." };
  }
  if (url.protocol !== "https:" || url.hostname !== SAMPLE_HOST) {
    return { error: "That sample isn't hosted on Fish Audio's CDN." };
  }

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) return { error: `Couldn't load the sample (${response.status}).` };
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length === 0 || bytes.length > MAX_SAMPLE_BYTES) {
      return { error: "The sample is empty or too large to play." };
    }
    return { success: "", audioDataUri: `data:audio/mpeg;base64,${bytes.toString("base64")}` };
  } catch {
    return { error: "Couldn't load the sample. Please try again." };
  }
}
