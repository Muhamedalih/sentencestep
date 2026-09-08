"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { createClient } from "@/lib/supabase/server";
import { createHumeProvider, listHumeVoices } from "@/lib/voice/providers/hume";
import type { HumeVoiceSummary } from "@/lib/voice/providers/hume";

const PREVIEW_TEXT = "The old house creaked softly as the wind picked up outside.";

export interface AddHumeVoiceInput {
  id: string;
  name: string;
  providerVoiceId: string;
  gender: "female" | "male";
  accent: string;
  description?: string | null;
}

/** Registers a `voices` row pointing at a Hume AI voice — either picked from browseHumeVoicesAction's Voice Library list or pasted in by id, mirroring addElevenLabsVoiceAction's reasoning exactly: no generation step, the voice already exists upstream. */
export async function addHumeVoiceAction(input: AddHumeVoiceInput): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  if (!input.id.trim() || !input.name.trim() || !input.providerVoiceId.trim()) {
    return { error: "Name and Hume voice id are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("voices").insert({
    id: input.id.trim(),
    name: input.name.trim(),
    source: "hume",
    provider_voice_id: input.providerVoiceId.trim(),
    gender: input.gender,
    accent: input.accent.trim() || "Neutral",
    language: "en",
    description: input.description?.trim() || null,
    collection: "hume",
  });
  if (error) {
    if (error.code === "23505") return { error: "A voice with that id already exists." };
    return { error: "Couldn't add the voice. Please try again." };
  }

  void logAdminAction("voice.added", "voice", input.id, { name: input.name, source: "hume" });
  revalidatePath("/admin/voice");
  return { success: `Added "${input.name}".` };
}

/** Live-searches Hume's shared Voice Library — the "browse voices" list in HumeVoiceForm, kept out of page-load data fetching (admin/voice/page.tsx) since it's an on-demand network call to a third party, not something every page view should pay for. */
export async function browseHumeVoicesAction(): Promise<
  ActionResult & { voices?: HumeVoiceSummary[] }
> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const apiKey = process.env.HUME_API_KEY;
  if (!apiKey) return { error: "HUME_API_KEY is not configured." };

  try {
    const voices = await listHumeVoices(apiKey);
    return { success: "", voices };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't fetch Hume voices." };
  }
}

/** Ephemeral preview — mirrors previewElevenLabsAction exactly: calls the provider directly and returns a base64 data URI, never touching Storage or voice_audio_cache. */
export async function previewHumeAction(input: {
  text: string;
  providerVoiceId: string;
}): Promise<ActionResult & { audioDataUri?: string }> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const text = (input.text || PREVIEW_TEXT).trim();
  if (!text || text.length > 500) return { error: "Preview text must be 1-500 characters." };

  // Built directly from HUME_API_KEY rather than getTTSProvider() — this
  // preview button is specifically for Hume voices, must always exercise
  // Hume regardless of provider-registry.ts's precedence (see
  // previewElevenLabsAction's mirrored reasoning).
  const apiKey = process.env.HUME_API_KEY;
  if (!apiKey) return { error: "HUME_API_KEY is not configured." };
  const provider = createHumeProvider(apiKey);

  try {
    const { audio } = await provider.synthesize({
      text,
      voiceId: input.providerVoiceId,
      model: "",
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
