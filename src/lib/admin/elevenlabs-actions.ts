"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/admin/access";
import { logAdminAction } from "@/lib/admin/audit-log";
import type { ActionResult } from "@/lib/admin/content-actions";
import { createClient } from "@/lib/supabase/server";
import { getTTSProvider } from "@/lib/voice/provider-registry";

/** Mirrors elevenlabs_settings' own CHECK constraints (20250203000000_elevenlabs_voice_engine.sql) — validated here too so a bad value is rejected with a specific message instead of a raw Postgres constraint-violation error. */
const STABILITY_RANGE = { min: 0, max: 1 };
const SIMILARITY_BOOST_RANGE = { min: 0, max: 1 };
const STYLE_RANGE = { min: 0, max: 1 };
const SPEED_RANGE = { min: 0.7, max: 1.2 };

function inRange(value: number, range: { min: number; max: number }): boolean {
  return Number.isFinite(value) && value >= range.min && value <= range.max;
}

function validateVoiceSettingsInput(input: {
  stability: number;
  similarityBoost: number;
  style: number;
  speed: number;
}): string | null {
  if (!inRange(input.stability, STABILITY_RANGE)) {
    return `Stability must be between ${STABILITY_RANGE.min} and ${STABILITY_RANGE.max}.`;
  }
  if (!inRange(input.similarityBoost, SIMILARITY_BOOST_RANGE)) {
    return `Similarity boost must be between ${SIMILARITY_BOOST_RANGE.min} and ${SIMILARITY_BOOST_RANGE.max}.`;
  }
  if (!inRange(input.style, STYLE_RANGE)) {
    return `Style must be between ${STYLE_RANGE.min} and ${STYLE_RANGE.max}.`;
  }
  if (!inRange(input.speed, SPEED_RANGE)) {
    return `Speed must be between ${SPEED_RANGE.min} and ${SPEED_RANGE.max}.`;
  }
  return null;
}

export interface AddElevenLabsVoiceInput {
  id: string;
  name: string;
  providerVoiceId: string;
  gender: "female" | "male";
  accent: string;
  description?: string | null;
}

/** Registers a `voices` row pointing at an ElevenLabs voice the admin already created/cloned in the ElevenLabs dashboard — unlike Kokoro's curated-catalog seed (seedKokoroCollectionAction), there's no generation step here: the voice already exists upstream, this just makes SentenceStep aware of it. */
export async function addElevenLabsVoiceAction(
  input: AddElevenLabsVoiceInput,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  if (!input.id.trim() || !input.name.trim() || !input.providerVoiceId.trim()) {
    return { error: "Name and ElevenLabs voice id are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("voices").insert({
    id: input.id.trim(),
    name: input.name.trim(),
    source: "elevenlabs",
    provider_voice_id: input.providerVoiceId.trim(),
    gender: input.gender,
    accent: input.accent.trim() || "Neutral",
    language: "en",
    description: input.description?.trim() || null,
    collection: "elevenlabs",
  });
  if (error) {
    if (error.code === "23505") return { error: "A voice with that id already exists." };
    return { error: "Couldn't add the voice. Please try again." };
  }

  void logAdminAction("voice.added", "voice", input.id, { name: input.name, source: "elevenlabs" });
  revalidatePath("/admin/voice");
  return { success: `Added "${input.name}".` };
}

export interface SaveElevenLabsSettingsInput {
  model: string;
  defaultStoryVoiceId: string | null;
  stability: number;
  similarityBoost: number;
  style: number;
  speed: number;
  useSpeakerBoost: boolean;
}

export async function saveElevenLabsSettingsAction(
  input: SaveElevenLabsSettingsInput,
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const validationError = validateVoiceSettingsInput(input);
  if (validationError) return { error: validationError };

  const supabase = await createClient();
  const { error } = await supabase
    .from("elevenlabs_settings")
    .update({
      model: input.model,
      default_story_voice_id: input.defaultStoryVoiceId,
      stability: input.stability,
      similarity_boost: input.similarityBoost,
      style: input.style,
      speed: input.speed,
      use_speaker_boost: input.useSpeakerBoost,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) return { error: "Couldn't save ElevenLabs settings. Please try again." };

  void logAdminAction("elevenlabs_settings.updated", "elevenlabs_settings", null);
  revalidatePath("/admin/voice");
  return { success: "ElevenLabs settings saved." };
}

/**
 * Ephemeral preview — calls the provider directly and returns the audio as
 * a base64 data URI in the response, never touching Storage or
 * voice_audio_cache. This is what makes "preview never permanently saves"
 * true by construction rather than by convention: there is nothing here to
 * clean up afterward.
 */
export async function previewElevenLabsAction(input: {
  text: string;
  providerVoiceId: string;
  model: string;
  stability: number;
  similarityBoost: number;
  style: number;
  speed: number;
  useSpeakerBoost: boolean;
}): Promise<ActionResult & { audioDataUri?: string }> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const text = input.text.trim();
  if (!text || text.length > 500) return { error: "Preview text must be 1-500 characters." };

  const validationError = validateVoiceSettingsInput(input);
  if (validationError) return { error: validationError };

  const provider = getTTSProvider();
  if (!provider) return { error: "ELEVENLABS_API_KEY is not configured." };

  try {
    const { audio } = await provider.synthesize({
      text,
      voiceId: input.providerVoiceId,
      model: input.model,
      voiceSettings: {
        stability: input.stability,
        similarityBoost: input.similarityBoost,
        style: input.style,
        speed: input.speed,
        useSpeakerBoost: input.useSpeakerBoost,
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

export interface SpeakerVoiceMapping {
  speaker: string;
  voiceId: string;
}

/** Persists a Conversation lesson's speaker -> voice assignments, replacing any existing mapping wholesale (the admin form always submits the complete set for this lesson, matching saveLesson's own delete-and-reinsert convention for sentences). */
export async function setSpeakerVoicesAction(
  lessonId: string,
  mappings: SpeakerVoiceMapping[],
): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { error: deleteError } = await supabase
    .from("lesson_speaker_voices")
    .delete()
    .eq("lesson_id", lessonId);
  if (deleteError) return { error: "Couldn't update speaker voices. Please try again." };

  const rows = mappings
    .filter((m) => m.voiceId)
    .map((m) => ({ lesson_id: lessonId, speaker: m.speaker, voice_id: m.voiceId }));
  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("lesson_speaker_voices").insert(rows);
    if (insertError) return { error: "Couldn't save speaker voices. Please try again." };
  }

  revalidatePath(`/admin/content/${lessonId}/edit`);
  return { success: "Speaker voices saved." };
}
