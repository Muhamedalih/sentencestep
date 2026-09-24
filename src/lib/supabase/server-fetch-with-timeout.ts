import { Agent } from "undici";

import { createSupabaseFetchWithTimeout } from "@/lib/supabase/fetch-with-timeout";

/**
 * A bound on how long this process will hold a Supabase connection open for
 * reuse, addressing what fetch-with-timeout.ts's timeout/retry only ever
 * papered over: the recurring failure both document is a *frozen* Netlify
 * function thawing with a keep-alive connection it thinks is still good,
 * which Supabase's own side has in fact already closed after its own idle
 * timeout — the request then hangs until the timeout there notices. Node's
 * global fetch (undici under the hood) defaults to holding a pooled
 * connection open for reuse far longer than that, which is exactly what a
 * frozen-then-thawed invocation can outlive.
 *
 * 10s, not shorter: a same-request run of live-tested this app against its
 * own project first with `Connection: close` (never reuse a connection at
 * all, forcing every single call to pay a fresh handshake) — measured
 * *worse*, not better: cascading TimeoutErrors and a raw ECONNRESET, one
 * page 500ing after 75s. That result is itself evidence about this specific
 * backend (a free-tier, shared-compute Supabase project — see the
 * performance report this shipped alongside): it copes with *reusing* a
 * connection far better than with *establishing* a fresh one on every call,
 * so this leans toward preserving reuse rather than minimizing it. 10s is
 * long enough that a single request's own several-sequential-call pattern
 * (e.g. recordCompletionAction's ~10 Supabase round trips for one lesson
 * completion) reuses one warm connection across calls that land within it,
 * while still being short enough that it's very unlikely to survive an
 * actual freeze gap between separate invocations — Netlify only freezes a
 * function once it's sitting idle between requests, never mid-flight during
 * one. A starting, reasoned value informed by that one live comparison, not
 * a measured optimum — there's no way to force a real frozen-then-thawed
 * invocation from outside Netlify's own infrastructure to tune this
 * against, so it's worth revisiting against real production timing data
 * (Sentry is already wired up) once this has run for a while.
 * keepAliveMaxTimeout matches it so a server-sent Keep-Alive header can't
 * extend the window beyond what's set here.
 */
const supabaseAgent = new Agent({ keepAliveTimeout: 10_000, keepAliveMaxTimeout: 10_000 });

/**
 * The one Supabase `global.fetch` override that also carries the
 * connection-pooling fix above — used only by server.ts and
 * service-role.ts, the two Supabase clients that are genuinely never
 * reachable from a browser bundle (server.ts reads next/headers' cookies(),
 * which Next.js itself refuses to let a Client Component import at all;
 * service-role.ts's own doc comment says the same for a different reason).
 * public-client.ts deliberately keeps using fetch-with-timeout.ts's plain,
 * dispatcher-less export instead — see that file's own doc comment for why
 * it has to stay free of this file's undici import.
 *
 * This file's own import of `undici` is why next.config.ts's
 * serverExternalPackages lists "undici": webpack can't bundle its
 * Node-builtin internals for ANY target (confirmed live — even the
 * server-side webpack compiler failed the exact same way client bundling
 * later did, before that config change), so it has to load via real Node
 * require() at runtime instead, exactly like msedge-tts just above it in
 * that same list and for the same underlying reason.
 */
export const supabaseServerFetchWithTimeout = createSupabaseFetchWithTimeout(supabaseAgent);
