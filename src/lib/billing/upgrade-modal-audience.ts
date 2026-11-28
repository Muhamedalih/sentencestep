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

/**
 * An admin looking at the site as someone in Egypt: "now" is what Egyptians get today (no pop-up),
 * "popup" is the pop-up they got before it was switched off for them.
 */
export type EgyptView = "now" | "popup";

export function parseEgyptView(value: string | null | undefined): EgyptView | null {
  return value === "now" || value === "popup" ? value : null;
}

/** The same rule as upgradeModalForCountry, with an admin's Egypt view on top of it. */
export function upgradeModalForViewer(country: string | null, view: EgyptView | null): boolean {
  return view === "popup" || upgradeModalForCountry(country);
}
