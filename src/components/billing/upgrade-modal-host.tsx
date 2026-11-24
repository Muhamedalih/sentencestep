"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { UpgradeModal } from "@/components/billing/upgrade-modal";
import type { UpgradeModalRequest } from "@/components/billing/upgrade-modal";
import { useFeatures } from "@/components/providers/feature-provider";
import { safeLessonPath } from "@/lib/billing/after-payment";

/** A locked card carries the lesson page it stands for in this attribute (see the lock cards of the lists). */
export const UPGRADE_NEXT_ATTRIBUTE = "data-upgrade-next";

/** A link to the plans page that must stay a plain link (a payment report, a preview of the in-app strip). */
function keepsPage(url: URL): boolean {
  return url.searchParams.has("method") || url.searchParams.has("in_app_strip");
}

/**
 * Opens the upgrade pop-up (permission upgradeModal) over the screen the learner is on, when they press
 * a locked card or any link to the plans page inside the learning area. It listens once, on the
 * document, so no lock card or button has to be changed to know about it; a plain press with the
 * mouse or a finger is taken, while a press with Ctrl, Cmd, Shift or the middle button, a link that
 * opens in a new tab, and a link marked data-no-upgrade-modal keep working as a normal link. While the
 * permission is closed for the visitor it listens to nothing, and a link is just a link.
 */
export function UpgradeModalHost() {
  const open = useFeatures().rollouts.upgradeModal;
  const [request, setRequest] = useState<UpgradeModalRequest | null>(null);
  const openRef = useRef(false);
  openRef.current = request !== null;
  const close = useCallback(() => setRequest(null), []);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || openRef.current) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target || target.closest("[data-no-upgrade-modal]")) return;

      // A locked card: the lesson page it stands for travels along, so paying can lead back to it.
      const lock = target.closest<HTMLElement>(`[${UPGRADE_NEXT_ATTRIBUTE}]`);
      if (lock) {
        const next = safeLessonPath(lock.getAttribute(UPGRADE_NEXT_ATTRIBUTE));
        const anchor = lock instanceof HTMLAnchorElement ? lock : lock.closest("a");
        if (next) {
          event.preventDefault();
          event.stopPropagation();
          setRequest({ search: "", next, fallbackHref: anchor?.getAttribute("href") ?? next });
          return;
        }
      }

      // A link to the plans page.
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        (anchor.target && anchor.target !== "_self") ||
        anchor.hasAttribute("download")
      ) {
        return;
      }
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin || url.pathname !== "/upgrade" || keepsPage(url)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setRequest({
        search: url.search,
        next: null,
        fallbackHref: `${url.pathname}${url.search}`,
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [open]);

  if (!open || !request) return null;
  return <UpgradeModal request={request} onClose={close} />;
}
