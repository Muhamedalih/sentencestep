-- German as a second language to learn (permission germanTrack, Admins only).
--
--   lessons.lang, word_groups.lang, passages.lang   'en' (default) or 'de': the language of the text
--                                                    the learner types or reads (the `en` columns
--                                                    keep holding that text, whatever the language).
--   lessons.source_id, word_groups.source_id,        the English row a German row was made from; the
--   passages.source_id                               Arabic/Spanish/Turkish meaning is copied from it.
--   profiles.target_language                         the language a learner learns: 'en' (default).
--
-- Additive and idempotent: every existing row becomes lang = 'en' and nothing else changes; the code
-- that reads these columns treats their absence as English only, so shipping it before this is
-- applied is safe. German rows are inserted as drafts and ids start with "de-".

begin;

alter table lessons     add column if not exists lang text not null default 'en';
alter table lessons     add column if not exists source_id text;
alter table word_groups add column if not exists lang text not null default 'en';
alter table word_groups add column if not exists source_id text;
alter table passages    add column if not exists lang text not null default 'en';
alter table passages    add column if not exists source_id text;
alter table profiles    add column if not exists target_language text not null default 'en';

do $$ begin
  alter table lessons     add constraint lessons_lang_check     check (lang in ('en','de'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table word_groups add constraint word_groups_lang_check check (lang in ('en','de'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table passages    add constraint passages_lang_check    check (lang in ('en','de'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table profiles    add constraint profiles_target_language_check check (target_language in ('en','de'));
exception when duplicate_object then null; end $$;

create index if not exists lessons_lang_idx     on lessons (lang);
create index if not exists word_groups_lang_idx on word_groups (lang);
create index if not exists passages_lang_idx    on passages (lang);

commit;
