-- Admin-managed cover card shown once, as the third and last step of the
-- homepage's "get started" flow (language -> level -> this card -> lesson),
-- right before a first-time learner enters their opening lesson. Same
-- singleton-row shape as typing_sound_settings: one admin-picked
-- image/title applies to every first-time learner regardless of which
-- level they picked, read publicly (see
-- src/lib/admin/onboarding-card-queries.ts, consumed by
-- src/components/app/onboarding-intro-card.tsx), written only by admins.
create table if not exists onboarding_intro_card (
  id integer primary key default 1,
  image_url text,
  title text not null default 'Your English Journey Starts Here',
  updated_at timestamptz not null default now(),
  constraint onboarding_intro_card_singleton check (id = 1)
);

insert into onboarding_intro_card (id) values (1) on conflict (id) do nothing;

alter table onboarding_intro_card enable row level security;

create policy "Onboarding intro card is publicly readable" on onboarding_intro_card
  for select using (true);

create policy "Admins manage onboarding intro card" on onboarding_intro_card
  for all using (is_admin()) with check (is_admin());

-- Storage bucket for the card's image, same public-bucket/admin-write-only
-- shape as lesson-illustrations (20250112000000_lesson_illustrations.sql).
insert into storage.buckets (id, name, public)
values ('onboarding-card', 'onboarding-card', true)
on conflict (id) do nothing;

create policy "Admins upload onboarding card image" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'onboarding-card' and is_admin());

create policy "Admins update onboarding card image" on storage.objects
  for update to authenticated
  using (bucket_id = 'onboarding-card' and is_admin())
  with check (bucket_id = 'onboarding-card' and is_admin());

create policy "Admins delete onboarding card image" on storage.objects
  for delete to authenticated
  using (bucket_id = 'onboarding-card' and is_admin());
