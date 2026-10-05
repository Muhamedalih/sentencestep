# Supabase project shows "Unhealthy" — how to find out why

The project (`looma-us-east`, ref `kseqmehbtyxcrgauksom`) runs on **Nano** compute:
0.5 GB RAM, shared burstable CPU, burstable disk I/O. When Postgres itself is
the problem, PostgREST, Auth and Storage all turn "Unhealthy" together while
Realtime and Edge Functions (which don't depend on it) stay "Healthy" — that is
the pattern on the dashboard. The status page only shows the symptom. The steps
below find the cause. Run them **while it is unhealthy or right after it
recovers**, because some counters reset on restart.

## 1. Was it memory, disk I/O, CPU or connections?

**Dashboard → Reports → Database** (zoom to the hour it failed):

| Chart                    | What decides it                                                                    |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Memory                   | Sits near 70% when idle (as on the dashboard card) → almost no headroom for bursts |
| Disk IO bandwidth / IOPS | Flat at the ceiling or "budget depleted" → I/O throttling                          |
| CPU                      | Pinned for minutes → a heavy query or a flood of requests                          |
| Database connections     | At/near the limit → too many clients                                               |

**Dashboard → Logs → Postgres Logs**, run:

```sql
select timestamp, event_message
from postgres_logs
where event_message ilike '%out of memory%'
   or event_message ilike '%terminated by signal%'
   or event_message ilike '%too many clients%'
   or event_message ilike '%could not fork%'
   or event_message ilike '%checkpoint%'
order by timestamp desc
limit 50;
```

- `terminated by signal 9` / `out of memory` → the kernel OOM-killed Postgres.
  Everything restarts and is "Unhealthy" for a few minutes. **Memory.**
- `too many clients` / `remaining connection slots are reserved` → **Connections.**
- Memory and connections fine, but the I/O chart is flat at its limit → **Disk I/O budget.**

## 2. What is the load actually made of?

SQL editor (Postgres):

```sql
-- Queries that cost the most total time since the last stats reset
select round(total_exec_time::numeric / 1000) as total_s,
       calls,
       round(mean_exec_time::numeric, 1)        as mean_ms,
       shared_blks_read                         as blocks_read_from_disk,
       left(query, 110)                         as query
from pg_stat_statements
order by total_exec_time desc
limit 15;

-- Same, ranked by disk reads (the I/O budget killer)
select shared_blks_read, calls, left(query, 110) as query
from pg_stat_statements
order by shared_blks_read desc
limit 15;

-- Tables being read by full scans
select relname, seq_scan, seq_tup_read, idx_scan, n_live_tup,
       pg_size_pretty(pg_total_relation_size(relid)) as size
from pg_stat_user_tables
order by seq_tup_read desc
limit 15;

-- Who is holding connections
select usename, application_name, state, count(*)
from pg_stat_activity
group by 1, 2, 3
order by 4 desc;

-- Cache hit ratio (should be > 0.99; lower = the working set doesn't fit in RAM)
select sum(heap_blks_hit) / nullif(sum(heap_blks_hit + heap_blks_read), 0) as hit_ratio
from pg_statio_user_tables;
```

What to expect from this codebase, so the output is easy to read:

- `voice_audio_cache`, `mistakes`, `vocabulary_encounters`, `saved_words` near the
  top of `seq_tup_read` → the scheduled sweeps (fixed by
  `20250328000000_sweep_hot_path_indexes.sql`).
- A very large `calls` count for `select ... from auth.users` / `sessions` coming
  from the Auth service → see step 3.
- Many short `select ... from lessons / sentences / voices / voice_audio_cache`
  statements in bursts every 15 minutes → `/api/cron/voice-sweep` (see below).

After applying a fix, run `select pg_stat_statements_reset();` and look again a day
later — otherwise the old numbers keep dominating the ranking.

## 3. JWT signing keys (cuts per-request Auth load)

**Dashboard → Project Settings → JWT Keys.** `src/middleware.ts` and
`src/lib/supabase/auth.ts` verify the session with `supabase.auth.getClaims()`.
With asymmetric keys (ES256/RS256) that is verified locally, with no network call.
If the project still signs with the **legacy shared secret (HS256)**, supabase-js
falls back to `getUser()` on every call — a request to the Auth server that reads
the database — and the app makes it in the middleware **and again** in the page,
for every signed-in request and every Server Action. Migrating the project to
asymmetric signing keys removes that load; no code change is needed.

## 4. The structural fix: compute size

Nano's memory is already ~70% used with nobody asking it for anything, so any
burst (a sort, an autovacuum, a few dozen concurrent requests) can push Postgres
over the edge. Reducing load (below) makes bursts rarer; it cannot create
headroom. If step 1 shows memory or I/O as the cause, move to **Micro or Small**
(Project Settings → Compute and Disk). Check the current price on the dashboard.

## Background load in this repo (for reference)

| Job                                 | Schedule             | What it does when there is nothing to do                                                                                              |
| ----------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `cron.yml` → `voice-sweep`          | every 15 min, 24/7   | Re-reads every candidate lesson/book/word group (≈ 4–6 sequential queries each, up to ~90 candidates) only to find everything is done |
| `session-word-audio.yml`            | 7,22,37,52 each hour | Daily-cap count + three cross-user "newest words" reads + clip lookups                                                                |
| `cron.yml` → translation-sweep      | daily 03:00 UTC      | Bounded                                                                                                                               |
| `cron.yml` → inactive-learners (×2) | daily 15:00 UTC      | Bounded to 500 per run                                                                                                                |

If step 2 shows `voice-sweep` as a top consumer, the cheapest lever is its cadence
(`*/15` → hourly): the lesson-save `after()` hook already generates audio for new
content immediately, so the sweep is only a safety net for lost attempts. Not
changed here because it trades backlog-recovery speed for load and is the owner's
call.
