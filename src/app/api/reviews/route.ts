import { NextResponse } from "next/server";

import { listPublicReviews } from "@/lib/stats/public-ratings";

/**
 * The learner ratings the rotating "what our learners say" box shows on the
 * first screen a new visitor sees. That screen sits on statically built pages
 * (a build-time page can't read the database for each visitor), so the box asks
 * for them here after the page loads. Open to everyone, like the page itself:
 * only what an admin approved for the public ever comes back (words, stars and
 * how long to show each — never an email or any id of a person).
 *
 * Kept by the CDN for a minute: an admin's change shows up on the Upgrade page
 * at once and here within about a minute.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const reviews = await listPublicReviews();
  return NextResponse.json(
    { reviews },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
  );
}
