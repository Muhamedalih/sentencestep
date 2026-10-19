-- Two small additions for the email routing and the offers preference.
--
-- 1. email_usage: how many emails each provider has sent in a period (a day for Resend, whose free
--    plan allows 100 a day; a day-row per day for SES, summed over the month for its budget). The
--    app reserves a slot BEFORE sending (reserve_email_slot is one atomic statement, so two servers
--    sending at once cannot both take the last slot) and gives it back if the send fails. Not
--    readable by learners: no policy, only the service role touches it.
-- 2. email_preferences.offer_emails: whether a learner wants offers added to the reminders they get.
--    On by default, like the other two switches; the Settings page and the one-click unsubscribe
--    link in every nudge email turn it off.
--
-- Safe to deploy the app before this runs: the app treats a missing counter as "no limit known" and
-- a missing column as the default (on).
create table if not exists public.email_usage (
  period date not null,
  provider text not null,
  sent integer not null default 0 check (sent >= 0),
  primary key (period, provider)
);

alter table public.email_usage enable row level security;

create or replace function public.reserve_email_slot(p_period date, p_provider text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sent integer;
begin
  if p_limit <= 0 then
    return false;
  end if;
  insert into public.email_usage as u (period, provider, sent)
  values (p_period, p_provider, 1)
  on conflict (period, provider) do update set sent = u.sent + 1 where u.sent < p_limit
  returning u.sent into v_sent;
  return v_sent is not null;
end;
$$;

create or replace function public.release_email_slot(p_period date, p_provider text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.email_usage set sent = greatest(sent - 1, 0)
  where period = p_period and provider = p_provider;
$$;

revoke all on function public.reserve_email_slot(date, text, integer) from public, anon, authenticated;
revoke all on function public.release_email_slot(date, text) from public, anon, authenticated;
grant execute on function public.reserve_email_slot(date, text, integer) to service_role;
grant execute on function public.release_email_slot(date, text) to service_role;

alter table public.email_preferences
  add column if not exists offer_emails boolean not null default true;
