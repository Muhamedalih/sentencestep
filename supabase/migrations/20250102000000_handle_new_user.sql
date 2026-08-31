-- Auto-creates a profile row whenever a new Supabase Auth user is created.
--
-- Runs as the function owner (security definer) because the insert has to
-- succeed even when the new user has no authenticated session yet — e.g.
-- while email confirmation is pending, before their first authenticated
-- request. This is the standard, narrowly-scoped Supabase pattern for
-- populating a profile row on signup; it does not weaken the "Users manage
-- their own profile" RLS policy on profiles, which still applies to every
-- other read/write path.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
