"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { createClient } from "@/lib/supabase/server";
import { createCartesiaProvider, listCartesiaVoices } from "@/lib/voice/providers/cartesia";
import type { CartesiaVoiceSummary } from "@/lib/voice/providers/cartesia";

const PREVIEW_TEXT = "The old house creaked softly as the wind picked up outside.";

export interface AddCartesiaVoiceInput {
  id: string;
  name: string;
  providerVoiceId: string;
  gender: "female" | "male";
  accent: string;
  description?: string | null;
}

/** Registers a `voices` row pointing at a Cartesia voice — either picked from browseCartesiaVoicesAction's catalog list or pasted in by id, mirroring addElevenLabsVoiceAction's reasoning exactly: no generation step, the voice already exists upstream. */
export async function addCartesiaVoiceAction(input: AddCartesiaVoiceInput): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  if (!input.id.trim() || !input.name.trim() || !input.providerVoiceId.trim()) {
    return { error: "Name and Cartesia voice id are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("voices").insert({
    id: input.id.trim(),
    name: input.name.trim(),
    source: "cartesia",
    provider_voice_id: input.providerVoiceId.trim(),
    gender: input.gender,
    accent: input.accent.trim() || "Neutral",
    language: "en",
    description: input.description?.trim() || null,
    collection: "cartesia",
  });
  if (error) {
    if (error.code === "23505") return { error: "A voice with that id already exists." };
    return { error: "Couldn't add the voice. Please try again." };
  }

  void logAdminAction("voice.added", "voice", input.id, { name: input.name, source: "cartesia" });
  revalidatePath("/admin/voice");
  return { success: `Added "${input.name}".` };
}

/** Live-searches Cartesia's public voice catalog — the "browse voices" list in CartesiaVoiceForm, kept out of page-load data fetching (admin/voice/page.tsx) since it's an on-demand network call to a third party, not something every page view should pay for. */
export async function browseCartesiaVoicesAction(
  query: string,
): Promise<ActionResult & { voices?: CartesiaVoiceSummary[] }> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) return { error: "CARTESIA_API_KEY is not configured." };

  try {
    const voices = await listCartesiaVoices(apiKey, { query: query.trim() || undefined });
    return { success: "", voices };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't fetch Cartesia voices." };
  }
}

/** Ephemeral preview — mirrors previewElevenLabsAction exactly: calls the provider directly and returns a base64 data URI, never touching Storage or voice_audio_cache. */
export async function previewCartesiaAction(input: {
  text: string;
  providerVoiceId: string;
  model: string;
}): Promise<ActionResult & { audioDataUri?: string }> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const text = (input.text || PREVIEW_TEXT).trim();
  if (!text || text.length > 500) return { error: "Preview text must be 1-500 characters." };
  if (!input.model.trim()) return { error: "A Cartesia model id is required (e.g. sonic-2)." };

  // Built directly from CARTESIA_API_KEY rather than getTTSProvider() — this
  // preview button is specifically for Cartesia voices, must always
  // exercise Cartesia regardless of provider-registry.ts's precedence (see
  // previewElevenLabsAction's mirrored reasoning).
  const apiKey = process.env.CARTESIA_API_KEY;
  if (!apiKey) return { error: "CARTESIA_API_KEY is not configured." };
  const provider = createCartesiaProvider(apiKey);

  try {
    const { audio } = await provider.synthesize({
      text,
      voiceId: input.providerVoiceId,
      model: input.model,
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
