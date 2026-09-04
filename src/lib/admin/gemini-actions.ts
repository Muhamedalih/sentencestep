"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { createClient } from "@/lib/supabase/server";
import { GEMINI_COLLECTION, GEMINI_VOICES } from "@/lib/voice/gemini-catalog";
import { createGeminiProvider } from "@/lib/voice/providers/gemini";

/** Cheapest, fastest Gemini TTS model — used for previews regardless of which model is configured as the active narration default, since a preview just needs to demonstrate the voice, not the exact production model. */
const PREVIEW_MODEL = "gemini-2.5-flash-preview-tts";

export interface AddGeminiVoiceInput {
  id: string;
  name: string;
  /** One of Gemini's documented prebuilt voice names, e.g. "Kore". */
  providerVoiceId: string;
  gender: "female" | "male";
  accent: string;
  description?: string | null;
}

/** Registers a `voices` row pointing at a real Gemini prebuilt voice name — same shape as addEdgeTtsVoiceAction/addAzureVoiceAction (no per-account cloning step, just a real documented voice name). */
export async function addGeminiVoiceAction(input: AddGeminiVoiceInput): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  if (!input.id.trim() || !input.name.trim() || !input.providerVoiceId.trim()) {
    return { error: "Name and voice name are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("voices").insert({
    id: input.id.trim(),
    name: input.name.trim(),
    source: "gemini",
    provider_voice_id: input.providerVoiceId.trim(),
    gender: input.gender,
    accent: input.accent.trim() || "Neutral",
    language: "en",
    description: input.description?.trim() || null,
    collection: GEMINI_COLLECTION,
  });
  if (error) {
    if (error.code === "23505") return { error: "A voice with that id already exists." };
    return { error: "Couldn't add the voice. Please try again." };
  }

  void logAdminAction("voice.added", "voice", input.id, { name: input.name, source: "gemini" });
  revalidatePath("/admin/voice");
  return { success: `Added "${input.name}".` };
}

/** One-click bulk registration of GEMINI_VOICES — mirrors seedEdgeTtsVoicesAction's exact "safe to re-run" shape. */
export async function seedGeminiVoicesAction(): Promise<
  ActionResult & { added?: number; skipped?: number }
> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("voices")
    .select("id")
    .eq("collection", GEMINI_COLLECTION);
  if (existingError) return { error: "Couldn't check the existing collection. Please try again." };

  const existingIds = new Set((existing ?? []).map((row) => row.id));
  const toInsert = GEMINI_VOICES.filter((voice) => !existingIds.has(voice.id));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from("voices").insert(
      toInsert.map((voice) => ({
        id: voice.id,
        name: voice.name,
        source: "gemini",
        provider_voice_id: voice.providerVoiceId,
        gender: voice.gender,
        accent: voice.accent,
        language: "en",
        description: voice.description,
        collection: GEMINI_COLLECTION,
      })),
    );
    if (insertError) return { error: "Couldn't add the voices. Please try again." };
  }

  void logAdminAction("voice.seeded", "voice", null, { source: "gemini", added: toInsert.length });
  revalidatePath("/admin/voice");
  return {
    success:
      toInsert.length === 0
        ? "Suggested Gemini voices are already all registered."
        : `Added ${toInsert.length} voice(s).`,
    added: toInsert.length,
    skipped: existingIds.size,
  };
}

/**
 * Ephemeral preview — calls Gemini directly and returns the audio as a
 * base64 data URI, never touching Storage or voice_audio_cache. Mirrors
 * previewEdgeTtsAction/previewAzureAction's exact "nothing to clean up,
 * always exercises this specific provider" guarantees.
 */
export async function previewGeminiAction(input: {
  text: string;
  providerVoiceId: string;
}): Promise<ActionResult & { audioDataUri?: string }> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const text = input.text.trim();
  if (!text || text.length > 500) return { error: "Preview text must be 1-500 characters." };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { error: "GEMINI_API_KEY is not configured." };

  const provider = createGeminiProvider(apiKey);
  try {
    const { audio } = await provider.synthesize({
      text,
      voiceId: input.providerVoiceId,
      model: PREVIEW_MODEL,
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
