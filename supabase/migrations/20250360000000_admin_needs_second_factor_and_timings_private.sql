-- Two closed doors.
--
-- 1. Two-factor sign-in was enforced only by the web app's middleware. A person who had stolen an
--    admin's PASSWORD (but not the authenticator code) holds a first-factor (aal1) session, and
--    could send that session's token straight to the database API, where is_admin() said yes.
--    is_admin() and is_editor() now also require the second step (aal2) whenever the account has a
--    verified two-factor device. An account with no device is unchanged, and so is every account
--    that has finished the code step (which the app already forces before any page opens).
--    Undo: re-run the two original definitions in 20250108000000_admin_cms.sql and
--    20250215000000_editor_role.sql.
--
-- 2. sentence_word_timings held the words of every narrated sentence, premium ones included, and was
--    readable by anyone with the public key. Only the server (service role, which ignores row-level
--    security) ever reads or writes it, so the public read policy is simply removed.
--    Undo: create policy "Sentence word timings are publicly readable" on sentence_word_timings
--          for select using (true);

begin;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'
  )
  and (
    coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors f
      where f.user_id = auth.uid() and f.status = 'verified'
    )
  );
$$;

create or replace function public.is_editor()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'editor'
  )
  and (
    coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors f
      where f.user_id = auth.uid() and f.status = 'verified'
    )
  );
$$;

drop policy if exists "Sentence word timings are publicly readable" on sentence_word_timings;

commit;
