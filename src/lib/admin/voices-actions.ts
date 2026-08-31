"use server";

import { revalidatePath } from "next/cache";

import { isAdmin } from "@/lib/admin/access";
import type { ActionResult } from "@/lib/admin/content-actions";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { KOKORO_COLLECTION, KOKORO_PREVIEW_TEXT, KOKORO_VOICES } from "@/lib/voice/kokoro-catalog";
import { generateVoiceClip } from "@/lib/voice/generation";
import {
  deleteVoiceClips,
  samplePath,
  uploadVoiceClip,
  voiceAudioPathFromUrl,
} from "@/lib/voice/storage";

async function requireAdmin(): Promise<string | null> {
  if (!(await isAdmin())) return "You don't have permission to do that.";
  return null;
}

/**
 * Generates and stores the one real preview sample per Kokoro voice, then
 * inserts each voice's metadata row — the only place real Kokoro inference
 * runs outside the on-demand lesson-audio path (voice-audio.ts). Safe to
 * re-run: an already-seeded voice (matched by id) is skipped entirely
 * rather than re-generated, so retrying after a partial failure only does
 * the remaining work. Deliberately generates one voice at a time, not in
 * parallel — the model is a single shared in-process resource (see
 * generation.ts), and running 10 CPU inferences concurrently would only
 * contend with each other, not finish faster.
 */
export async function seedKokoroCollectionAction(): Promise<
  ActionResult & { generated?: number; skipped?: number }
> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("voices")
    .select("id")
    .eq("collection", KOKORO_COLLECTION);
  if (existingError) return { error: "Couldn't check the existing collection. Please try again." };

  const existingIds = new Set((existing ?? []).map((row) => row.id));
  const toGenerate = KOKORO_VOICES.filter((voice) => !existingIds.has(voice.id));

  let generated = 0;
  const failures: string[] = [];

  for (const voice of toGenerate) {
    try {
      const { mp3 } = await generateVoiceClip(KOKORO_PREVIEW_TEXT, voice.providerVoiceId);
      const sampleAudioUrl = await uploadVoiceClip(samplePath(voice.id), mp3);

      const { error: insertError } = await supabase.from("voices").insert({
        id: voice.id,
        name: voice.name,
        source: "kokoro",
        provider_voice_id: voice.providerVoiceId,
        gender: voice.gender,
        accent: voice.accent,
        language: "en",
        description: voice.description,
        collection: KOKORO_COLLECTION,
        sample_audio_url: sampleAudioUrl,
      });
      if (insertError) throw insertError;
      generated += 1;
    } catch (error) {
      console.error("[admin] seedKokoroCollectionAction: voice failed", {
        voiceId: voice.id,
        error,
      });
      failures.push(voice.name);
    }
  }

  revalidatePath("/admin/voice");

  if (failures.length > 0) {
    return {
      error: `Generated ${generated} voice(s); failed: ${failures.join(", ")}. Re-running will only retry what's missing.`,
      generated,
      skipped: existingIds.size,
    };
  }
  return {
    success:
      generated === 0
        ? "Kokoro Natural Learning collection already fully seeded."
        : `Generated ${generated} new voice(s).`,
    generated,
    skipped: existingIds.size,
  };
}

/** The global default voice — additive alongside the existing Web Speech preference (saveVoiceSettings), which this never touches. Passing null clears the default, falling every lesson without its own override back to the Web Speech fallback exactly as before any Kokoro voice existed. */
export async function setDefaultVoiceAction(voiceId: string | null): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tts_settings")
    .update({ default_voice_id: voiceId, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { error: "Couldn't save the default voice. Please try again." };

  revalidatePath("/admin/voice");
  revalidatePath("/admin/content", "layout");
  return { success: "Default voice saved." };
}

/**
 * Blocks deletion outright when the voice is in use (as the global default
 * or a lesson override) rather than silently reassigning affected lessons
 * — the simpler of the two options the voice system was designed to
 * support (see the migration's own doc comment), and the one that can
 * never surprise an admin by quietly changing a lesson's voice out from
 * under them. Cleans up every Storage object this voice ever produced
 * (its preview sample and all cached generated clips) before deleting the
 * row; voice_audio_cache rows themselves cascade-delete at the database
 * level.
 */
export async function deleteVoiceAction(voiceId: string): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };

  const supabase = await createClient();

  const [
    { count: lessonCount },
    { data: settings },
    { data: elevenlabsSettings },
    { count: speakerCount },
  ] = await Promise.all([
    supabase.from("lessons").select("id", { count: "exact", head: true }).eq("voice_id", voiceId),
    supabase.from("tts_settings").select("default_voice_id").eq("id", 1).maybeSingle(),
    supabase.from("elevenlabs_settings").select("default_story_voice_id").eq("id", 1).maybeSingle(),
    supabase
      .from("lesson_speaker_voices")
      .select("lesson_id", { count: "exact", head: true })
      .eq("voice_id", voiceId),
  ]);

  if (settings?.default_voice_id === voiceId) {
    return { error: "This voice is the global default — choose a different default first." };
  }
  if (elevenlabsSettings?.default_story_voice_id === voiceId) {
    return {
      error: "This voice is the default ElevenLabs story voice — choose a different default first.",
    };
  }
  if (lessonCount && lessonCount > 0) {
    return {
      error: `This voice is assigned to ${lessonCount} lesson(s) — switch them to a different voice (or "Use Default Voice") before deleting it.`,
    };
  }
  if (speakerCount && speakerCount > 0) {
    return {
      error: `This voice is assigned to ${speakerCount} conversation speaker(s) — reassign them before deleting it.`,
    };
  }

  const { data: voice, error: voiceError } = await supabase
    .from("voices")
    .select("sample_audio_url")
    .eq("id", voiceId)
    .maybeSingle();
  if (voiceError || !voice) return { error: "That voice no longer exists." };

  // Service-role: voice_audio_cache has no admin session reading its rows
  // in the normal app, so this reuses the same trusted client the
  // on-demand generation path writes with, purely for this one cleanup
  // read.
  const serviceClient = createServiceRoleClient();
  const { data: cachedClips } = await serviceClient
    .from("voice_audio_cache")
    .select("audio_url")
    .eq("voice_id", voiceId);

  const paths = [voice.sample_audio_url, ...(cachedClips ?? []).map((row) => row.audio_url)]
    .filter((url): url is string => Boolean(url))
    .map(voiceAudioPathFromUrl)
    .filter((path): path is string => Boolean(path));
  await deleteVoiceClips(paths);

  const { error: deleteError } = await supabase.from("voices").delete().eq("id", voiceId);
  if (deleteError) return { error: "Couldn't delete the voice. Please try again." };

  revalidatePath("/admin/voice");
  return { success: "Voice deleted." };
}
