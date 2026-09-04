"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { createClient } from "@/lib/supabase/server";
import { EDGE_TTS_COLLECTION, EDGE_TTS_VOICES } from "@/lib/voice/edge-tts-catalog";
import { wrapPlainTextProsodySsml } from "@/lib/voice/direction-to-prosody";
import { createEdgeTtsProvider } from "@/lib/voice/providers/edge-tts";

export interface AddEdgeTtsVoiceInput {
  id: string;
  name: string;
  /** The real Edge/Azure neural voice name, e.g. "en-US-AriaNeural". */
  providerVoiceId: string;
  gender: "female" | "male";
  accent: string;
  description?: string | null;
}

/** Registers a `voices` row pointing at a real Edge-TTS neural voice name — same shape as addAzureVoiceAction (no per-account cloning step, just a real public voice name). */
export async function addEdgeTtsVoiceAction(input: AddEdgeTtsVoiceInput): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  if (!input.id.trim() || !input.name.trim() || !input.providerVoiceId.trim()) {
    return { error: "Name and voice name are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("voices").insert({
    id: input.id.trim(),
    name: input.name.trim(),
    source: "edge-tts",
    provider_voice_id: input.providerVoiceId.trim(),
    gender: input.gender,
    accent: input.accent.trim() || "Neutral",
    language: "en",
    description: input.description?.trim() || null,
    collection: EDGE_TTS_COLLECTION,
  });
  if (error) {
    if (error.code === "23505") return { error: "A voice with that id already exists." };
    return { error: "Couldn't add the voice. Please try again." };
  }

  void logAdminAction("voice.added", "voice", input.id, { name: input.name, source: "edge-tts" });
  revalidatePath("/admin/voice");
  return { success: `Added "${input.name}".` };
}

/**
 * One-click bulk registration of EDGE_TTS_VOICES — mirrors
 * seedKokoroCollectionAction's "safe to re-run" shape (an already-
 * registered voice, matched by id, is skipped rather than duplicated), but
 * with no generation step: unlike Kokoro's local model, there's no sample
 * clip to render up front — each row's Preview button (EdgeTtsVoiceForm)
 * calls the live provider on demand instead.
 */
export async function seedEdgeTtsVoicesAction(): Promise<
  ActionResult & { added?: number; skipped?: number }
> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("voices")
    .select("id")
    .eq("collection", EDGE_TTS_COLLECTION);
  if (existingError) return { error: "Couldn't check the existing collection. Please try again." };

  const existingIds = new Set((existing ?? []).map((row) => row.id));
  const toInsert = EDGE_TTS_VOICES.filter((voice) => !existingIds.has(voice.id));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from("voices").insert(
      toInsert.map((voice) => ({
        id: voice.id,
        name: voice.name,
        source: "edge-tts",
        provider_voice_id: voice.providerVoiceId,
        gender: voice.gender,
        accent: voice.accent,
        language: "en",
        description: voice.description,
        collection: EDGE_TTS_COLLECTION,
      })),
    );
    if (insertError) return { error: "Couldn't add the voices. Please try again." };
  }

  void logAdminAction("voice.seeded", "voice", null, {
    source: "edge-tts",
    added: toInsert.length,
  });
  revalidatePath("/admin/voice");
  return {
    success:
      toInsert.length === 0
        ? "Suggested Edge-TTS voices are already all registered."
        : `Added ${toInsert.length} voice(s).`,
    added: toInsert.length,
    skipped: existingIds.size,
  };
}

/**
 * Ephemeral preview — calls Edge-TTS directly and returns the audio as a
 * base64 data URI, never touching Storage or voice_audio_cache. Mirrors
 * previewAzureAction's exact "nothing to clean up" guarantee — always
 * exercises Edge-TTS specifically (never routed through getTTSProvider(),
 * which could currently prefer Azure/ElevenLabs instead).
 */
export async function previewEdgeTtsAction(input: {
  text: string;
  providerVoiceId: string;
}): Promise<ActionResult & { audioDataUri?: string }> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const text = input.text.trim();
  if (!text || text.length > 500) return { error: "Preview text must be 1-500 characters." };

  const provider = createEdgeTtsProvider();
  try {
    const { audio } = await provider.synthesize({
      text: wrapPlainTextProsodySsml(input.providerVoiceId, text),
      voiceId: input.providerVoiceId,
      model: "edge-tts",
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
