"use server";

import { isTrackableWord, normalizeMistakeWord } from "@/lib/mistakes/normalize";
import { tokenize } from "@/lib/typing";
import { hashText, normalizeTextForVoice } from "@/lib/voice/resolution";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  generateIsolatedWordAudio,
  isSynthesisRateLimited,
  lookupCachedClipForTexts,
  lookupVoice,
  resolveWordVoice,
} from "@/lib/voice/isolated-word-audio";
import { wordTextCandidates } from "@/lib/voice/sentence-word-plan";

/**
 * The on-demand, cached pronunciation-audio pipeline every lesson type
 * calls through (see PronunciationButton's kokoroVoiceId prop — the single
 * integration point, not four separate ones). Deliberately takes a
 * *content reference*, never raw text: an arbitrary-text parameter here
 * would turn this into an unauthenticated public TTS endpoint (the actual
 * sentence/word is looked up server-side from a real content id, so a
 * caller can only ever request audio for text that's already part of
 * SentenceStep's own content). See MAX_TEXT_LENGTH below for the second
 * layer of that same guard.
 *
 * Every voice's audio is generated ahead of time by the background
 * narration pipeline (see story-voice-generation.ts, which covers Normal
 * lessons exactly like Stories/Conversation) — this module only runs TTS
 * inference itself for the one narrow "sentence_word" exception documented
 * below; every other content type stays purely cache-only. A cache miss for
 * those (new content the background sweep hasn't reached yet, or no
 * narration provider configured) falls back to the browser's own speech
 * synthesis exactly like any other resolution failure (see
 * PronunciationButton).
 *
 * "sentence_word"/"book_sentence_word" pronounce a single target word in
 * isolation, not the sentence it came from — used by both "Fix Your
 * Mistakes" (see FixYourMistakesSession) and the in-lesson word-click while
 * reading/typing a Normal/Stories/Book sentence (see TypingSentence/
 * BookSentenceReader). contentId is `${sentenceId}::${normalized word}`,
 * resolved by re-deriving the word from the real sentence text server-side
 * — never trusting a client-supplied word string directly — so the same
 * "content reference, never raw text" guarantee holds here too;
 * "book_sentence_word" is identical except resolved against book_sentences
 * instead of sentences. Unlike every other content type, a cache miss here
 * doesn't just fall back to the browser: an Edge-TTS-sourced voice (Normal
 * lessons — free, no account needed) gets the word synthesized on demand
 * with that exact voice (see generateIsolatedWordAudio); a Story sentence's
 * paid-provider voice never triggers a real synthesis call on that provider
 * — a gender-matched free Edge-TTS voice stands in for just this one word
 * instead (see pickGenderMatchedEdgeTtsVoice), leaving the narrator's own
 * paid voice — and its own already-generated sentence audio — completely
 * untouched. This applies identically to Books' "book_sentence_word": an
 * earlier same-day special case that made a book_sentence_word cache miss
 * return null instead of reaching this substitute (leaving Books' word
 * clicks permanently silent, since nothing else ever populates that cache)
 * was reverted at the user's explicit request — see the resolution logic
 * inside resolvePronunciationAudioAction below.
 *
 * "book_sentence" is the Book Learning Engine's addition — a book_sentences
 * row rather than a sentences row, looked up the same content-reference way
 * (see lookupContentText below). Caching itself needs no changes at all: the
 * voice_audio_cache key is (voice_id, text_hash, generation_version), not
 * contentType/contentId, so a book sentence that happens to share exact text
 * with a lesson sentence already shares its cached clip for free.
 *
 * "story_vocab_word" pronounces one of a Story's own 2-6 target vocabulary
 * words (StoryWordsPanel's "words from this lesson" recap screen) — cache-
 * only, exactly like plain "word", never on-demand-synthesized here (see
 * generateStoryVocabularyVoiceDraft, called from the admin "Generate"
 * action, for the only thing that ever populates this cache). Unlike every
 * other type, there is no backing database row to look the text up from: a
 * story's target vocabulary is derived on the fly from its sentences (see
 * story-vocabulary.ts's own doc comment), never persisted as its own
 * `vocabulary_words` row. contentId is `${lessonId}::${word}`, resolved by
 * re-deriving the word from that lesson's real sentence text server-side —
 * never trusting the client-supplied word directly, the same "content
 * reference, never raw text" guarantee every other type gets, just checked
 * against the lesson's sentences instead of a single row.
 */
