import { createClient } from "@supabase/supabase-js";

import { supabaseFetchWithTimeout } from "@/lib/supabase/fetch-with-timeout";
import type { Database } from "@/types/database";

/**
 * Anonymous client for public content reads (lessons, sentences, levels).
 * Unlike client.ts/server.ts, this doesn't touch cookies, so it's safe to
 * call from build-time contexts like generateStaticParams. Only call this
 * when isSupabaseConfigured() is true.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { fetch: supabaseFetchWithTimeout } },
  );
}
