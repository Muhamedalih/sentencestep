-- Seeds Arabic, Spanish, and Turkish names for the 7 existing, fixed Library
-- categories (see 20250127000000_library_foundation.sql) into
-- content_translations, using the translation architecture that was already
-- built for this — content_type 'category' was registered in that same
-- migration's content_type check constraint and was always intended to be
-- populated this way (see the doc comment on content_translations in
-- src/types/database.ts). The Library homepage and Book Overview page
-- already resolve category names through getContentTranslations/
-- resolveScalarField, falling back to the English `categories.name` column
-- when no row exists here — this migration only adds data, no schema change.
--
-- A one-time seed rather than new admin-dashboard tooling because there are
-- only 7 categories and they change rarely; the admin Translations dashboard
-- (/admin/translations) only manages content_type 'lesson'/'sentence' today
-- and extending it for a 7-row, low-churn taxonomy was judged out of scope
-- here (see this session's report). If categories become admin-editable at
-- volume later, that dashboard is the natural place to add 'category'
-- support.
--
-- `field` is 'name' — the only category field the learner-facing UI
-- resolves (see resolveScalarField calls in src/lib/supabase/queries/
-- library.ts). `source_snapshot` is set to the current English name so the
-- existing is_stale mechanism will correctly flag these rows if an admin
-- ever renames a category's English source. `status` is 'approved' and
-- `provider` is 'manual', same as every other hand-authored row in this
-- table (see 20250123000000_translation_lifecycle_foundation.sql).
--
-- `on conflict do nothing` against the table's own primary key
-- (content_type, content_id, field, locale) makes this safe to run again,
-- and never overwrites a translation an admin may already have entered.
--
-- Category ids/English names below were read directly from the live
-- database at seed-authoring time, not assumed from the original migration
-- (whose "Money & Finance" seed value had already been hand-edited to
-- "Money Finance" live) — same out-of-band-then-migration-file pattern as
-- 20250143000000_word_lists_seed_content.sql.

insert into content_translations (content_type, content_id, field, locale, value, status, source_snapshot, provider)
values
  ('category', 'category-self-development', 'name', 'ar', to_jsonb('تطوير الذات'::text), 'approved', 'Self Development', 'manual'),
  ('category', 'category-self-development', 'name', 'es', to_jsonb('Desarrollo Personal'::text), 'approved', 'Self Development', 'manual'),
  ('category', 'category-self-development', 'name', 'tr', to_jsonb('Kişisel Gelişim'::text), 'approved', 'Self Development', 'manual'),

  ('category', 'category-business', 'name', 'ar', to_jsonb('الأعمال'::text), 'approved', 'Business', 'manual'),
  ('category', 'category-business', 'name', 'es', to_jsonb('Negocios'::text), 'approved', 'Business', 'manual'),
  ('category', 'category-business', 'name', 'tr', to_jsonb('İş Dünyası'::text), 'approved', 'Business', 'manual'),

  ('category', 'category-psychology', 'name', 'ar', to_jsonb('علم النفس'::text), 'approved', 'Psychology', 'manual'),
  ('category', 'category-psychology', 'name', 'es', to_jsonb('Psicología'::text), 'approved', 'Psychology', 'manual'),
  ('category', 'category-psychology', 'name', 'tr', to_jsonb('Psikoloji'::text), 'approved', 'Psychology', 'manual'),

  ('category', 'category-money-finance', 'name', 'ar', to_jsonb('المال والتمويل'::text), 'approved', 'Money Finance', 'manual'),
  ('category', 'category-money-finance', 'name', 'es', to_jsonb('Dinero y Finanzas'::text), 'approved', 'Money Finance', 'manual'),
  ('category', 'category-money-finance', 'name', 'tr', to_jsonb('Para ve Finans'::text), 'approved', 'Money Finance', 'manual'),

  ('category', 'category-productivity', 'name', 'ar', to_jsonb('الإنتاجية'::text), 'approved', 'Productivity', 'manual'),
  ('category', 'category-productivity', 'name', 'es', to_jsonb('Productividad'::text), 'approved', 'Productivity', 'manual'),
  ('category', 'category-productivity', 'name', 'tr', to_jsonb('Verimlilik'::text), 'approved', 'Productivity', 'manual'),

  ('category', 'category-biography', 'name', 'ar', to_jsonb('السيرة الذاتية'::text), 'approved', 'Biography', 'manual'),
  ('category', 'category-biography', 'name', 'es', to_jsonb('Biografía'::text), 'approved', 'Biography', 'manual'),
  ('category', 'category-biography', 'name', 'tr', to_jsonb('Biyografi'::text), 'approved', 'Biography', 'manual'),

  ('category', 'category-philosophy', 'name', 'ar', to_jsonb('الفلسفة'::text), 'approved', 'Philosophy', 'manual'),
  ('category', 'category-philosophy', 'name', 'es', to_jsonb('Filosofía'::text), 'approved', 'Philosophy', 'manual'),
  ('category', 'category-philosophy', 'name', 'tr', to_jsonb('Felsefe'::text), 'approved', 'Philosophy', 'manual')
on conflict (content_type, content_id, field, locale) do nothing;
