"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 4_000;
const MAX_REFRESHES = 15;

/**
 * Re-renders the /billing/return page every few seconds while a payment is
 * still being confirmed, so the learner sees the result without reloading.
 * Stops after about a minute; from then on the reconcile job settles the
 * order and the page's own text tells the learner not to pay again.
 */
export function PaymentStatusRefresh() {
  const router = useRouter();

  useEffect(() => {
    let refreshes = 0;
    const timer = setInterval(() => {
      refreshes += 1;
      router.refresh();
      if (refreshes >= MAX_REFRESHES) clearInterval(timer);
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router]);

  return null;
}
