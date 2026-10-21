-- Who each new feature is open to — the Permissions page (/admin/permissions). One row per
-- feature, written only by an admin. A feature with no row is "Admins only", so shipping code
-- for a new feature never opens it to anyone by itself.
--
--   mode 'admin'     only admins (and a browser an admin switched preview on for)
--   mode 'emails'    admins, plus the people whose email is in `emails`
--   mode 'everyone'  everybody; for a feature aimed at first-time visitors, `percent` of them
--
-- NOT publicly readable (unlike feature_settings): `emails` are the addresses of the people being
-- tried on, so there is no select policy for visitors at all. The server reads the table with the
-- service role (src/lib/rollouts/queries.ts) and only ever hands the browser yes/no answers.
create table if not exists rollouts (
  feature text primary key,
  mode text not null default 'admin' check (mode in ('admin', 'emails', 'everyone')),
  percent integer not null default 100 check (percent between 1 and 100),
  emails text[] not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

alter table rollouts enable row level security;

create policy "Admins manage rollouts" on rollouts
  for all using ((select is_admin())) with check ((select is_admin()));
