import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { hashText, normalizeTextForVoice } from "@/lib/voice/resolution";

/**
 * Which voice a learner hears for a Word Lists group, and how ready a
 * group's own voice is — the learner-side half of word_groups.voice_id (the
 * admin form and generateWordGroupVoiceDraft already honoured it; the
 * learner pages used to resolve every group against the site-wide default
 * only, so a per-group voice never actually reached anyone).
 *
 * Deliberately NOT in a "use server" module — see word-list-word-audio.ts's
 * doc comment: everything exported from one is a public endpoint. This is
 * imported only by server components that already hold the group's words.
 */

/** voice_audio_cache reads in batches this size — a PostgREST `in (...)` list rides in the URL. */
const LOOKUP_BATCH = 60;

/** The distinct cache hashes of a group's words — the same key lookupCachedAudioUrl and the generation pipeline use. */
function wordHashes(words: readonly { targetWord: string }[]): string[] {
  return [...new Set(words.map((word) => hashText(normalizeTextForVoice(word.targetWord))))];
}

/**
 * How many of a group's distinct words already have a ready clip under
 * `voiceId`. Read-only, never generates. Throws only on a database error —
 * callers decide what an unreadable status means.
 */
export async function countReadyWordClips(
  voiceId: string,
  words: readonly { targetWord: string }[],
): Promise<{ ready: number; total: number }> {
  const hashes = wordHashes(words);
  if (hashes.length === 0) return { ready: 0, total: 0 };

  const supabase = createServiceRoleClient();
  const readyHashes = new Set<string>();
  for (let i = 0; i < hashes.length; i += LOOKUP_BATCH) {
    const { data, error } = await supabase
      .from("voice_audio_cache")
      .select("text_hash")
      .eq("voice_id", voiceId)
      .eq("status", "ready")
      .not("audio_url", "is", null)
      .in("text_hash", hashes.slice(i, i + LOOKUP_BATCH));
    if (error) throw error;
    for (const row of data ?? []) readyHashes.add(row.text_hash);
  }
  return { ready: readyHashes.size, total: hashes.length };
}

/**
 * The voice id a Word Lists group's pages should play its words with: the
 * group's own voice once EVERY word has a ready clip in it, otherwise the
 * site default. All-or-nothing on purpose — a group that is half-generated
 * in its new voice must not play half its words in one voice and half in
 * another (or fall silent on the missing ones), so learners keep hearing the
 * default, exactly as before the admin picked a voice, until the whole group
 * is ready and then switch over together. A group with no voice override
 * costs nothing extra (no query); any lookup failure falls back to the
 * default, never to silence.
 */
export async function resolveWordGroupPlaybackVoiceId(
  group: { voiceId?: string | null; words: readonly { targetWord: string }[] },
  defaultVoiceId: string,
): Promise<string> {
  if (!group.voiceId || group.voiceId === defaultVoiceId) return defaultVoiceId;
  try {
    const { ready, total } = await countReadyWordClips(group.voiceId, group.words);
    return total > 0 && ready >= total ? group.voiceId : defaultVoiceId;
  } catch (error) {
    console.error("[word-group-playback-voice] couldn't check the group voice", error);
    return defaultVoiceId;
  }
}
