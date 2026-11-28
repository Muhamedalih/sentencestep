import { cookies } from "next/headers";

import { isAdmin } from "@/lib/admin/access";
import { EGYPT_COUNTRY } from "@/lib/billing/egypt-wallet/constants";
import { resolvePricingCountry } from "@/lib/billing/geo-pricing";
import { parseEgyptView } from "@/lib/billing/upgrade-modal-audience";
import type { EgyptView } from "@/lib/billing/upgrade-modal-audience";

/** Set by /api/egypt-view, for an admin on this browser. */
export const EGYPT_VIEW_COOKIE = "ss_egypt_view";
export const EGYPT_VIEW_MAX_AGE_SECONDS = 60 * 60;

/** The admin's Egypt view, or null. The admin check is made only when the cookie is there, so learners pay nothing for it. */
export async function getEgyptView(): Promise<EgyptView | null> {
  const view = parseEgyptView((await cookies()).get(EGYPT_VIEW_COOKIE)?.value);
  return view && (await isAdmin()) ? view : null;
}

/**
 * The country the buying screens are DRAWN for: the visitor's own, or Egypt while an admin has the
 * Egypt view on. Only for what is shown. Checkout, analytics and codes keep resolvePricingCountry.
 */
export async function resolveViewerCountry(headers: {
  get(name: string): string | null;
}): Promise<{ country: string | null; view: EgyptView | null }> {
  const view = await getEgyptView();
  return { country: view ? EGYPT_COUNTRY : resolvePricingCountry(headers).country, view };
}
