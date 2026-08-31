-- Milestone 11: admin authorization + content management system.
--
-- Extends the existing profiles table with a role rather than creating a
-- parallel admin-user mechanism. There is deliberately no self-service way
-- to become an admin: granting the role is a one-time manual
-- `update profiles set role = 'admin' where id = '...'` by whoever has
-- direct database access — see supabase/README.md.

alter table profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'admin'));

-- Referenced from RLS policies below (and reusable from any future policy
-- that needs the same check). security definer so it can read profiles
-- regardless of the calling row's own RLS, avoiding recursive policy
-- evaluation; stable since a user's role doesn't change mid-statement.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'
  );
$$;

-- Publishing state. Reuses the existing is_free column for premium access
-- (untouched) rather than duplicating that logic — this column only
-- controls visibility, not entitlement. Every existing row defaults to
-- 'published' so currently-live content stays live without a backfill.
alter table lessons
  add column if not exists status text not null default 'published'
    check (status in ('draft', 'published', 'archived')),
  add column if not exists updated_at timestamptz not null default now();

alter table sentences
  add column if not exists updated_at timestamptz not null default now();

-- --- RLS: learners see only published content; admins see and manage everything. ---

drop policy if exists "Content is publicly readable" on levels;
create policy "Content is publicly readable" on levels for select using (true);
create policy "Admins manage levels" on levels
  for all using (is_admin()) with check (is_admin());

drop policy if exists "Content is publicly readable" on lessons;
create policy "Published lessons are public; admins see all" on lessons
  for select using (status = 'published' or is_admin());
create policy "Admins manage lessons" on lessons
  for all using (is_admin()) with check (is_admin());

drop policy if exists "Free lesson sentences are public; premium requires active access" on sentences;
create policy "Published free sentences are public; premium needs access; admins see all" on sentences
  for select using (
    is_admin()
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
create policy "Admins manage sentences" on sentences
  for all using (is_admin()) with check (is_admin());

-- Lets an admin's dashboard count total users without granting access to
-- any other user's profile data beyond what's already public-ish (display
-- name, role, timestamps) — still no email, which lives in auth.users.
create policy "Admins read all profiles" on profiles
  for select using (is_admin());
