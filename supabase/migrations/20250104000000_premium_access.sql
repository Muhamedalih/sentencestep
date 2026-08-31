-- Milestone 6: subscription/access fields + content-level enforcement.
--
-- No payment provider is connected yet — these columns exist so a future
-- webhook handler has somewhere to write (provider, provider_customer_id,
-- provider_subscription_id), not because anything populates them today.

alter table subscriptions
  add column if not exists plan text not null default 'free' check (plan in ('free', 'premium')),
  add column if not exists provider text,
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists updated_at timestamptz not null default now();

-- Every new user now gets both a profile and a default (free) subscription
-- row, so "missing subscription record" is the exception, not the norm —
-- the application still treats a missing row as free, defensively, since
-- accounts created before this migration won't have one.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'free');

  return new;
end;
$$;

-- Content enforcement: lesson/level metadata (title, is_free, ordering)
-- stays public so the library can list locked lessons for everyone: seeing
-- a premium lesson is fine, reading its sentences isn't. Sentences are the
-- actual learning content, so that's the table that needs to check access —
-- free lessons remain public; premium lessons require an active/trialing
-- subscription that hasn't passed its current_period_end.
drop policy if exists "Content is publicly readable" on sentences;

create policy "Free lesson sentences are public; premium requires active access" on sentences
  for select using (
    exists (
      select 1
      from lessons
      where lessons.id = sentences.lesson_id
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
