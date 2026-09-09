const REQUEST_TIMEOUT_MS = 20_000;

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
 * connection now fails after REQUEST_TIMEOUT_MS instead of 60s, and is
 * retried once — a retry almost always gets a fresh connection and
 * succeeds, since only a fraction of pooled connections are stale at any
 * given moment. Two attempts at 20s each stay safely under Netlify's 60s
 * function timeout even in the worst case.
 */
export async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (err) {
    if (!(err instanceof Error) || err.name !== "TimeoutError") throw err;
    return fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  }
}
