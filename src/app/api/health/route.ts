import { NextResponse } from "next/server";

/**
 * Liveness probe for the self-hosted server: "is this process up and serving
 * requests?" — used by the deploy script to decide when a freshly started copy
 * may receive traffic, and by the uptime monitor.
 *
 * Deliberately touches no database and no external service. A health check that
 * depends on Supabase would report the app as dead (and a deploy as failed)
 * whenever Supabase has a bad minute, which is exactly when the app should keep
 * running and serve what it can. `commit` is the git commit the running image was
 * built from (set by the deploy script), so a deploy can confirm that the copy
 * answering is the one it just started.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { status: "ok", commit: process.env.GIT_COMMIT_SHA ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
