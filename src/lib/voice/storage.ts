import { randomUUID } from "node:crypto";

import { createServiceRoleClient } from "@/lib/supabase/service-role";

const BUCKET = "voice-audio";

/**
 * Uploads a generated MP3 Buffer to the voice-audio bucket and returns its
 * public URL — the storage half of both the admin preview-seed flow
 * (voices-actions.ts) and the on-demand lesson-audio flow (voice-audio.ts).
 * Uses the service-role client (bypasses the bucket's admin-only RLS
 * policies) because the on-demand path is triggered by an ordinary
 * learner's session, not an admin one — same reasoning as
 * voice_audio_cache's own service-role writes.
 */
export async function uploadVoiceClip(path: string, mp3: Buffer): Promise<string> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, mp3, { contentType: "audio/mpeg", upsert: false });
  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return publicUrl;
}

/** A fresh, collision-proof path for one voice's cached generated clip. */
export function generatedClipPath(voiceId: string): string {
  return `generated/${voiceId}/${randomUUID()}.mp3`;
}

/**
 * Same bucket, a separate `generated/elevenlabs/` prefix — kept apart from
 * generatedClipPath's Kokoro-oriented `generated/<voiceId>/` paths purely
 * for easy manual inspection of storage usage per provider, not because
 * either provider's clips need different access rules.
 */
export function generatedElevenLabsClipPath(voiceId: string): string {
  return `generated/elevenlabs/${voiceId}/${randomUUID()}.mp3`;
}

/** Same bucket, a separate `generated/azure/` prefix — mirrors generatedElevenLabsClipPath's per-provider prefix convention (see its own doc comment) for the Azure Speech narration pipeline. */
export function generatedAzureClipPath(voiceId: string): string {
  return `generated/azure/${voiceId}/${randomUUID()}.mp3`;
}

/** Same bucket, a separate `generated/gemini/` prefix — mirrors generatedAzureClipPath's per-provider prefix convention for the Gemini narration pipeline (see providers/gemini.ts). */
export function generatedGeminiClipPath(voiceId: string): string {
  return `generated/gemini/${voiceId}/${randomUUID()}.mp3`;
}

/** Same bucket, a separate `generated/edge-tts/` prefix — mirrors generatedAzureClipPath's per-provider prefix convention for the free, zero-config Edge-TTS narration pipeline (see providers/edge-tts.ts). */
export function generatedEdgeTtsClipPath(voiceId: string): string {
  return `generated/edge-tts/${voiceId}/${randomUUID()}.mp3`;
}

/** The path for a voice's one admin-preview sample — deterministic (not UUID-suffixed) so re-seeding the same voice overwrites its old sample instead of accumulating orphans. */
export function samplePath(voiceId: string): string {
  return `samples/${voiceId}.mp3`;
}

/**
 * Recovers the bucket-relative path from a voice-audio public URL —
 * mirrors illustrationPathFromUrl's exact reasoning in content-actions.ts
 * (this bucket has no SELECT/list policy either, so deriving the path from
 * an already-known URL is what makes cleanup possible without one).
 */
export function voiceAudioPathFromUrl(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
}

/** Best-effort delete — used when removing a voice (its sample + every cached generated clip). A failed cleanup leaves an orphaned Storage object, never a broken reference, so it's logged, not thrown. */
export async function deleteVoiceClips(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = createServiceRoleClient();
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) console.error("[voice] deleteVoiceClips: Storage remove failed", { paths, error });
}
