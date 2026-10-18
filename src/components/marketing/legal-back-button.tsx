"use client";

import { BackButton } from "@/components/layout/back-button";

/**
 * The only control on the Terms and Privacy pages: the site's quiet back
 * control (see BackButton), a real link to `fallbackHref` that goes back to
 * the page the visitor came from — usually the payment page or the sign-up
 * form — when there is one.
 */
export function LegalBackButton({ label, fallbackHref }: { label: string; fallbackHref: string }) {
  return <BackButton label={label} fallbackHref={fallbackHref} />;
}
