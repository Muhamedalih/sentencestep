"use server";

import { lookupCachedWordAudioUrls, resolveWordCacheVoiceId } from "@/lib/voice/voice-audio";

/**
 * Books-only batched, cache-only audio lookup for a whole reading PAGE (a
 * handful of sentences plus every trackable word in them) in ONE or two
 * Supabase round trips instead of one Server Action per sentence/word.
 * Added 2026-09-12 after tracing reader reports that Books' individual
 * per-item prefetchPronunciation calls (BookReadingSession's own page
 * effect) added up to 100+ separate round trips per page: even throttled
 * client-side, that kept a background request continuously in flight for
 * minutes, competing with the reader's own on-demand plays (see
 * MAX_CONCURRENT_PREFETCH_REQUESTS's doc comment in
 * pronunciation-settings-provider.tsx for that history). Batching the
 * *lookup* — not the generation, which stays exactly as-is for the rare
 * miss — collapses that same page's worth of "is this already cached?"
 * checks into a couple of `.in()` queries.
 *
 * Never touches, and is never called by, Normal/Stories/Conversation/Word
 * Lists — those keep prefetchPronunciation/resolveAudio's existing
 * per-item path completely unchanged. Reuses lookupCachedWordAudioUrls
 * (already used, unbatched-per-sentence, for the very first sentence's own
 * words in the reading page's server component) rather than writing a
 * second hashing/lookup implementation — this call is functionally
 * identical to calling that same function once per item, just with every
 * item's round trip merged into one. Cache-only: a miss for any sentence or
 * word is simply absent from the result, exactly as the per-item path
 * already treats a miss today — the caller falls back to its existing
 * on-demand resolveAudio for those, completely unchanged, so no audio this
 * produces or misses can ever differ from before this existed.
 */
export async function resolveBookPageAudioAction(input: {
  /** The book's own resolved narrator voice (ElevenLabs, or whatever's configured) — sentence narration is looked up under this id directly. */
  narratorVoiceId: string;
  /** Only sentences whose audioUrl ISN'T already known client-side (book_sentences.audio_url, already present on most rows from the book's own voice-generation pipeline) need to be asked for here at all — the caller filters those out before calling. */
  sentences: { contentId: string; text: string }[];
  /** Every trackable word across the page's sentences, keyed by contentId (`${sentenceId}::${normalizedWord}`) with its own raw (un-normalized) text. */
  words: { contentId: string; word: string }[];
}): Promise<{ sentenceAudio: Record<string, string>; wordAudio: Record<string, string> }> {
  const [sentenceAudio, wordAudio] = await Promise.all([
    resolveSharedTextAudio(input.sentences, input.narratorVoiceId),
    resolveBatchedWordAudio(input.words, input.narratorVoiceId),
  ]);

  return { sentenceAudio, wordAudio };
}

/**
 * Fans a batched lookup's result back out to every contentId that shares
 * the exact same text — needed because voice_audio_cache is content-
 * addressed by (voice, text) alone, never by which sentence a word or
 * sentence came from (see this module's own doc comment: the same reason
 * a book sentence can already share a lesson sentence's identical clip for
 * free). lookupCachedWordAudioUrls itself takes a one-to-one Map, so two
 * different contentIds with identical text would otherwise silently
 * collide in that Map and only one of them would ever get looked up —
 * this looks each unique text up exactly once, via one representative
 * contentId, then copies its result to every sibling.
 */
async function resolveSharedTextAudio(
  items: { contentId: string; text: string }[],
  voiceId: string,
): Promise<Record<string, string>> {
  if (items.length === 0) return {};

  const contentIdsByText = new Map<string, string[]>();
  for (const { contentId, text } of items) {
    const existing = contentIdsByText.get(text);
    if (existing) existing.push(contentId);
    else contentIdsByText.set(text, [contentId]);
  }

  const representativeByText = new Map(
    [...contentIdsByText.entries()].map(([text, ids]) => [text, ids[0]!]),
  );
  const resolved = await lookupCachedWordAudioUrls(representativeByText, voiceId);

  const result: Record<string, string> = {};
  for (const [text, ids] of contentIdsByText) {
    const url = resolved[representativeByText.get(text)!];
    if (!url) continue;
    for (const id of ids) result[id] = url;
  }
  return result;
}

async function resolveBatchedWordAudio(
  words: { contentId: string; word: string }[],
  narratorVoiceId: string,
): Promise<Record<string, string>> {
  if (words.length === 0) return {};
  const wordVoiceId = await resolveWordCacheVoiceId(narratorVoiceId);
  if (!wordVoiceId) return {};
  return resolveSharedTextAudio(
    words.map(({ contentId, word }) => ({ contentId, text: word })),
    wordVoiceId,
  );
}
