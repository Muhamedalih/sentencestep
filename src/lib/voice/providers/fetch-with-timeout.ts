const REQUEST_TIMEOUT_MS = 8_000;

/**
 * Wraps `fetch` with a per-request timeout and a single retry — added after
 * a 2026-09-09 incident where ElevenLabs/Cartesia/Hume preview and
 * generation calls intermittently hung for exactly 60000ms (Netlify's own
 * function timeout) before failing with an opaque 503, while most other
 * calls to the same endpoints completed in 2-6s. Confirmed via Netlify's
 * function logs: several invocations logged `Duration: 60000 ms` back to
 * back, interspersed with normal fast ones — not a slow provider (direct
 * curl calls to the same endpoints always returned in well under a second)
 * and not a cold-start effect (a full cache-cleared redeploy only masked it
 * temporarily, it came back once containers warmed back up).
 *
 * This matches a well-documented AWS Lambda failure mode (Netlify's
 * Next.js Runtime runs on Lambda under the hood): Node's global `fetch`
 * (undici) keeps HTTP connections alive and pools them for reuse across
 * invocations for performance. Between invocations, a Lambda execution
 * environment can be frozen (its process suspended) for an arbitrary
 * length of time. If the remote server or an intermediate network device
 * closes an idle pooled connection while the environment is frozen, Node
 * has no way to know — the next invocation that reuses that same
 * connection sends its request into a socket that will never respond,
 * hanging until the platform's own hard timeout kills the whole function.
 *
 * Disabling connection pooling outright would need a custom undici
 * `Agent`/dispatcher (a new dependency, not added here without validating
 * it actually helps). This fix instead bounds the damage: a stale
 * connection now fails fast instead of hanging for 60s, and is retried
 * once — a retry almost always gets a fresh connection and succeeds, since
 * only a fraction of pooled connections are stale at any given moment.
 *
 * Originally 20_000: safe in isolation (two attempts at 20s stay under
 * Netlify's 60s function timeout), but this fetch isn't the only thing
 * running inside that 60s budget — the admin bulk-generate action
 * (voice-generation-actions.ts) makes many of these calls sequentially
 * (one Director call plus one per sentence) inside a single synchronous
 * request, and Sentry caught real 504s in production even after that
 * action was shrunk to one lesson and one book per round, on a day
 * Supabase's own status page (status.supabase.com) showed their API
 * Gateway as "Degraded Performance" — i.e. more calls than usual were
 * running slow, not just the rare stale pooled connection. One or two
 * calls timing out and retrying at 20s each was, on its own, enough to
 * exceed the remaining budget. Lowered to 8s so a single bad call now
 * costs at most 16s (timeout + retry) instead of 40s, leaving the rest of
 * the round enough of the 60s budget to still finish even when several
 * calls are running slow at once.
 */
export async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    if (!(err instanceof Error) || err.name !== "TimeoutError") throw err;
    return fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  }
}
