import "server-only";

import { cookies, headers } from "next/headers";

import { detectInAppBrowser } from "@/lib/analytics/attribution";
import {
  IN_APP_BUCKET_COOKIE,
  decideStrip,
  parseBucket,
  parseForcedStrip,
} from "@/lib/in-app-strip/strip";
import type { StripDecision } from "@/lib/in-app-strip/strip";
import { visitorShare } from "@/lib/rollouts/config";
import { getRolloutAccess, getRolloutConfig } from "@/lib/rollouts/queries";

/**
 * What the sign-up and sign-in pages do about the open in browser strip for this request (see
 * strip.ts): null for everyone outside Facebook's and Instagram's browsers, which costs two header and
 * cookie reads and nothing else; the decision for anyone inside them. `forcedParam` is the page's
 * ?in_app_strip= value. Never throws: on any failure the page is the ordinary one.
 */
export async function getInAppStripDecision(
  forcedParam: string | undefined,
): Promise<StripDecision | null> {
  try {
    const [requestHeaders, cookieStore] = await Promise.all([headers(), cookies()]);
    const userAgent = requestHeaders.get("user-agent");
    const forced = parseForcedStrip(forcedParam);
    if (!forced && !detectInAppBrowser(userAgent)) return null;

    // Who the permission is open to is only needed to let an admin look at a named version.
    const [config, access] = await Promise.all([
      getRolloutConfig(),
      forced?.app ? getRolloutAccess() : Promise.resolve(null),
    ]);
    return decideStrip({
      userAgent,
      forcedParam: forcedParam ?? null,
      access: access?.inAppStrip ?? false,
      share: visitorShare(config.inAppStrip),
      bucket: parseBucket(cookieStore.get(IN_APP_BUCKET_COOKIE)?.value),
    });
  } catch (error) {
    console.error("[in-app-strip] couldn't decide; the ordinary page is served", error);
    return null;
  }
}
