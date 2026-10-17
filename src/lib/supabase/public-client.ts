import { createClient } from "@supabase/supabase-js";

import { supabaseFetchWithTimeout } from "@/lib/supabase/fetch-with-timeout";
import type { Database } from "@/types/database";

function buildPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // This client never signs anyone in, so it must not behave like one that does.
      // supabase-js defaults to autoRefreshToken: true, and on a server that starts a
      // 30-second timer for every client ever created — a timer nothing ever stops, so
      // the client, and everything it references, stays in memory for good. This app
      // built one of these per call (dozens per page render): a measured ~0.25 MB left
      // behind per page view, which grew the live server to its 1.5 GB heap limit and
      // crashed it with "JavaScript heap out of memory" (2026-10-17 07:54 UTC), failing
      // every request in flight and slowing everything down for hours before.
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      global: { fetch: supabaseFetchWithTimeout },
    },
  );
}

let publicClient: ReturnType<typeof buildPublicClient> | undefined;

/**
 * Anonymous client for public content reads (lessons, sentences, levels).
 * Unlike client.ts/server.ts, this doesn't touch cookies, so it's safe to
 * call from build-time contexts like generateStaticParams. Only call this
 * when isSupabaseConfigured() is true.
 *
 * One shared instance: with no session and no cookies it holds nothing that
 * belongs to a particular request or visitor, so every caller can use the same
 * client instead of paying to construct a new one each time.
 */
export function createPublicClient() {
  publicClient ??= buildPublicClient();
  return publicClient;
}