export type VoiceAudioContentType =
  | "sentence"
  | "word"
  | "sentence_word"
  | "book_sentence"
  | "book_sentence_word"
  | "story_vocab_word";

const MAX_TEXT_LENGTH = 300;

async function lookupContentText(
  contentType: VoiceAudioContentType,
  contentId: string,
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  if (contentType === "sentence") {
    const { data } = await supabase
      .from("sentences")
      .select("en")
      .eq("id", contentId)
      .maybeSingle();
    return data?.en ?? null;
  }

  if (contentType === "book_sentence") {
    const { data } = await supabase
      .from("book_sentences")
      .select("en")
      .eq("id", contentId)
      .maybeSingle();
    return data?.en ?? null;
  }

  if (contentType === "sentence_word" || contentType === "book_sentence_word") {
    const [sentenceId, normalizedWord] = contentId.split("::");
    if (!sentenceId || !normalizedWord) return null;
    const { data } = await supabase
      .from(contentType === "sentence_word" ? "sentences" : "book_sentences")
      .select("en")
      .eq("id", sentenceId)
      .maybeSingle();
    if (!data?.en) return null;
    return (
      tokenize(data.en).find(
        (token) =>
          token !== " " && isTrackableWord(token) && normalizeMistakeWord(token) === normalizedWord,
      ) ?? null
    );
  }

  if (contentType === "story_vocab_word") {
    const [lessonId, rawWord] = contentId.split("::");
    if (!lessonId || !rawWord) return null;
    const target = rawWord.toLowerCase();
    const { data } = await supabase.from("sentences").select("en").eq("lesson_id", lessonId);
    for (const row of data ?? []) {
      for (const rawToken of row.en.split(/\s+/)) {
        const clean = rawToken.replace(/^[^A-Za-z']+|[^A-Za-z']+$/g, "");
        // Returns rawWord itself (not `clean`) once its presence in this
        // lesson's real sentences is confirmed — this loop only exists to
        // verify the client-supplied word is genuine lesson content (the
        // same "content reference, never raw text" guard every branch above
        // applies), not to pick a canonical spelling. generateStoryVocabularyVoiceDraft
        // hashes this exact word's VocabularyItem.en (the *representative*
        // occurrence buildStoryVocabulary chose) to build the cache key, and
        // hashText/normalizeTextForVoice is explicitly case-sensitive (see
        // that doc comment) — so returning whatever *different* occurrence
        // this unordered scan happens to hit first (e.g. an earlier,
        // differently-cased mention of the same word elsewhere in the story)
        // produced a different hash than generation used, a guaranteed cache
        // miss for any word whose representative occurrence wasn't also the
        // first the scan encountered. rawWord came from the client's own
        // item.en, derived by the exact same buildStoryVocabulary call
        // generation used, so it always hashes to generation's real key.
        if (clean.toLowerCase() === target) return rawWord;
      }
    }
    return null;
  }

  const { data } = await supabase
    .from("vocabulary_words")
    .select("target_word")
    .eq("id", contentId)
    .maybeSingle();
  return data?.target_word ?? null;
}

