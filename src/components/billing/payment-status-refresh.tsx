"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 4_000;
const MAX_REFRESHES = 15;

/**
 * Re-renders a payment page every few seconds while a payment is still being
 * confirmed, so the learner sees the result without reloading. Stops after about
 * a minute; from then on the reconcile job settles the order and the page's own
 * text tells the learner not to pay again. The Binance Pay page waits for a
 * transfer the learner has yet to make, so it asks for a slower, longer one.
 */
export function PaymentStatusRefresh({
  intervalMs = REFRESH_INTERVAL_MS,
  maxRefreshes = MAX_REFRESHES,
}: {
  intervalMs?: number;
  maxRefreshes?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    let refreshes = 0;
    const timer = setInterval(() => {
      refreshes += 1;
      router.refresh();
      if (refreshes >= maxRefreshes) clearInterval(timer);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [router, intervalMs, maxRefreshes]);

  return null;
}
