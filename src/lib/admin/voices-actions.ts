"use server";

import { revalidatePath } from "next/cache";

import { isAdmin } from "@/lib/admin/access";
import type { ActionResult } from "@/lib/admin/content-actions";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { deleteVoiceClips, voiceAudioPathFromUrl } from "@/lib/voice/storage";

async function requireAdmin(): Promise<string | null> {
  if (!(await isAdmin())) return "You don't have permission to do that.";
  return null;
}

/** The global default voice (tts_settings.default_voice_id) — additive alongside the existing Web Speech preference (saveVoiceSettings), which this never touches. Passing null clears the default, falling every lesson without its own override back to the Web Speech fallback. Deliberately independent from elevenlabs_settings.default_story_voice_id (Stories/Books' own narration default, set from its own settings form) — the two are different settings for different content, and must never be overwritten as a side effect of the other. */
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
 * The default voice for Normal lessons, Word Lists, and Mistake Review
 * (tts_settings.default_pronunciation_voice_id) — completely separate from
 * setDefaultVoiceAction above (Stories/Conversation's own default) and from
 * saveElevenLabsSettingsAction (Stories/Books' narration default). Never
 * touches either of those.
 */
export async function setDefaultPronunciationVoiceAction(voiceId: string): Promise<ActionResult> {
  const forbidden = await requireAdmin();
  if (forbidden) return { error: forbidden };
  if (!voiceId.trim()) return { error: "Pick a voice first." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tts_settings")
    .update({ default_pronunciation_voice_id: voiceId, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { error: "Couldn't save the default voice. Please try again." };

  revalidatePath("/admin/voice");
  revalidatePath("/admin/content", "layout");
  revalidatePath("/learn", "layout");
  return { success: "Default pronunciation voice saved." };
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
    supabase
      .from("tts_settings")
      .select("default_voice_id, default_pronunciation_voice_id")
      .eq("id", 1)
      .maybeSingle(),
    supabase.from("elevenlabs_settings").select("default_story_voice_id").eq("id", 1).maybeSingle(),
    supabase
      .from("lesson_speaker_voices")
      .select("lesson_id", { count: "exact", head: true })
      .eq("voice_id", voiceId),
  ]);

  if (settings?.default_voice_id === voiceId) {
    return { error: "This voice is the global default — choose a different default first." };
  }
  if (settings?.default_pronunciation_voice_id === voiceId) {
    return {
      error:
        "This voice is the default for Normal lessons, Word Lists & Mistake Review — choose a different default first.",
    };
  }
  if (elevenlabsSettings?.default_story_voice_id === voiceId) {
    return {
      error: "This voice is the default narration voice — choose a different default first.",
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
