-- Stop the voice cache from handing out the text of every narrated sentence.
--
-- voice_audio_cache is readable by everyone (the lessons' players look clips up with the public key),
-- and its normalized_text column holds the exact words of each narrated sentence, premium lessons and
-- Library books included. Anyone with the public key could therefore list the whole premium text
-- (and the audio file next to it) without paying. No code ever READS normalized_text (it is only
-- written, by the server with the service role), and the same goes for voice_direction and
-- last_error (the narration director's notes and provider errors). The public roles keep every
-- column the players use; only these three are taken away.
--
-- Additive and reversible: to undo, `grant select on public.voice_audio_cache to anon, authenticated;`
-- The service role is untouched, so generation and the admin pages keep working.

begin;

revoke select on public.voice_audio_cache from anon, authenticated;

grant select (
  id,
  voice_id,
  text_hash,
  generation_version,
  audio_url,
  status,
  provider,
  model,
  duration_ms,
  attempts,
  created_at,
  updated_at
) on public.voice_audio_cache to anon, authenticated;

commit;
