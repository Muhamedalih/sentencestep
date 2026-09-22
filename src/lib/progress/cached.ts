import { cache } from "react";

import { fetchProgressAction } from "@/lib/progress/actions";

/**
 * Request-scoped memoization of fetchProgressAction (mirrors
 * src/lib/supabase/auth.ts's identical use of React's cache() for
 * getCurrentUser) — lets both learn/(dashboard)/layout.tsx (for AppHeader's
 * streak/XP) and a page rendered inside it (e.g. the Home dashboard, for its
 * own body) call this with the same todayISO during one request and only
 * pay for fetchProgressAction's underlying 7-query Promise.all once, not
 * twice. Wrapping this shared export (not fetchProgressAction itself) keeps
 * that file's "use server" Server Action shape — the one the client-side
 * useProgress hook invokes over the network on every other route — entirely
 * unchanged.
 */
export const fetchProgressCached = cache(fetchProgressAction);
