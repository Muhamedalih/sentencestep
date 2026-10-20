"use client";

import { useCallback, useEffect, useRef } from "react";

import { VISIT_BEAT_MS } from "@/lib/billing/binance/visits";
import type { VisitAction } from "@/lib/billing/binance/visits";

const VISIT_URL = "/api/payments/binance/visit";

interface VisitState {
  /** Null until the server has opened the visit (and for good if it could not). */
  id: string | null;
  /** Seconds the page has been in front of the learner, finished stretches only. */
  visibleMs: number;
  /** When the current in-front stretch began, or null while the page is in the background. */
  shownSince: number | null;
  leaves: number;
  actions: Set<VisitAction>;
}

/**
 * Tells the server what a learner does on the Binance Pay payment page, for the
 * admin's view of each order: the instructions appeared (a visit is opened), the
 * page is still in front of the learner (a short report every 30 seconds, only
 * while it IS in front of them), they went to another app or tab, and which
 * things they copied. The last report is sent as the page goes to the background
 * or is closed, with sendBeacon, which the browser finishes even then.
 *
 * Telemetry only: every failure is swallowed, nothing is shown, and the payment
 * page does not depend on any of it. Returns `report`, for the page to say that
 * the learner copied something or opened the guide.
 */
export function useBinanceVisit(reference: string): { report: (action: VisitAction) => void } {
  const state = useRef<VisitState>({
    id: null,
    visibleMs: 0,
    shownSince: null,
    leaves: 0,
    actions: new Set(),
  });
  const flushRef = useRef<(options?: { final?: boolean }) => void>(() => {});

  useEffect(() => {
    const current = state.current;
    current.id = null;
    current.visibleMs = 0;
    current.leaves = 0;
    current.actions = new Set();
    current.shownSince = document.visibilityState === "visible" ? Date.now() : null;
    let cancelled = false;

    const visibleSeconds = () =>
      Math.round(
        (current.visibleMs + (current.shownSince === null ? 0 : Date.now() - current.shownSince)) /
          1000,
      );

    const send = (body: Record<string, unknown>, final: boolean) => {
      const payload = JSON.stringify(body);
      try {
        if (final && typeof navigator.sendBeacon === "function") {
          if (navigator.sendBeacon(VISIT_URL, new Blob([payload], { type: "application/json" }))) {
            return null;
          }
        }
        return fetch(VISIT_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          credentials: "same-origin",
          keepalive: true,
        });
      } catch {
        return null;
      }
    };

    const flush = (options: { final?: boolean } = {}) => {
      if (current.id === null) return;
      send(
        {
          visitId: current.id,
          visibleSeconds: visibleSeconds(),
          leaves: current.leaves,
          actions: [...current.actions],
        },
        options.final === true,
      );
    };
    flushRef.current = flush;

    // Open the visit. A failure (signed out, over the limit, server down) just means this visit is not recorded.
    let timeZone: string | undefined;
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      timeZone = undefined;
    }
    const opening = send({ reference, timeZone, language: navigator.language }, false);
    if (opening) {
      opening
        .then((response) => (response.ok ? response.json() : null))
        .then((data: { visitId?: unknown } | null) => {
          if (cancelled || typeof data?.visitId !== "string") return;
          current.id = data.visitId;
          // Whatever happened while the visit was being opened goes now.
          if (current.actions.size > 0 || current.leaves > 0) flush();
        })
        .catch(() => {});
    }

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (current.shownSince !== null) {
          current.visibleMs += Date.now() - current.shownSince;
          current.shownSince = null;
          current.leaves += 1;
        }
        flush({ final: true });
      } else if (current.shownSince === null) {
        current.shownSince = Date.now();
        flush();
      }
    };
    const onPageHide = () => flush({ final: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") flush();
    }, VISIT_BEAT_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      // The instructions left the screen (the transfer arrived, or the learner navigated on).
      flush({ final: true });
      flushRef.current = () => {};
    };
  }, [reference]);

  const report = useCallback((action: VisitAction) => {
    if (state.current.actions.has(action)) return;
    state.current.actions.add(action);
    flushRef.current();
  }, []);

  return { report };
}
