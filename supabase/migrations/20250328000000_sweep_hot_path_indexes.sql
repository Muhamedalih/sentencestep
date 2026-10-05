-- Indexes for the four queries the background sweeps run on a fixed schedule.
--
-- .github/workflows/cron.yml (voice-sweep) and session-word-audio.yml each fire
-- every 15 minutes, 24 hours a day — about 192 runs a day between them, whether
-- or not any learner is online and whether or not there is anything left to
-- generate. Every run starts with the queries below, and none of them had an
-- index that could serve it, so Postgres answered each one with a full table
-- scan (the sorts also read and discard every row they don't keep):
--
--   1. daily-cap.ts — `select count(*) from voice_audio_cache
--        where status = 'ready' and updated_at >= <today 00:00 UTC>`.
--      The only secondary index on this table is the PARTIAL
--      voice_audio_cache_status_idx (`where status <> 'ready'`), which by
--      definition can never answer a `status = 'ready'` question, and the
--      unique (voice_id, text_hash, generation_version) index doesn't lead
--      with either column. voice_audio_cache holds a row per cached clip
--      (every sentence of every lesson, book and word, in every voice, plus
--      the `voice_direction` jsonb and `normalized_text` on each), so this is
--      the largest of the four scans — twice per 15 minutes.
--
--   2. word-list-word-audio.ts (findWordsMissingWordListVoice) — the three
--      "newest words learners are working on" reads, each across ALL users via
--      the service role:
--        select word from mistakes              order by updated_at desc limit 150
--        select word from vocabulary_encounters order by created_at desc limit 150
--        select word from saved_words           order by created_at desc limit 150
--      The existing indexes on these tables are all (user_id, ...) — useless
--      for a cross-user "newest N" read — so each one scanned and sorted the
--      whole table to keep 150 rows. They grow with every learner.
--
-- On the project's Nano compute (0.5 GB RAM, shared CPU, burstable disk I/O)
-- repeated full scans are not just slow, they evict the pages the rest of the
-- app is actually using from a very small cache and spend the disk-I/O burst
-- budget — which is the failure mode that leaves Database / PostgREST / Auth /
-- Storage all reporting "Unhealthy" together.
--
-- Performance-only: no data, policy, grant or query result changes. Plain
-- CREATE INDEX (not CONCURRENTLY) so it can run inside the migration
-- transaction; these tables are small enough that the brief write lock is
-- negligible, but prefer a quiet moment all the same.

begin;

-- Partial: only 'ready' rows, which is exactly what the cap counts. Stays small
-- and index-only for the count, and is not touched by rows still generating/failed.
create index if not exists voice_audio_cache_ready_updated_at_idx
  on voice_audio_cache (updated_at)
  where status = 'ready';

create index if not exists mistakes_updated_at_idx
  on mistakes (updated_at desc);

create index if not exists vocabulary_encounters_created_at_idx
  on vocabulary_encounters (created_at desc);

create index if not exists saved_words_created_at_idx
  on saved_words (created_at desc);

commit;
