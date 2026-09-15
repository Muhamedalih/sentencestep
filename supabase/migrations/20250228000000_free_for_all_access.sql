-- Temporary sitewide "everything is free" promotion switch, admin-controlled.
--
-- A single boolean the whole premium gate can be suspended behind without
-- touching any real subscription data: getAccessState()
-- (src/lib/billing/access.ts) treats every visitor as premium while this is
-- on, and the sentences/vocabulary_words policies below independently allow
-- the same bypass at the database layer — the same defense-in-depth shape
-- premium access itself already uses (see 20250108000000_admin_cms.sql).
-- Turning free_for_all back off via /admin/free-access is the entire
-- revert: no subscriptions row is ever written by this feature, so real
-- access resumes exactly as it was computed before the promotion.
create table if not exists access_settings (
  id integer primary key default 1,
  free_for_all boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint access_settings_singleton check (id = 1)
);

-- Enabled immediately on this migration's rollout — see this feature's own
-- admin page to turn it back off.
insert into access_settings (id, free_for_all) values (1, true) on conflict (id) do nothing;

alter table access_settings enable row level security;

create policy "Access settings are publicly readable" on access_settings
  for select using (true);

create policy "Admins manage access settings" on access_settings
  for all using (is_admin()) with check (is_admin());

-- Same policy as 20250108000000_admin_cms.sql, plus one extra "or" branch.
drop policy if exists "Published free sentences are public; premium needs access; admins see all" on sentences;
create policy "Published free sentences are public; premium needs access; admins see all" on sentences
  for select using (
    is_admin()
    or exists (select 1 from access_settings where id = 1 and free_for_all)
    or exists (
      select 1
      from lessons
      where lessons.id = sentences.lesson_id
        and lessons.status = 'published'
        and (
          lessons.is_free
          or exists (
            select 1
            from subscriptions
            where subscriptions.user_id = auth.uid()
              and subscriptions.status in ('active', 'trialing')
              and (
                subscriptions.current_period_end is null
                or subscriptions.current_period_end > now()
              )
          )
        )
    )
  );

-- Same policy as 20250119000000_word_lists.sql, plus the identical extra branch.
drop policy if exists "Words in published free groups are public; premium needs access; admins see all" on vocabulary_words;
create policy "Words in published free groups are public; premium needs access; admins see all" on vocabulary_words
  for select using (
    is_admin()
    or exists (select 1 from access_settings where id = 1 and free_for_all)
    or exists (
      select 1
      from word_groups
      where word_groups.id = vocabulary_words.group_id
        and word_groups.status = 'published'
        and (
          word_groups.is_free
          or exists (
            select 1
            from subscriptions
            where subscriptions.user_id = auth.uid()
              and subscriptions.status in ('active', 'trialing')
              and (
                subscriptions.current_period_end is null
                or subscriptions.current_period_end > now()
              )
          )
        )
    )
  );