/**
 * Cache-only lookup, never generates — the server-rendered counterpart of
 * resolvePronunciationAudioAction's own cache check, called from a lesson
 * page's Server Component (see LessonPage) for the sentence about to be
 * shown first. Measured root cause of "every sentence has a noticeable
 * pronunciation delay, even ones already generated": PronunciationButton's
 * on-demand resolve — while correctly cache-hitting — still costs a full
 * client→server round trip plus two sequential Supabase queries
 * (text+voice lookup, then the cache row itself) before the audio URL is
 * even known, every single time a new sentence mounts, regardless of how
 * long that clip has already existed. Calling this here and handing the
 * result to the page as the sentence's ordinary `audioUrl` (see
 * PronunciationButton's own priority order, which already treats a
 * populated audioUrl as "play this directly, never regenerate") lets the
 * very first paint already carry a ready-to-play URL for cache hits — zero
 * client-side resolution round trip. A cache miss here still resolves
 * exactly as before, on demand, client-side; this function never
 * generates, so it can never turn a page load into a Kokoro invocation.
 * Deliberately takes the already-known text directly (the caller already
 * fetched it) rather than a content id — unlike
 * resolvePronunciationAudioAction, there's no untrusted client input here
 * to gate behind a content-reference lookup.
 *
 * (voice_id, text_hash, status='ready') is the lookup — no
 * generation_version filter, since a narration-provider row's version
 * encodes surrounding-sentence context (see story-voice-generation.ts's
 * contextHash) that can't be reconstructed from text alone here; ordering
 * by most recently updated resolves the rare case where an older row for a
 * since-changed context is still marked 'ready' pending cleanup.
 */
