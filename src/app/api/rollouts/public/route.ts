import { NextResponse } from "next/server";

import { visitorShare } from "@/lib/rollouts/config";
import { getRolloutConfig } from "@/lib/rollouts/queries";

/**
 * What a first-time visitor's browser needs to know before anyone has an account — today only the
 * share of new visitors given the short first run (the "Short first run" permission,
 * /admin/permissions). The marketing pages are static and cannot ask the server who is looking, so
 * the browser asks this instead, once per new visitor. It carries numbers only — never the emails on
 * any list — and is cached for a minute so a busy hour costs the database one read.
 */
export async function GET() {
  const config = await getRolloutConfig();
  return NextResponse.json(
    { shortFirstRun: { share: visitorShare(config.shortFirstRun) } },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
