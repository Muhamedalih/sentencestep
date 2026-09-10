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
 * (ElevenLabs); Word Lists use Cartesia. A provider is never silently
 * substituted for another — see createProviderForSource in
 * provider-registry.ts, which throws rather than falling back when the
 * assigned provider's API key is missing. Changing this mapping is a
 * deliberate code change, and because generation_version no longer folds
 * provider identity into itself, it only ever invalidates the one content
 * type being reassigned (a different provider's voice_id is already a
 * different cache key on its own — see resolution.ts's cacheKeyParts),
 * never the whole library at once.
 *
 * Normal lessons (Daily Lessons) were originally assigned to Hume AI, but
 * zero Hume voices were ever actually registered (see
 * candidates.ts's now-removed NORMAL_LESSON_SWEEP_PAUSED), so the pipeline
 * never generated a single clip under that assignment. Reassigned to
 * Cartesia 2026-09-10 at the user's explicit request, using the "Skylar -
 * Friendly Guide" voice already registered in `voices`, specifically to
 * spend down this account's remaining ~2000 Cartesia credits on Daily
 * Lessons narration before those credits run out and a different solution
 * is picked. This is a deliberate, temporary-but-real assignment — not a
 * placeholder — so it stays in effect (and Normal lessons keep generating
 * via the cron sweep) until the user says otherwise.
 *
 * Mistake Review's isolated single-word audio (voice-audio.ts) is
 * deliberately not part of this map — it always uses free Edge-TTS,
 * regardless of which provider narrated the parent sentence (see
 * generateIsolatedWordAudio's own doc comment).
 */
export const STORIES_AND_BOOKS_PROVIDER = "elevenlabs";
export const NORMAL_LESSON_PROVIDER = "cartesia";
export const WORD_LIST_PROVIDER = "cartesia";

/**
 * Cartesia's own model id — never elevenlabs_settings.model. That column
 * holds an ElevenLabs model id (default "eleven_v3", see
 * 20250203000000_elevenlabs_voice_engine.sql) and is Stories/Books' own
 * setting; sending it to Cartesia's API 404s ("Model not found") since the
 * two providers use unrelated model id namespaces.
 *
 * "sonic-2" (this codebase's original guess, and once a real Cartesia
 * model) has since been retired — confirmed against Cartesia's own current
 * API reference (docs.cartesia.ai/api-reference/tts/bytes) on 2026-09-09,
 * whose model_id enum is exactly ["sonic-3.6", "sonic-3.5", "sonic-3",
 * "sonic-latest"], "sonic-3.6" being the documented default. Pinned to a
 * specific version rather than "sonic-latest" for the same reason
 * elevenlabs_settings.model is pinned to a specific ElevenLabs model
 * ("eleven_v3") instead of an auto-updating alias: reproducible audio
 * across regenerations, not silently different output whenever Cartesia
 * ships a new default. If Cartesia 404s on this again in the future, that
 * means this version was retired too — check
 * docs.cartesia.ai/api-reference/tts/bytes for the current enum rather than
 * guessing again.
 *
 * Used in two places: word-list-voice-generation.ts's real generation
 * pipeline and CartesiaVoiceForm's admin preview button
 * (admin/voice/page.tsx) — both must agree on one real Cartesia model id.
 * Exported here (rather than from word-list-voice-generation.ts, which
 * pulls in server-only Supabase code) so client components can import it
 * too.
 */
export const DEFAULT_CARTESIA_MODEL = "sonic-3.6";
