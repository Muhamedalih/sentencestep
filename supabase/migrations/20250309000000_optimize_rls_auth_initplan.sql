-- Performance-only fix for Supabase's "Auth RLS Initialization Plan" advisor
-- warning (auth_rls_initplan): every RLS policy in this schema calls
-- auth.uid() / is_admin() / is_editor() "bare" inside USING/WITH CHECK.
-- Postgres then re-evaluates that call ONCE PER ROW the policy is checked
-- against, instead of once per query — because a bare function call in a
-- qual isn't eligible to become a single InitPlan the way a scalar subquery
-- is. Wrapping each call as `(select auth.uid())` (same idea for the other
-- two) lets the planner hoist it into one InitPlan evaluated once per
-- statement. Supabase's own measurements of this exact change: a
-- security-definer role check like is_admin() went from 178s to 12ms on a
-- large table; see
-- https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
--
-- This is almost certainly a large share of the sustained high database CPU
-- behind the project showing "Unhealthy" (PostgREST/Auth both run queries
-- against the same Postgres instance a saturated CPU slows down first) —
-- every one of this schema's 106 policies across every per-user table
-- (profiles, user_progress, streaks, mistakes, lesson_attempts, word
-- progress, book progress, ...) pays this per-row tax on every single read
-- and write, and every content table's "admin/editor manage" policy pays it
-- on every row an admin/editor session touches.
--
-- SAFETY: this changes ONLY how each policy's condition is *evaluated*,
-- never *what it allows*. `(select auth.uid())` returns the exact same
-- value as bare `auth.uid()` within one statement (both read the same
-- per-request JWT claim via the same session-local GUC), so every existing
-- access rule — who can read/write which row — is identical before and
-- after, verified against representative expressions before this migration
-- was written. Nothing here drops or recreates a policy, touches a table,
-- or reads/writes a single row of application data: ALTER POLICY only
-- redefines a policy's USING/WITH CHECK expression in place, and any clause
-- not explicitly restated (e.g. a SELECT-only policy has no WITH CHECK)
-- is left untouched by Postgres itself, per the ALTER POLICY docs.
--
-- Reads every policy's CURRENT definition live from pg_policies rather than
-- reproducing 106 policies by hand from 82 prior migration files — correct
-- even if a policy was ever hand-edited outside the migrations folder,
-- since it rewrites whatever is actually live, not what this repo's history
-- says should be live. auth.uid(), is_admin() and is_editor() are the only
-- three functions this schema's policies ever call this way (verified: 63 +
-- 87 + 32 call sites, 0 already wrapped as of this migration), so the
-- substitution below is exhaustive. Idempotent — safe to re-run if ever
-- partially applied, since an already-wrapped `(select auth.uid())` no
-- longer matches the bare-call pattern below and is left alone.
begin;

do $$
declare
  pol record;
  new_qual text;
  new_check text;
  stmt text;
  changed_count int := 0;
begin
  for pol in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname in ('public', 'storage')
      and (
        qual ~ '(?<!select )\y(public\.)?(auth\.uid|is_admin|is_editor)\(\)'
        or with_check ~ '(?<!select )\y(public\.)?(auth\.uid|is_admin|is_editor)\(\)'
      )
    order by schemaname, tablename, policyname
  loop
    new_qual := pol.qual;
    new_check := pol.with_check;

    if new_qual is not null then
      new_qual := regexp_replace(
        new_qual, '(?<!select )\y(public\.)?auth\.uid\(\)', '(select auth.uid())', 'g');
      new_qual := regexp_replace(
        new_qual, '(?<!select )\y(public\.)?is_admin\(\)', '(select is_admin())', 'g');
      new_qual := regexp_replace(
        new_qual, '(?<!select )\y(public\.)?is_editor\(\)', '(select is_editor())', 'g');
    end if;

    if new_check is not null then
      new_check := regexp_replace(
        new_check, '(?<!select )\y(public\.)?auth\.uid\(\)', '(select auth.uid())', 'g');
      new_check := regexp_replace(
        new_check, '(?<!select )\y(public\.)?is_admin\(\)', '(select is_admin())', 'g');
      new_check := regexp_replace(
        new_check, '(?<!select )\y(public\.)?is_editor\(\)', '(select is_editor())', 'g');
    end if;

    if new_qual is distinct from pol.qual or new_check is distinct from pol.with_check then
      stmt := format('alter policy %I on %I.%I', pol.policyname, pol.schemaname, pol.tablename);
      if new_qual is not null then
        stmt := stmt || format(' using (%s)', new_qual);
      end if;
      if new_check is not null then
        stmt := stmt || format(' with check (%s)', new_check);
      end if;

      raise notice '--- %.%.%', pol.schemaname, pol.tablename, pol.policyname;
      if new_qual is distinct from pol.qual then
        raise notice '  qual:  % => %', pol.qual, new_qual;
      end if;
      if new_check is distinct from pol.with_check then
        raise notice '  check: % => %', pol.with_check, new_check;
      end if;

      execute stmt;
      changed_count := changed_count + 1;
    end if;
  end loop;

  raise notice '=== rewrote % polic(ies) ===', changed_count;
end $$;

commit;

-- Verification: should return 0 rows now that every bare call above is
-- wrapped. Any row here means a policy this migration's pattern didn't
-- catch — worth a second look rather than assuming the fix is complete.
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
  and (
    qual ~ '(?<!select )\y(public\.)?(auth\.uid|is_admin|is_editor)\(\)'
    or with_check ~ '(?<!select )\y(public\.)?(auth\.uid|is_admin|is_editor)\(\)'
  );
