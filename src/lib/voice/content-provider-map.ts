/**
 * Which narration provider each content type uses — fixed, explicit, and
 * never auto-detected. Replaces the old getTTSProvider() precedence chain
 * (ElevenLabs > Cartesia > Hume > Edge-TTS, whichever API key happened to be
 * set), which was the root cause of a September 2026 incident: switching
 * which key was configured silently changed the "active" provider for
 * every content type at once, and since a provider's name was folded into
 * generation_version (see story-voice-generation.ts's generationVersionFor),
 * that single env var change invalidated the entire narration cache and a
 * cron sweep spent three days regenerating the whole library, exhausting
 * the hosting account's credits.
 *
 * Each content type below is pinned to one provider on purpose: Stories,
 * Conversation, and Books keep the original expressive-narration provider
 * (ElevenLabs); Normal lessons (Daily Lessons) use Hume AI; Word Lists use
 * Cartesia. A provider is never silently substituted for another — see
 * createProviderForSource in provider-registry.ts, which throws rather than
 * falling back when the assigned provider's API key is missing. Changing
 * this mapping is a deliberate code change, and because generation_version
 * no longer folds provider identity into itself, it only ever invalidates
 * the one content type being reassigned (a different provider's voice_id is
 * already a different cache key on its own — see resolution.ts's
 * cacheKeyParts), never the whole library at once.
 *
 * Mistake Review's isolated single-word audio (voice-audio.ts) is
 * deliberately not part of this map — it always uses free Edge-TTS,
 * regardless of which provider narrated the parent sentence (see
 * generateIsolatedWordAudio's own doc comment).
 */
export const STORIES_AND_BOOKS_PROVIDER = "elevenlabs";
export const NORMAL_LESSON_PROVIDER = "hume";
export const WORD_LIST_PROVIDER = "cartesia";

/**
 * Word Lists' fixed Cartesia model id — never elevenlabs_settings.model
 * (that table is Stories/Books' own settings, see
 * word-list-voice-generation.ts's own doc comment on why Word Lists never
 * reads it). Exported here (rather than from word-list-voice-generation.ts,
 * which pulls in server-only Supabase code) so the admin preview button for
 * the Word Lists default-voice picker can use the exact same model id the
 * real generation pipeline does.
 */
export const WORD_LIST_CARTESIA_MODEL = "sonic-2";
