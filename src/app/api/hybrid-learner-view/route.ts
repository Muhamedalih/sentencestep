import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin/access";
import { LEARNER_VIEW_COOKIE, LEARNER_VIEW_MAX_AGE_SECONDS } from "@/lib/hybrid/learner-view";
import { getRequestOrigin } from "@/lib/request-origin";

/**
 * An admin turns the learner's view on for this browser (`?on=1`, the default) or off (`?on=0`), then
 * lands on Home. Anyone else only goes to Home: the view changes nothing for them. See learner-view.ts.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (await isAdmin()) {
    const store = await cookies();
    if (url.searchParams.get("on") === "0") {
      store.delete(LEARNER_VIEW_COOKIE);
    } else {
      store.set(LEARNER_VIEW_COOKIE, "1", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: LEARNER_VIEW_MAX_AGE_SECONDS,
      });
    }
  }
  // The public address the visitor used, not the server's bind address (see request-origin.ts).
  return NextResponse.redirect(new URL("/learn", getRequestOrigin(request)), 303);
}
