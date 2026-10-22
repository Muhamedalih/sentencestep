import { hashText, normalizeTextForVoice } from "@/lib/voice/resolution";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

/**
 * Sentence bank: which sentences already have a stored clip. The sound-based review forms play only
 * a clip that exists — nothing is ever generated here — so this is a cache-only lookup, the batched
 * sibling of lookupCachedAudioUrl (src/lib/voice/voice-audio.ts): the same key (the voice and the
 * hash of the text, no generation version) and the same "most recently updated wins", but for all
 * the chosen sentences in ONE read instead of one each.
 */

export interface ClipRequest {
  /** What the caller calls this sentence (its id). */
  key: string;
  text: string;
  /** The narrator whose clip is wanted. */
  voiceId: string;
}

/** Key → URL of the stored clip, for the requests that have one. Throws on a database error. */
export async function fetchStoredClips(
  requests: readonly ClipRequest[],
): Promise<Map<string, string>> {
  const clips = new Map<string, string>();
  const usable = requests.filter((request) => request.text && request.voiceId);
  if (usable.length === 0) return clips;

  const hashes = new Map(
    usable.map((request) => [request.key, hashText(normalizeTextForVoice(request.text))]),
  );
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("voice_audio_cache")
    .select("voice_id, text_hash, audio_url")
    .in("text_hash", [...new Set(hashes.values())])
    .in("voice_id", [...new Set(usable.map((request) => request.voiceId))])
    .eq("status", "ready")
    .not("audio_url", "is", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;

  // Newest first, so the first row seen for a (voice, text) pair is the one that is kept.
  const byPair = new Map<string, string>();
  for (const row of data ?? []) {
    const pair = `${row.voice_id}|${row.text_hash}`;
    if (row.audio_url && !byPair.has(pair)) byPair.set(pair, row.audio_url);
  }
  for (const request of usable) {
    const url = byPair.get(`${request.voiceId}|${hashes.get(request.key)}`);
    if (url) clips.set(request.key, url);
  }
  return clips;
}
