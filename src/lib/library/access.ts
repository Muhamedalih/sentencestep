import { isAdmin } from "@/lib/admin/access";
import { hasPremiumAccess } from "@/lib/billing/access";
import { libraryOpenFor } from "@/lib/library/open-rule";
import { getRolloutAccess } from "@/lib/rollouts/queries";

/**
 * The Library pages' own check, in place of the admin-only one they used to make (the rule itself is
 * libraryOpenFor). The subscription is only looked up when the "libraryGift" permission is open for
 * this visitor, so while it is closed the cost is the admin check alone, exactly as before.
 */
export async function canOpenLibrary(): Promise<boolean> {
  const [admin, rollouts] = await Promise.all([isAdmin(), getRolloutAccess()]);
  if (admin) return true;
  if (!rollouts.libraryGift) return false;
  return libraryOpenFor({ isAdmin: false, giftOpen: true, isPremium: await hasPremiumAccess() });
}
