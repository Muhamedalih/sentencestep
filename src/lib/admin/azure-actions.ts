"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { createClient } from "@/lib/supabase/server";
import { wrapPlainTextSsml } from "@/lib/voice/direction-to-ssml";
import { createAzureProvider } from "@/lib/voice/providers/azure";

export interface AddAzureVoiceInput {
  id: string;
  name: string;
  /** The real Azure neural voice name, e.g. "en-US-AriaNeural" — see https://learn.microsoft.com/azure/ai-services/speech-service/language-support?tabs=tts for the full catalog. */
  providerVoiceId: string;
  gender: "female" | "male";
  accent: string;
  description?: string | null;
}

/** Registers a `voices` row pointing at a real Azure neural voice name — unlike ElevenLabs (addElevenLabsVoiceAction), there's no per-account voice cloning step: every Azure Speech resource has access to the same public catalog of neural voices, so this just makes SentenceStep aware of the one the admin picked. */
export async function addAzureVoiceAction(input: AddAzureVoiceInput): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  if (!input.id.trim() || !input.name.trim() || !input.providerVoiceId.trim()) {
    return { error: "Name and Azure voice name are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("voices").insert({
    id: input.id.trim(),
    name: input.name.trim(),
    source: "azure",
    provider_voice_id: input.providerVoiceId.trim(),
    gender: input.gender,
    accent: input.accent.trim() || "Neutral",
    language: "en",
    description: input.description?.trim() || null,
    collection: "azure",
  });
  if (error) {
    if (error.code === "23505") return { error: "A voice with that id already exists." };
    return { error: "Couldn't add the voice. Please try again." };
  }

  void logAdminAction("voice.added", "voice", input.id, { name: input.name, source: "azure" });
  revalidatePath("/admin/voice");
  return { success: `Added "${input.name}".` };
}

/**
 * Ephemeral preview — calls Azure directly and returns the audio as a
 * base64 data URI, never touching Storage or voice_audio_cache. Mirrors
 * previewElevenLabsAction's exact "nothing to clean up" guarantee.
 * Deliberately builds its own createAzureProvider from AZURE_SPEECH_KEY/
 * AZURE_SPEECH_REGION rather than calling getTTSProvider() — this preview
 * button is specifically for Azure voices, so it must always exercise
 * Azure, never silently fall through to whichever provider
 * provider-registry.ts currently prefers.
 */
export async function previewAzureAction(input: {
  text: string;
  providerVoiceId: string;
}): Promise<ActionResult & { audioDataUri?: string }> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const text = input.text.trim();
  if (!text || text.length > 500) return { error: "Preview text must be 1-500 characters." };

  const apiKey = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!apiKey || !region) {
    return { error: "AZURE_SPEECH_KEY/AZURE_SPEECH_REGION are not configured." };
  }

  const provider = createAzureProvider(apiKey, region);
  try {
    const { audio } = await provider.synthesize({
      text: wrapPlainTextSsml(input.providerVoiceId, text),
      voiceId: input.providerVoiceId,
      model: "azure-neural",
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
