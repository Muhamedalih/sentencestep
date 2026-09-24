const REQUEST_TIMEOUT_MS = 8_000;

/**
 * Builds a Supabase `global.fetch` override with this file's timeout+retry
 * behavior — factored out so server.ts/service-role.ts (genuinely
 * server-only: server.ts reads next/headers' cookies(), which Next.js
 * itself refuses to let a Client Component import at all) can layer an
 * additional, Node-only connection-pooling fix on top (see
 * server-fetch-with-timeout.ts) without that fix ever being reachable from
 * this file itself. This file stays free of any Node-only import for
 * exactly that reason: public-client.ts is the one Supabase client in this
 * app that's genuinely isomorphic by design — OnboardingIntroCard (a Client
 * Component) calls it directly from the browser, deliberately, to avoid
 * paying a DB round trip on every request just for a rare first-time-visitor
 * card (see getOnboardingCardSettings' own doc comment) — so anything
 * public-client.ts pulls in has to keep working unmodified in a browser
 * bundle. Confirmed the hard way: routing server-fetch-with-timeout.ts's
 * undici import through this file instead broke exactly that — webpack
 * can't bundle undici's own Node-builtin internals for the client at all
 * ("UnhandledSchemeError: Reading from 'node:assert'"), and the page
 * importing it rendered completely blank.
 *
 * `dispatcher`, not `setGlobalDispatcher`: passed straight through in the
 * fetch init so a caller's own Agent only ever governs the calls made
 * through the specific fetch function this returns, never any other fetch
 * in the process (Node's global fetch when this parameter is omitted,
 * i.e. every plain `supabaseFetchWithTimeout` call below).
 */
export function createSupabaseFetchWithTimeout(
  dispatcher?: unknown,
): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  return function supabaseFetchWithTimeout(input, init) {
    const method = (init?.method ?? "GET").toUpperCase();
    const isRead = method === "GET" || method === "HEAD";

    const attempt = () =>
      fetch(input, {
        ...init,
        ...(dispatcher ? ({ dispatcher } as RequestInit) : {}),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

    if (!isRead) return attempt();

    return attempt().catch((err) => {
      if (!(err instanceof Error) || err.name !== "TimeoutError") throw err;
      return attempt();
    });
  };
}

/**
 * Passed as the plain, dispatcher-less Supabase `global.fetch` override —
 * see client.ts (never imports this file at all) and public-client.ts
 * (the one place this exact export is used; server.ts/service-role.ts use
 * server-fetch-with-timeout.ts's dispatcher-carrying variant instead, built
 * from createSupabaseFetchWithTimeout above). Added after the same
 * 2026-09-09 stale-connection incident documented in
 * src/lib/voice/providers/fetch-with-timeout.ts, which that fix addressed
 * for the TTS provider APIs. /admin/voice/content (Story audio status, which
 * fires up to 20 concurrent Supabase reads via mapWithConcurrency) turned
 * out to hit the identical failure: Netlify's function logs showed one
 * request hang for exactly 60000ms and several more taking 9-18 seconds
 * (all against Supabase, not a TTS provider) in the same window a learner
 * saw this dashboard's page render throw and fall back to Next's generic
 * error page — the same stale-pooled-connection-across-a-frozen-Lambda
 * mechanism, just surfacing through supabase-js's own internal fetch calls
 * instead of a hand-written provider fetch.
 *
 * Read requests (GET — every `.select()`) are retried once on timeout, same
 * reasoning as the provider fix: a stale pooled connection never actually
 * reaches Postgres, so nothing happened server-side to duplicate, and a
 * retry almost always lands on a fresh connection. Write requests (POST/
 * PATCH/DELETE — insert/update/delete) are deliberately NOT retried here:
 * unlike a TTS synthesis call, a write's request could in principle have
 * been received and applied before the client gave up waiting, and blindly
 * retrying could double it (e.g. a duplicate insert). A write that times
 * out still fails fast instead of hanging for 60s and surfaces a real,
 * actionable error instead of an opaque 500 — it just doesn't self-heal the
 * way a read does.
 *
 * Originally 20_000ms — lowered the same day and for the same reason
 * documented in providers/fetch-with-timeout.ts: real, Sentry-confirmed
 * 504s in the admin bulk voice-generate action even after shrinking it to
 * one item per round, on a day Supabase's own status page showed their API
 * Gateway as "Degraded Performance." That action makes many of these calls
 * sequentially inside one synchronous request with a real 60s ceiling, so
 * even one or two calls timing out and retrying at 20s each could exhaust
 * the budget on their own. 8s keeps a single bad call's worst case at 16s
 * instead of 40s.
 */
export const supabaseFetchWithTimeout = createSupabaseFetchWithTimeout();
