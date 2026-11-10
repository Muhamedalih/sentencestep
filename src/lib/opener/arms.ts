import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { isAdmin } from "@/lib/admin/access";
import { VISITOR_TOKEN_COOKIE, inVisitorShare, parseVisitorToken } from "@/lib/opener/shared";
import { getRolloutAccess, getRolloutConfig, isRolloutPreviewActive } from "@/lib/rollouts/queries";

export interface OpenerArms {
  /** This visitor gets the short opening text (permission shortOpener). */
  short: boolean;
  /** This visitor gets the «تخطّي الدرس» button (permission openerSkip). */
  skip: boolean;
}

/**
 * Which of the two opening-lesson tests THIS request is in. "Admins only" (the default): only an
 * admin, or a browser an admin switched preview on for. "A share of new visitors": that share of
 * visitors, cut by their token, plus admins as always. Never throws: on any failure the ordinary
 * opening lesson is served. cache()'d per request.
 */
export const getOpenerArms = cache(async (): Promise<OpenerArms> => {
  try {
    const [config, access, cookieStore] = await Promise.all([
      getRolloutConfig(),
      getRolloutAccess(),
      cookies(),
    ]);
    const token = parseVisitorToken(cookieStore.get(VISITOR_TOKEN_COOKIE)?.value);

    async function decide(id: "shortOpener" | "openerSkip"): Promise<boolean> {
      const entry = config[id];
      // In "admin" mode the access answer is exactly "an admin or a previewing browser".
      if (entry.mode !== "everyone") return access[id];
      if (inVisitorShare(id, entry, token)) return true;
      // Outside the share: an admin (or a previewing browser) still has it.
      return (await isRolloutPreviewActive()) || (await isAdmin().catch(() => false));
    }

    const [short, skip] = await Promise.all([decide("shortOpener"), decide("openerSkip")]);
    return { short, skip };
  } catch (error) {
    console.error(
      "[opener] couldn't decide the opening lesson's tests; ordinary lesson served",
      error,
    );
    return { short: false, skip: false };
  }
});
