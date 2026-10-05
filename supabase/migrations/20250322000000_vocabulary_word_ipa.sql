-- Word Lists: an optional IPA pronunciation per word, shown on the summary
-- that follows every block of five words. Nullable on purpose: null means
-- "use the generated fallback" (src/data/word-lists/ipa.ts, keyed by the
-- target word), so every existing row keeps working with no backfill, and an
-- admin only fills this in to correct or add a pronunciation (Admin ->
-- Word Lists -> Edit words). Stored bare, without the surrounding slashes
-- (e.g. 'ænt'); the slashes are display. No grant change needed: unlike
-- profiles, vocabulary_words has no column-level write allowlist.
begin;

alter table vocabulary_words
  add column if not exists ipa text;

commit;
