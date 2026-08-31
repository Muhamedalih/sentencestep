-- Spanish/localization foundation: normalized content-translations table +
-- widened profile language preference. Purely additive — no existing
-- column (title_ar, description_ar, ar, word_translations, hint_ar) is
-- touched, renamed, or dropped. Those stay the live source of truth for
-- Arabic until the read/write paths are migrated and verified against this
-- table; see supabase/README.md for how this project applies migrations
-- (no CLI link — paste into the SQL editor).
--
-- content_translations is keyed by (content_type, content_id, field, locale)
-- rather than sibling columns per content_type, so a third/fourth support
-- language (French, Kurdish, ...) is a data-only addition later, never a
-- schema change. `value` is jsonb for every field: a plain string for
-- scalar fields (title/description/text/hint), or a
-- [{"en": ..., "text": ...}] array for word-by-word/preview-sentence
-- fields, always in the row's own locale — never a mixed-language payload,
-- unlike the legacy {en,ar} pairs it's backfilled from.
begin;

create table content_translations (
  content_type text not null
    check (content_type in ('level', 'lesson', 'sentence', 'word_group', 'vocabulary_word')),
  content_id text not null,
  field text not null,
  locale text not null check (locale in ('ar', 'es')),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (content_type, content_id, field, locale)
);

-- Covers both "all translations for one content item" (admin edit form,
-- leftmost-prefix of the primary key) and this table's own primary-key
-- lookups; no separate locale-only index is needed since locale is never
-- queried without a content_type/content_id.
create index content_translations_content_idx on content_translations (content_type, content_id);

alter table content_translations enable row level security;

-- Same public-read / admin-write shape as every other content table
-- (is_admin() defined in 20250108000000_admin_cms.sql).
create policy "Content translations are publicly readable" on content_translations
  for select using (true);
create policy "Admins manage content translations" on content_translations
  for all using (is_admin()) with check (is_admin());

-- --- profiles.preferred_language: widen to the two learner-support
-- languages (ar/es). English is the language being LEARNED, not a support
-- language, so it's deliberately not a valid value here even though the
-- original constraint allowed it — no code path has ever written 'en'
-- (confirmed: no query/action/component in the app reads or writes this
-- column today), so this coalesce is a defensive no-op in the expected
-- case, not a real data migration.
update profiles set preferred_language = 'ar' where preferred_language = 'en';

alter table profiles drop constraint profiles_preferred_language_check;
alter table profiles add constraint profiles_preferred_language_check
  check (preferred_language in ('ar', 'es'));

-- --- Backfill: every existing Arabic value copied into content_translations
-- as locale='ar' rows. Idempotent (on conflict do nothing) so re-running
-- this migration, or re-running just this section after a partial failure,
-- never errors or double-inserts.

insert into content_translations (content_type, content_id, field, locale, value)
select 'level', id::text, 'title', 'ar', to_jsonb(title_ar)
from levels
on conflict (content_type, content_id, field, locale) do nothing;

insert into content_translations (content_type, content_id, field, locale, value)
select 'level', id::text, 'preview_sentences', 'ar',
  coalesce(
    (select jsonb_agg(jsonb_build_object('en', elem ->> 'en', 'text', elem ->> 'ar'))
     from jsonb_array_elements(preview_sentences) as elem),
    '[]'::jsonb
  )
from levels
where preview_sentences is not null
on conflict (content_type, content_id, field, locale) do nothing;

insert into content_translations (content_type, content_id, field, locale, value)
select 'lesson', id, 'title', 'ar', to_jsonb(title_ar)
from lessons
on conflict (content_type, content_id, field, locale) do nothing;

insert into content_translations (content_type, content_id, field, locale, value)
select 'lesson', id, 'description', 'ar', to_jsonb(description_ar)
from lessons
where description_ar is not null
on conflict (content_type, content_id, field, locale) do nothing;

insert into content_translations (content_type, content_id, field, locale, value)
select 'sentence', id, 'text', 'ar', to_jsonb(ar)
from sentences
on conflict (content_type, content_id, field, locale) do nothing;

insert into content_translations (content_type, content_id, field, locale, value)
select 'sentence', id, 'word_translations', 'ar',
  (select jsonb_agg(jsonb_build_object('en', elem ->> 'en', 'text', elem ->> 'ar'))
   from jsonb_array_elements(word_translations) as elem)
from sentences
where word_translations is not null
on conflict (content_type, content_id, field, locale) do nothing;

insert into content_translations (content_type, content_id, field, locale, value)
select 'word_group', id, 'title', 'ar', to_jsonb(title_ar)
from word_groups
on conflict (content_type, content_id, field, locale) do nothing;

insert into content_translations (content_type, content_id, field, locale, value)
select 'word_group', id, 'description', 'ar', to_jsonb(description_ar)
from word_groups
where description_ar is not null
on conflict (content_type, content_id, field, locale) do nothing;

insert into content_translations (content_type, content_id, field, locale, value)
select 'vocabulary_word', id, 'hint', 'ar', to_jsonb(hint_ar)
from vocabulary_words
on conflict (content_type, content_id, field, locale) do nothing;

commit;
