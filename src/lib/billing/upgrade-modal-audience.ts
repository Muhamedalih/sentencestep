import { EGYPT_COUNTRY } from "@/lib/billing/egypt-wallet/constants";

/**
 * Whether the upgrade pop-up (permission upgradeModal) is used for a visitor from `country`
 * (as resolvePricingCountry returns it). Not for Egypt: after the pop-up opened to everyone, pay
 * presses from Egypt almost stopped while they held elsewhere, so a visitor there gets the lock
 * page and the plans page again.
 */
export function upgradeModalForCountry(country: string | null): boolean {
  return country !== EGYPT_COUNTRY;
}
