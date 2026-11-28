import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isAdmin } from "@/lib/admin/access";
import { parseEgyptView } from "@/lib/billing/upgrade-modal-audience";
import { EGYPT_VIEW_COOKIE, EGYPT_VIEW_MAX_AGE_SECONDS } from "@/lib/billing/viewer-country";
import { LEARNER_VIEW_COOKIE } from "@/lib/hybrid/learner-view";
import { getRequestOrigin } from "@/lib/request-origin";

/**
 * An admin looks at the site as someone in Egypt for an hour (`?mode=now` or `?mode=popup`), or stops
 * (`?mode=off`). The learner's view goes on with it, because an admin's account otherwise sees every
 * lock open. Anyone else only goes to Home: nothing changes for them. See viewer-country.ts.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const view = parseEgyptView(new URL(request.url).searchParams.get("mode"));
  let target = "/learn";
  if (await isAdmin()) {
    const store = await cookies();
    if (view) {
      const options = {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: EGYPT_VIEW_MAX_AGE_SECONDS,
      } as const;
      store.set(EGYPT_VIEW_COOKIE, view, options);
      store.set(LEARNER_VIEW_COOKIE, "1", options);
      // The lessons list, where locked cards are.
      target = "/learn/normal";
    } else {
      store.delete(EGYPT_VIEW_COOKIE);
      store.delete(LEARNER_VIEW_COOKIE);
      target = "/admin/permissions";
    }
  }
  // The public address the visitor used, not the server's bind address (see request-origin.ts).
  return NextResponse.redirect(new URL(target, getRequestOrigin(request)), 303);
}
