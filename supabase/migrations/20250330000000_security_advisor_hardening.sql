-- Security Advisor hardening (the "Warnings" tab of Supabase → Advisors → Security Advisor).
--
-- Safe to run more than once. It changes no table, policy or data.

-- 1. "Function Search Path Mutable": public.payment_orders_guard().
--    The trigger that protects payment_orders (immutable snapshot, no deletes) ran
--    with whatever search_path the caller had. It only uses built-ins (now(), the
--    comparison operators and plpgsql's own new/old), so an empty search_path is safe.
alter function public.payment_orders_guard() set search_path = '';

-- 2. "Public / Signed-In Users Can Execute SECURITY DEFINER Function":
--    public.handle_new_user().
--    It is a trigger function (it only runs when a row is inserted into auth.users),
--    so nobody needs to call it through the API. Postgres checks EXECUTE rights when
--    a trigger is created, not each time it fires, so sign-up keeps working.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Deliberately NOT changed: public.is_admin() and public.is_editor().
-- The Advisor lists them too, but they are called from row-level-security policies,
-- and a policy is evaluated with the rights of whoever runs the query (signed-out
-- visitors included): revoking EXECUTE would make those policies fail with
-- "permission denied for function" and lock everyone out of the free lessons.
-- They only answer "is the person asking an admin / editor?" for the caller's own
-- account (auth.uid(); NULL when signed out, so the answer is false), so exposing
-- them reveals nothing about anyone else.
--
-- Also not in this file: "Leaked Password Protection Disabled" is a switch in the
-- dashboard (Authentication → Passwords → "Prevent use of leaked passwords").
