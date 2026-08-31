-- Phase 1 of the multilingual-content-architecture rework.
--
-- Three things, in order:
--
-- 1. A `locales` registry table, replacing the hardcoded
--    check (locale in ('ar','es')) on content_translations with a real
--    foreign key. Registering a future locale (Turkish, French, ...)
--    becomes a data insert here, not a schema migration.
--
-- 2. Lifecycle columns on content_translations (status/is_stale/
--    source_snapshot/etc.) so a translation's review state can be tracked
--    per-row, without a second parallel table — the natural key
--    (content_type, content_id, field, locale) already identifies exactly
--    the row that needs one.
--
-- 3. A resync of every Arabic content_translations row from the current
--    legacy `_ar` columns, fixing a confirmed staleness bug: saveLesson()
--    (src/lib/admin/content-actions.ts) writes Arabic edits only to
--    lessons.title_ar/description_ar and sentences.ar, never to
--    content_translations, while resolveScalarField() (src/lib/i18n/
--    content-translations.ts) prefers a content_translations row over the
--    legacy column whenever one exists. Any lesson that already had a
--    content_translations row from the original backfill (see
--    20250122000000_locale_foundation.sql) would silently keep serving
--    that backfilled snapshot to learners even after an admin edited its
--    Arabic text. A read-only audit of all 80 lessons / 960 sentences
--    immediately before this migration found zero rows where the legacy
--    column and content_translations already disagree — the bug hasn't
--    manifested in production data yet, only in the code path — but this
--    resync (and, in a later phase, changing the write path itself) closes
--    it going forward regardless. Legacy `_ar` columns are NOT dropped or
--    stopped being written in this migration — saveLesson still writes
--    them exactly as before; only the content_translations side is fixed
--    here. Also backfills a `source_snapshot` baseline (the English source
--    text a translation was made against) for every existing Spanish row,
--    so staleness detection has a starting point for both locales, not
--    just the newly-resynced Arabic ones.

-- ---------------------------------------------------------------------
-- 1. Locale registry
-- ---------------------------------------------------------------------

create table if not exists locales (
  code text primary key,
  display_name text not null,
  native_name text not null,
  dir text not null check (dir in ('ltr', 'rtl')),
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

alter table locales enable row level security;

create policy "Locales are publicly readable" on locales for select using (true);
create policy "Admins manage locales" on locales
  for all using (is_admin()) with check (is_admin());

insert into locales (code, display_name, native_name, dir, enabled) values
  ('ar', 'Arabic', 'العربية', 'rtl', true),
  ('es', 'Spanish', 'Español', 'ltr', true)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------
-- 2. Lifecycle columns on content_translations
-- ---------------------------------------------------------------------
--
-- status: the review state of the value currently stored in this row.
--   'approved' is the default for every pre-existing row (both the
--   original Arabic backfill and manually-entered Spanish) — they
--   represent human-authored content today, not AI drafts awaiting review.
-- is_stale: independent of status, on purpose. A translation can be both
--   'approved' AND stale (its source text has since changed) — it keeps
--   being served to learners (see the architecture report), just flagged
--   for re-review. Folding "stale" into the status enum would lose
--   whether a now-stale row was previously approved or never reviewed at
--   all, which matters for prioritizing review effort later.
-- source_snapshot: the exact English source text this value was
--   generated/approved against, used to detect staleness by direct text
--   comparison. Deliberately NOT a timestamp comparison against the
--   source row's updated_at — saveLesson() deletes and reinserts every
--   sentence on every lesson save (see its doc comment), so updated_at
--   changes on every save even for sentences whose English text didn't
--   change; a timestamp-based check would false-positive constantly.
-- previous_value: preserved only when an approved row is overwritten by a
--   new AI draft during a future regenerate action, so the prior approved
--   text isn't destroyed before the new draft is itself approved. Null
--   otherwise.
-- provider: free text ('manual', 'gpt-4o', ...) rather than an enum, so a
--   future provider change never needs a migration.
-- last_attempt_error/last_attempt_at/attempts: failure tracking for the
--   most recent generation attempt, deliberately separate from
--   status/value — a failed regeneration must never overwrite or blank out
--   a previously-approved translation, only record that it failed.

alter table content_translations
  add column if not exists status text not null default 'approved'
    check (status in ('ai_generated', 'approved', 'failed')),
  add column if not exists is_stale boolean not null default false,
  add column if not exists source_snapshot text,
  add column if not exists previous_value jsonb,
  add column if not exists generated_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users (id) on delete set null,
  add column if not exists provider text,
  add column if not exists last_attempt_error text,
  add column if not exists last_attempt_at timestamptz,
  add column if not exists attempts integer not null default 0;

create index if not exists content_translations_locale_status_idx
  on content_translations (locale, status);

-- ---------------------------------------------------------------------
-- 3. Resync Arabic content_translations from the legacy columns, and
--    backfill source_snapshot for both locales
-- ---------------------------------------------------------------------

insert into content_translations (content_type, content_id, field, locale, value, status, source_snapshot, updated_at)
select 'lesson', id, 'title', 'ar', to_jsonb(title_ar), 'approved', title, now()
from lessons
on conflict (content_type, content_id, field, locale)
do update set
  value = excluded.value,
  source_snapshot = excluded.source_snapshot,
  updated_at = excluded.updated_at;

insert into content_translations (content_type, content_id, field, locale, value, status, source_snapshot, updated_at)
select 'lesson', id, 'description', 'ar', to_jsonb(description_ar), 'approved', description, now()
from lessons
where description_ar is not null and description_ar <> ''
on conflict (content_type, content_id, field, locale)
do update set
  value = excluded.value,
  source_snapshot = excluded.source_snapshot,
  updated_at = excluded.updated_at;

insert into content_translations (content_type, content_id, field, locale, value, status, source_snapshot, updated_at)
select 'sentence', id, 'text', 'ar', to_jsonb(ar), 'approved', en, now()
from sentences
on conflict (content_type, content_id, field, locale)
do update set
  value = excluded.value,
  source_snapshot = excluded.source_snapshot,
  updated_at = excluded.updated_at;

-- Spanish rows already exist from admin entry; only fill in the
-- source_snapshot baseline they never had, don't touch their value/status.
update content_translations ct
set source_snapshot = l.title
from lessons l
where ct.content_type = 'lesson' and ct.field = 'title' and ct.locale = 'es'
  and ct.content_id = l.id and ct.source_snapshot is null;

update content_translations ct
set source_snapshot = l.description
from lessons l
where ct.content_type = 'lesson' and ct.field = 'description' and ct.locale = 'es'
  and ct.content_id = l.id and ct.source_snapshot is null;

update content_translations ct
set source_snapshot = s.en
from sentences s
where ct.content_type = 'sentence' and ct.field = 'text' and ct.locale = 'es'
  and ct.content_id = s.id and ct.source_snapshot is null;

-- ---------------------------------------------------------------------
-- 4. Replace the hardcoded locale check constraint with a real FK to
--    locales(code). Looked up dynamically rather than assumed by name,
--    since it was never given an explicit name in the original migration
--    (Postgres auto-names it) and guessing wrong would fail the migration.
-- ---------------------------------------------------------------------

do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'content_translations'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%locale%ar%es%';

  if constraint_name is not null then
    execute format('alter table content_translations drop constraint %I', constraint_name);
  end if;
end $$;

alter table content_translations
  add constraint content_translations_locale_fkey
  foreign key (locale) references locales (code);
