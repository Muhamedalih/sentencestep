-- Index for the daily voice-generation spend guard.
--
-- isDailyVoiceGenerationCapReached (src/lib/voice/daily-cap.ts) counts
-- voice_audio_cache rows with `status = 'ready' AND updated_at >= <today UTC>`.
-- The only index on this table's status (voice_audio_cache_status_idx) is a
-- partial one for `status <> 'ready'`, so that count had no index to use and
-- sequentially scanned the whole table (~21k rows) on every call — and it runs
-- at the start of every voice-sweep and session-word-audio cron tick (every
-- 15 minutes each) plus the admin bulk-generate action. pg_stat_user_tables
-- showed ~694 seq scans / ~14.5M rows read on this table against ~1.7M index
-- scans.
--
-- Partial on status = 'ready' so it matches the query exactly and stays small:
-- rows that are 'generating' or 'failed' are already covered by
-- voice_audio_cache_status_idx. Purely additive — no query's results change,
-- and RLS is unaffected.
create index if not exists voice_audio_cache_ready_updated_at_idx
  on voice_audio_cache (updated_at)
  where status = 'ready';

analyze voice_audio_cache;
