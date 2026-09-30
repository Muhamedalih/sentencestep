import { lookupCachedWordAudioUrls, resolveWordCacheVoiceId } from "@/lib/voice/voice-audio";
import { lessonWordRefs } from "@/lib/voice/word-audio-keys";

/** How many words one cache query carries — keeps the `.in()` list (and its URL) small. */
const WORDS_PER_QUERY = 120;

/**
 * Cache-only lookup of every word clip a lesson's sentences could ask for,
 * done once on the server while the lesson page renders. The page then hands
 * the result to the client, which registers it in the shared resolved-audio
 * cache, so a word click (in the typing view and in Dictation alike) is a
 * synchronous cache hit: no Server Action round trip, no queue behind other
 * Server Actions, no database query.
 *
 * It extends what the page already did for the FIRST sentence's words only
 * (see lookupCachedWordAudioUrls) to the whole lesson, and fixes one thing on
 * the way: words are cached under the voice they were generated with, which
 * for a paid narrator is a free Edge-TTS stand-in — so the lookup goes
 * through resolveWordCacheVoiceId instead of assuming the narrator's own id.
 *
 * Never generates, and never throws: a miss (or any failure) simply leaves
 * that word to resolve on demand exactly as before.
 */
export async function lookupLessonWordAudio(
  sentences: readonly { id: string; en: string }[],
  narratorVoiceId: string,
): Promise<Record<string, string>> {
  try {
    const refs = lessonWordRefs(sentences);
    if (refs.length === 0) return {};
    const wordVoiceId = await resolveWordCacheVoiceId(narratorVoiceId);
    if (!wordVoiceId) return {};

    // The cache is keyed by (voice, text) alone, so identical text in
    // different sentences is one clip: look each distinct text up once and
    // fan the result out to every contentId that shares it.
    const contentIdsByText = new Map<string, string[]>();
    for (const { contentId, text } of refs) {
      const ids = contentIdsByText.get(text);
      if (ids) ids.push(contentId);
      else contentIdsByText.set(text, [contentId]);
    }
    const representatives = [...contentIdsByText.entries()].map(
      ([text, ids]) => [text, ids[0]!] as const,
    );

    const chunks: (readonly [string, string])[][] = [];
    for (let i = 0; i < representatives.length; i += WORDS_PER_QUERY) {
      chunks.push(representatives.slice(i, i + WORDS_PER_QUERY));
    }
    const found = await Promise.all(
      chunks.map((chunk) => lookupCachedWordAudioUrls(new Map(chunk), wordVoiceId)),
    );
    const urlByRepresentative: Record<string, string> = Object.assign({}, ...found);

    const result: Record<string, string> = {};
    for (const [text, representative] of representatives) {
      const url = urlByRepresentative[representative];
      if (!url) continue;
      for (const contentId of contentIdsByText.get(text) ?? []) result[contentId] = url;
    }
    return result;
  } catch (error) {
    console.error("[voice] lookupLessonWordAudio failed", error);
    return {};
  }
}
