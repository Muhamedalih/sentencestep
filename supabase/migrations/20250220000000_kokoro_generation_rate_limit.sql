-- Root-cause fix for the audit finding that on-demand Kokoro pronunciation
-- generation (src/lib/voice/voice-audio.ts's resolvePronunciationAudioAction)
-- had no per-learner throttle at all: a real Kokoro cache MISS runs actual
-- CPU-bound ONNX inference server-side, so a scripted or buggy client
-- requesting many never-before-heard content ids in a short window could
-- force repeated cold model invocations and degrade the service for
-- everyone else. A cache HIT never reaches this table at all (see
-- resolvePronunciationAudioAction) — only genuine generation attempts are
-- throttled, so normal replay/practice traffic is never affected.
--
-- Service-role-only by design, identical reasoning to login_attempts
-- (20250216000000_login_attempt_lockout.sql): no RLS policy for any role
-- exists here, so anon/authenticated can never read or write a row through
-- PostgREST — this is purely an internal ledger for
-- src/lib/voice/kokoro-rate-limit.ts.
begin;

create table kokoro_generation_attempts (
  id uuid primary key default gen_random_uuid(),
  -- "user:<uuid>" for a signed-in learner, "ip:<address>" for a guest (the
  -- learning app is guest-reachable — see middleware.ts's own doc comment)
  -- — never a bare email/IP with no prefix, so the two identifier spaces can
  -- never collide.
  identifier text not null,
  created_at timestamptz not null default now()
);

-- The one query this table exists to serve: "how many recent generation
-- attempts for this identifier" — created_at DESC so a LIMIT/COUNT-bounded
-- recency check never has to scan the whole table as it grows.
create index kokoro_generation_attempts_identifier_created_at_idx
  on kokoro_generation_attempts (identifier, created_at desc);

alter table kokoro_generation_attempts enable row level security;

commit;