export async function lookupCachedAudioUrl(text: string, voiceId: string): Promise<string | null> {
  if (!text || text.length > MAX_TEXT_LENGTH) return null;

  const textHash = hashText(normalizeTextForVoice(text));
  const supabase = createServiceRoleClient();

  const { data: cached } = await supabase
    .from("voice_audio_cache")
    .select("audio_url")
    .eq("voice_id", voiceId)
    .eq("text_hash", textHash)
    .eq("status", "ready")
    .not("audio_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return cached?.audio_url ?? null;
}

/**
 * Batched sibling of lookupCachedAudioUrl, for many isolated words in ONE
 * Supabase round trip instead of one per word — measured root cause of "the
 * very first sentence's word clicks take 10-20+ seconds, every single
 * lesson, every single time" (live-tested across two full lessons,
 * mode=normal and mode=stories: sentence 1 consistently 15-19s, every later
 * sentence a consistent ~200-300ms). Only the sentence's own narration
 * ever got this same server-side, cache-only pre-resolution treatment (see
 * LessonPage's firstSentence handling below) — its individual WORDS had no
 * server-side head start at all, so a click on the very first sentence
 * (before TypingSentence's own within-sentence prefetch, or
 * LessonSession's next-sentence prefetch, have ever had a chance to run)
 * raced cold against a page that's simultaneously still loading its own JS,
 * images, and the sentence's own narration — the same connection/resource
 * contention documented on the Books narration fix, just far worse here
 * because literally everything on the page is loading at once.
 *
 * Takes a Map of normalizedWord -> the caller's own contentId (so this
 * function never needs to know about sentence ids) and returns
 * `{ [contentId]: audioUrl }` for every cache hit; a miss for any word is
 * simply absent from the result, left to resolve on demand client-side
 * exactly as before. Never generates. Callers register the result into the
 * shared resolved-audio cache (see PronunciationSettingsProvider's
 * registerResolvedAudio) so a word click never even calls resolveAudio's
 * own network path in the first place — an instant, synchronous cache hit,
 * not just a faster one.
 */
export async function lookupCachedWordAudioUrls(
  contentIdByNormalizedWord: Map<string, string>,
  voiceId: string,
): Promise<Record<string, string>> {
  if (contentIdByNormalizedWord.size === 0) return {};

  const contentIdsByHash = new Map<string, string[]>();
  for (const [word, contentId] of contentIdByNormalizedWord) {
    const hash = hashText(normalizeTextForVoice(word));
    const existing = contentIdsByHash.get(hash);
    if (existing) existing.push(contentId);
    else contentIdsByHash.set(hash, [contentId]);
  }

  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("voice_audio_cache")
    .select("text_hash, audio_url, updated_at")
    .eq("voice_id", voiceId)
    .in("text_hash", [...contentIdsByHash.keys()])
    .eq("status", "ready")
    .not("audio_url", "is", null)
    .order("updated_at", { ascending: false });

  const result: Record<string, string> = {};
  for (const row of data ?? []) {
    if (!row.audio_url) continue;
    const contentIds = contentIdsByHash.get(row.text_hash);
    if (!contentIds) continue;
    // Rows arrive most-recently-updated first, so the first row seen for a
    // given contentId is already the freshest — later, older duplicate rows
    // for the same hash are skipped.
    for (const contentId of contentIds) {
      if (!(contentId in result)) result[contentId] = row.audio_url;
    }
  }
  return result;
}

/**
 * The voice_id a WORD-level cache row (sentence_word/book_sentence_word)
 * actually lives under for a given narrator/lesson voice: that voice's own
 * id unchanged if it's already Edge-TTS, otherwise the same free
 * gender-matched Edge-TTS substitute resolvePronunciationAudioAction's own
 * word branch below picks (see resolveWordVoice in isolated-word-audio.ts,
 * which memoizes it) — never a second, drifting copy of that decision, just
 * this one exposed for a caller that needs to look several words up in bulk
 * (see lookupCachedWordAudioUrls above) rather than one at a time. Read-only:
 * never generates, never claims a cache row, so calling this can never
 * itself kick off a synthesis.
 */
export async function resolveWordCacheVoiceId(narratorVoiceId: string): Promise<string | null> {
  return (await resolveWordVoice(narratorVoiceId))?.id ?? null;
}

/**
 * Resolves a ready-to-play audio URL for real SentenceStep content spoken
 * by a real, existing voice. Cache-only for every content type except
 * "sentence_word"/"book_sentence_word" (see generateIsolatedWordAudio) — a
 * miss for any other type returns null (never throws) so PronunciationButton
 * falls back to the browser's speech synthesis exactly as it does for any
 * other resolution failure. Validates the content id and voice id are real
 * before looking up the cache, unlike lookupCachedAudioUrl, which trusts its
 * caller.
 */
export async function resolvePronunciationAudioAction(input: {
  contentType: VoiceAudioContentType;
  contentId: string;
  voiceId: string;
}): Promise<string | null> {
  const { contentType, contentId, voiceId } = input;

  const [text, voice] = await Promise.all([
    lookupContentText(contentType, contentId),
    lookupVoice(voiceId),
  ]);
  if (!text || text.length > MAX_TEXT_LENGTH) return null;
  if (!voice) return null;

  const cached = await lookupCachedAudioUrl(text, voiceId);
  if (cached) return cached;

  if (contentType !== "sentence_word" && contentType !== "book_sentence_word") return null;

  // A word is spoken by the narrator's own voice only when that voice is
  // Edge-TTS (free); a paid narrator (Cartesia/ElevenLabs) never pays for a
  // single isolated word — a gender-matched free Edge-TTS voice stands in
  // (see resolveWordVoice) and the word's clip is stored under THAT voice's
  // id. The lookup above only knows the narrator's id, so for a paid narrator
  // it could never find a word generated before: every click looked like a
  // miss, was counted against the synthesis rate limit, and then
  // re-synthesized and re-uploaded a clip that already existed. Look under
  // the voice the clip really lives under first, and only rate-limit and
  // synthesize on a genuine miss.
  const wordVoice = await resolveWordVoice(voiceId);
  if (!wordVoice) return null;

  // The clip may be cached under the word's raw spelling ("Hello,", what a
  // click used to synthesize) or its normalized one ("hello", what the
  // backfill script wrote) — a lookup by the raw text alone never found the
  // backfilled clip of a capitalised or punctuated word. See
  // wordTextCandidates. `sentence_word` only: Books' own batched lookup still
  // keys on the raw token, so its words keep being generated under it.
  const normalizedKey = contentId.split("::")[1] ?? "";
  const candidates =
    contentType === "sentence_word" ? wordTextCandidates(text, normalizedKey) : [text];
  const cachedWord = await lookupCachedClipForTexts(candidates, wordVoice.id);
  if (cachedWord) return cachedWord;

  if (await isSynthesisRateLimited()) return null;
  // New lesson-word clips are made under the canonical (normalized) spelling,
  // so a word is synthesized once per voice however it is capitalised or
  // punctuated in any sentence, and lands on the same cache row the backfill
  // used.
  const generationText = contentType === "sentence_word" && normalizedKey ? normalizedKey : text;
  return generateIsolatedWordAudio(generationText, wordVoice.id, wordVoice.providerVoiceId);
}
