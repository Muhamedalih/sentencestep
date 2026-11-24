"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { UpgradeModal, startUpgradeModalLoad } from "@/components/billing/upgrade-modal";
import type { UpgradeModalRequest } from "@/components/billing/upgrade-modal";
import { useFeatures } from "@/components/providers/feature-provider";
import { safeLessonPath } from "@/lib/billing/after-payment";
import type { UpgradeModalData } from "@/lib/billing/upgrade-modal-actions";

/** A locked card carries the lesson page it stands for in this attribute (see the lock cards of the lists). */
export const UPGRADE_NEXT_ATTRIBUTE = "data-upgrade-next";
/** ...and its title in this one, which the pop-up shows at the top («you pressed: …»). */
export const UPGRADE_TITLE_ATTRIBUTE = "data-upgrade-title";

/** A link to the plans page that must stay a plain link (a payment report, a preview of the in-app strip). */
function keepsPage(url: URL): boolean {
  return url.searchParams.has("method") || url.searchParams.has("in_app_strip");
}

/** What a press on `target` would open: a locked card, or a link to the plans page; null for anything else. */
function requestFor(target: Element | null): UpgradeModalRequest | null {
  if (!target || target.closest("[data-no-upgrade-modal]")) return null;

  // A locked card: the lesson page it stands for travels along, so paying can lead back to it.
  const lock = target.closest<HTMLElement>(`[${UPGRADE_NEXT_ATTRIBUTE}]`);
  if (lock) {
    const next = safeLessonPath(lock.getAttribute(UPGRADE_NEXT_ATTRIBUTE));
    const anchor = lock instanceof HTMLAnchorElement ? lock : lock.closest("a");
    if (next) {
      const title = lock.getAttribute(UPGRADE_TITLE_ATTRIBUTE)?.trim() || null;
      return {
        search: "",
        next,
        title: title ? title.slice(0, 120) : null,
        fallbackHref: anchor?.getAttribute("href") ?? next,
      };
    }
  }

  // A link to the plans page.
  const anchor = target.closest<HTMLAnchorElement>("a[href]");
  if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin || url.pathname !== "/upgrade" || keepsPage(url)) {
    return null;
  }
  return {
    search: url.search,
    next: null,
    title: null,
    fallbackHref: `${url.pathname}${url.search}`,
  };
}

/** How long a read started by a press stays usable by the click that follows it. */
const PREFETCH_MS = 15_000;

/**
 * Opens the upgrade pop-up (permission upgradeModal) over the screen the learner is on, when they press
 * a locked card or any link to the plans page inside the learning area. It listens once, on the
 * document, so no lock card or button has to be changed to know about it; a plain press with the
 * mouse or a finger is taken, while a press with Ctrl, Cmd, Shift or the middle button, a link that
 * opens in a new tab, and a link marked data-no-upgrade-modal keep working as a normal link. While the
 * permission is closed for the visitor it listens to nothing, and a link is just a link.
 *
 * The pop-up's figures are read by one server action. With a mouse the read starts when the button
 * goes down, a moment before the click ends, so it is already on its way when the pop-up opens. A
 * finger does not do this: a finger that lands on a card is often about to scroll, and that would
 * read for nothing.
 */
export function UpgradeModalHost() {
  const open = useFeatures().rollouts.upgradeModal;
  const [opened, setOpened] = useState<{
    request: UpgradeModalRequest;
    data: Promise<UpgradeModalData | null>;
  } | null>(null);
  const openRef = useRef(false);
  openRef.current = opened !== null;
  const close = useCallback(() => setOpened(null), []);
  const prefetched = useRef<{
    key: string;
    at: number;
    data: Promise<UpgradeModalData | null>;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    const keyOf = (request: UpgradeModalRequest) => `${request.search}|${request.next ?? ""}`;
    const plain = (event: MouseEvent | PointerEvent) =>
      event.button === 0 && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey);

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !plain(event) || openRef.current) return;
      const request = requestFor(event.target instanceof Element ? event.target : null);
      if (!request) return;
      prefetched.current = {
        key: keyOf(request),
        at: Date.now(),
        data: startUpgradeModalLoad(request),
      };
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || openRef.current || !plain(event)) return;
      const request = requestFor(event.target instanceof Element ? event.target : null);
      if (!request) return;
      event.preventDefault();
      event.stopPropagation();
      const ready = prefetched.current;
      prefetched.current = null;
      const data =
        ready && ready.key === keyOf(request) && Date.now() - ready.at < PREFETCH_MS
          ? ready.data
          : startUpgradeModalLoad(request);
      setOpened({ request, data });
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [open]);

  if (!open || !opened) return null;
  return <UpgradeModal request={opened.request} dataPromise={opened.data} onClose={close} />;
}
