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
 * Cartesia's own model id — never elevenlabs_settings.model. That column
 * holds an ElevenLabs model id (default "eleven_v3", see
 * 20250203000000_elevenlabs_voice_engine.sql) and is Stories/Books' own
 * setting; sending it to Cartesia's API 404s ("Model not found") since the
 * two providers use unrelated model id namespaces. This was passed as
 * Cartesia's model in two places that predate Word Lists moving to
 * Cartesia — CartesiaVoiceForm's preview button (admin/voice/page.tsx) and
 * would have been word-list-voice-generation.ts's too if it had reused
 * elevenlabs_settings — both now use this constant instead. Exported here
 * (rather than from word-list-voice-generation.ts, which pulls in
 * server-only Supabase code) so client components can import it too.
 */
export const DEFAULT_CARTESIA_MODEL = "sonic-2";
