/**
 * The one shared voice-resolution layer every lesson type reads through,
 * so "which voice speaks this content" is decided in exactly one place
 * instead of once per lesson mode. Pure and framework-free — no Supabase,
 * no "use server" — so it's directly unit-testable and safe to import from
 * both server and client code.
 */

/** `lesson.voiceId ?? globalDefaultVoiceId` — the entire per-lesson override rule (see Normal/Stories/Conversation). Word Lists calls this with `null` for `contentVoiceId` (no per-group override exists yet — see word-lists' own doc comments), which correctly collapses to the same global default. */
export function resolveVoiceId(
  contentVoiceId: string | null | undefined,
  globalDefaultVoiceId: string | null,
): string | null {
  return contentVoiceId ?? globalDefaultVoiceId;
}

/**
 * Collapses whitespace and trims — the same sentence typed with different
 * incidental spacing (a trailing space in the admin's textarea, a double
 * space) must still hit the same cache row. Case and punctuation are left
 * untouched: they audibly change how Kokoro reads a sentence, unlike
 * whitespace, so they must remain part of what's cached separately.
 */
export function normalizeTextForVoice(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

const FNV64_OFFSET_BASIS = 0xcbf29ce484222325n;
const FNV64_PRIME = 0x100000001b3n;
const MASK_64 = 0xffffffffffffffffn;

/**
 * Non-cryptographic (64-bit FNV-1a) by design — this key only has to avoid
 * accidental collisions between different cached sentences well enough for
 * a database index, not resist a deliberate attacker; BigInt arithmetic
 * keeps this dependency-free and synchronous (unlike Web Crypto's
 * subtle.digest, which is async) while still being available identically in
 * Node and every browser, so this module stays import-safe everywhere and
 * trivially testable.
 *
 * This used to be 32-bit, which is only safe up to roughly its own square
 * root (~65k) worth of distinct strings before collisions become a real
 * risk (birthday bound) — a genuine concern here, since every lesson
 * sentence, book sentence, mistake-review word, and vocabulary word across
 * every locale shares this one hash space with no content-type/id in the
 * key (see cacheKeyParts). A 32-bit collision between two different
 * sentences under the same voice+generationVersion silently overwrites one
 * sentence's cached audio with the other's on write (voice-audio.ts's
 * upsert is keyed on this hash), or causes claimCacheRow
 * (story-voice-generation.ts) to treat the second sentence as "already
 * generated" and permanently serve it the first sentence's clip. 64 bits
 * pushes that same birthday bound out to ~4 billion distinct strings —
 * unreachable for this app's actual content volume. Combined with
 * voiceId + generationVersion by the caller (see cacheKeyParts) to form the
 * full cache identity described in voice_audio_cache's own migration
 * comment.
 *
 * Widening this changes every hash this function has ever produced, which
 * orphans voice_audio_cache's existing rows (their old 8-hex-char text_hash
 * values will never match a newly computed 16-hex-char one) — not a
 * correctness problem, since text_hash carries no meaning beyond cache
 * lookup, just a one-time cache miss the next time each of those sentences
 * is spoken, regenerating fresh (and now collision-safe) audio.
 */
export function hashText(text: string): string {
  let hash = FNV64_OFFSET_BASIS;
  for (let i = 0; i < text.length; i++) {
    hash ^= BigInt(text.charCodeAt(i));
    hash = (hash * FNV64_PRIME) & MASK_64;
  }
  return hash.toString(16).padStart(16, "0");
}

/** The exact (voice, text, version) triple voice_audio_cache is uniquely keyed on — see that table's migration comment for why a content id alone isn't enough. */
export function cacheKeyParts(
  text: string,
  voiceId: string,
  generationVersion: string,
): { normalizedText: string; textHash: string; voiceId: string; generationVersion: string } {
  const normalizedText = normalizeTextForVoice(text);
  return { normalizedText, textHash: hashText(normalizedText), voiceId, generationVersion };
}
