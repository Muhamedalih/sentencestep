-- Second structural contributor to the sustained high CPU / Disk IO Budget
-- exhaustion behind this project repeatedly going "Unhealthy" (the first was
-- the bare auth.uid()/is_admin()/is_editor() RLS calls fixed in
-- 20250309000000_optimize_rls_auth_initplan.sql). Found by auditing every
-- `references` clause across this schema's 83 prior migrations against
-- every existing index: these 15 foreign-key columns have no covering
-- index. Without one, Postgres must sequentially scan the ENTIRE
-- referencing table every time a row it points to is deleted (or, for an
-- "on delete cascade", to find the matching children to delete) — exactly
-- the kind of full-table read that burns through a Disk IO Budget. The
-- highest-risk cases, mistakes.sentence_id and
-- vocabulary_encounters.sentence_id, sit on two of this app's
-- highest-write-volume tables (a row per mistake / per newly-met word
-- during every lesson) while `sentences` content is actively
-- edited/replaced by admins and editors — so an ordinary content edit can
-- trigger an unindexed scan of a huge table. A composite index whose
-- leading column isn't the FK in question doesn't help either — e.g.
-- book_sentence_marks_user_book_idx (user_id, book_id) covers lookups by
-- user_id or by (user_id, book_id) together, but not by book_id alone,
-- which is exactly what a `books` row delete needs.
--
-- CREATE INDEX CONCURRENTLY, not plain CREATE INDEX: a plain index build
-- takes a lock that blocks writes to the table for its full duration, which
-- on mistakes/vocabulary_encounters/book_progress (this app's biggest,
-- busiest tables) could itself cause exactly the kind of stall this
-- migration is trying to fix. CONCURRENTLY avoids that at the cost of not
-- being usable inside a transaction block — hence no begin/commit wrapper
-- here, unlike every other migration in this folder. Each statement below
-- commits on its own, so this is also safe to stop and re-run partway
-- through.
--
-- If a run is interrupted partway (this project's connections have been
-- timing out under load), CONCURRENTLY can leave an INVALID index behind
-- whose name then blocks "if not exists" from retrying it silently unfixed.
-- Check with:
--   select indexrelid::regclass, indisvalid from pg_index where not indisvalid;
-- and `drop index concurrently <name>` anything invalid before re-running
-- this file.

-- --- high write volume, sentences content is actively edited: highest risk ---
create index concurrently if not exists mistakes_sentence_id_idx
  on mistakes (sentence_id);

create index concurrently if not exists vocabulary_encounters_sentence_id_idx
  on vocabulary_encounters (sentence_id);

-- --- per-user reading progress/marks tables ---
create index concurrently if not exists book_progress_book_id_idx
  on book_progress (book_id);

create index concurrently if not exists book_progress_current_sentence_id_idx
  on book_progress (current_sentence_id);

create index concurrently if not exists book_progress_current_section_id_idx
  on book_progress (current_section_id);

create index concurrently if not exists book_sentence_marks_sentence_id_idx
  on book_sentence_marks (sentence_id);

create index concurrently if not exists book_sentence_marks_book_id_idx
  on book_sentence_marks (book_id);

-- --- content/admin tables: smaller, less frequently mutated, lower risk ---
create index concurrently if not exists sentence_word_timings_voice_id_idx
  on sentence_word_timings (voice_id);

create index concurrently if not exists content_translations_reviewed_by_idx
  on content_translations (reviewed_by);

create index concurrently if not exists admin_audit_log_admin_id_idx
  on admin_audit_log (admin_id);

create index concurrently if not exists lessons_voice_id_idx
  on lessons (voice_id);

create index concurrently if not exists books_voice_id_idx
  on books (voice_id);

create index concurrently if not exists lesson_speaker_voices_voice_id_idx
  on lesson_speaker_voices (voice_id);

-- Both singleton tables (one row, id fixed at 1) — negligible load impact,
-- included only so Supabase's Performance Advisor shows a fully clean
-- "unindexed foreign keys" report.
create index concurrently if not exists tts_settings_default_voice_id_idx
  on tts_settings (default_voice_id);

create index concurrently if not exists elevenlabs_settings_default_story_voice_id_idx
  on elevenlabs_settings (default_story_voice_id);
