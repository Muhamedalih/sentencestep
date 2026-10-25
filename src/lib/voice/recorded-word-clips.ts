import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role";
import { hashText } from "@/lib/voice/resolution";
import { resolveStoryNarratorVoice } from "@/lib/voice/story-voice-generation";
import { wordAudioCandidates } from "@/lib/voice/word-list-word-audio";

/**
 * The RECORDED clips of single words, for a caller that wants their URLs up front — Today's words
 * step plays every word from one of these and never asks a synthesizer for it on the spot (the
 * synthesizer the server could reach, Edge-TTS, is refused by Microsoft's endpoint from this host
 * and from a developer's machine alike: HTTP 200 where the WebSocket upgrade should be), which is
 * what used to leave those words to the browser's own voice.
 *
 *  - lookupStoryWordClips: a Story's own target words — the very clips the Stories "words from this
 *    lesson" screen plays (generateStoryVocabularyVoiceDraft makes them, one per word, in the
 *    story's own ElevenLabs narrator voice).
 *  - lookupAnyWordClips: any ready recording of the exact word, in whichever voice has one — the
 *    last stop before a word is left out.
 *
 * Cache-only, one read each: nothing here generates, and a word with no clip is simply absent.
 * Deliberately not in a "use server" module (same reason as word-list-word-audio.ts): everything
 * exported from one of those is a public endpoint, and this is imported only by server code that
 * derives the words itself.
 */

/** The generation_version the Stories words screen's clips are filed under (see STORY_VOCAB_GENERATION_VERSION in story-vocabulary-voice-generation.ts) — matched by prefix, so a later bump of the version keeps matching. */
const STORY_VOCAB_VERSION_PREFIX = "story-vocab:";

/** The columns of a voice_audio_cache row these lookups need. */
export interface WordClipRow {
  voice_id: string;
  text_hash: string;
  audio_url: string | null;
  generation_version: string;
}

/**
 * For each word, the clip it should play out of the ready `rows` (newest first) of every voice that
 * has the word. The story's own narrator voice wins — the voice its sentences and its words screen
 * are in — then any other story-word clip of the same word (a story whose voice was changed after
 * its words were made keeps the clips it already had), and nothing else: a clip of another kind or
 * voice is not this function's to hand out. `hashesByWord` lists, per word, the hashes of the
 * spellings worth trying, most specific first.
 */
export function pickStoryWordClips(
  hashesByWord: ReadonlyMap<string, readonly string[]>,
  rows: readonly WordClipRow[],
  narratorVoiceId: string | null,
): Map<string, string> {
  const picked = new Map<string, string>();
  for (const [word, hashes] of hashesByWord) {
    for (const hash of hashes) {
      const sameWord = rows.filter((row) => row.text_hash === hash && row.audio_url);
      const hit =
        (narratorVoiceId ? sameWord.find((row) => row.voice_id === narratorVoiceId) : undefined) ??
        sameWord.find((row) => row.generation_version.startsWith(STORY_VOCAB_VERSION_PREFIX));
      if (hit?.audio_url) {
        picked.set(word, hit.audio_url);
        break;
      }
    }
  }
  return picked;
}

/**
 * For each word, the newest ready recording of it in any voice (the exact spelling first, then the
 * others) out of `rows`, which arrive newest first. What the caller wants most is decided before it
 * gets here: this is for a word that no better source could voice.
 */
export function pickAnyWordClips(
  hashesByWord: ReadonlyMap<string, readonly string[]>,
  rows: readonly WordClipRow[],
): Map<string, string> {
  const picked = new Map<string, string>();
  for (const [word, hashes] of hashesByWord) {
    for (const hash of hashes) {
      const hit = rows.find((row) => row.text_hash === hash && row.audio_url);
      if (hit?.audio_url) {
        picked.set(word, hit.audio_url);
        break;
      }
    }
  }
  return picked;
}

/** The hashes of the spellings worth trying for each word, most specific first (see wordAudioCandidates); a word with nothing to say is left out. */
function hashesByWordFor(words: readonly string[]): Map<string, string[]> {
  const hashesByWord = new Map<string, string[]>();
  for (const word of new Set(words)) {
    const spellings = wordAudioCandidates(word);
    if (spellings.length > 0) {
      hashesByWord.set(
        word,
        spellings.map((text) => hashText(text)),
      );
    }
  }
  return hashesByWord;
}

/** Every ready recording of those hashes, in any voice, newest first. Throws on a failed read. */
async function readReadyRows(hashesByWord: ReadonlyMap<string, readonly string[]>) {
  const { data, error } = await createServiceRoleClient()
    .from("voice_audio_cache")
    .select("voice_id, text_hash, audio_url, generation_version")
    .in("text_hash", [...new Set([...hashesByWord.values()].flat())])
    .eq("status", "ready")
    .not("audio_url", "is", null)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Word -> clip URL for the target words of one story (keyed by the word exactly as passed in; the
 * lower-case and Capitalized spellings are tried too, as the clip may be filed under either). Never
 * throws: a failed read gives no clips, which the caller treats like clips that do not exist.
 */
export async function lookupStoryWordClips(args: {
  /** The story's own voice (`lessons.voice_id`), when it has one. */
  lessonVoiceId: string | null;
  words: readonly string[];
}): Promise<Map<string, string>> {
  const hashesByWord = hashesByWordFor(args.words);
  if (hashesByWord.size === 0 || !isServiceRoleConfigured()) return new Map();
  try {
    const [narrator, rows] = await Promise.all([
      resolveStoryNarratorVoice(createServiceRoleClient(), args.lessonVoiceId),
      readReadyRows(hashesByWord),
    ]);
    return pickStoryWordClips(hashesByWord, rows, narrator?.voiceId ?? null);
  } catch (error) {
    console.error("[recorded-word-clips] lookupStoryWordClips failed", error);
    return new Map();
  }
}

/**
 * Word -> the newest ready recording of it in any voice (keyed by the word exactly as passed in).
 * Never throws: a failed read gives no clips.
 */
export async function lookupAnyWordClips(words: readonly string[]): Promise<Map<string, string>> {
  const hashesByWord = hashesByWordFor(words);
  if (hashesByWord.size === 0 || !isServiceRoleConfigured()) return new Map();
  try {
    return pickAnyWordClips(hashesByWord, await readReadyRows(hashesByWord));
  } catch (error) {
    console.error("[recorded-word-clips] lookupAnyWordClips failed", error);
    return new Map();
  }
}
