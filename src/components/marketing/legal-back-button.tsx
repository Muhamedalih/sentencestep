"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Whether the browser has an earlier page of THIS site to go back to.
 * `navigation.canGoBack` only counts entries of the same site, so a visitor
 * who arrived from a search result or a shared link isn't sent out of the
 * site; browsers without it fall back to the length of the history.
 */
function canGoBackInSite(): boolean {
  const navigation = (window as Window & { navigation?: { canGoBack?: boolean } }).navigation;
  return typeof navigation?.canGoBack === "boolean"
    ? navigation.canGoBack
    : window.history.length > 1;
}

/**
 * The only control on the Terms and Privacy pages. It is a real link to
 * `fallbackHref` (so it works before the page has hydrated and for a visitor
 * who opened the page directly), and goes back to the page the visitor came
 * from — usually the payment page or the sign-up form — when there is one.
 */
export function LegalBackButton({ label, fallbackHref }: { label: string; fallbackHref: string }) {
  const router = useRouter();

  function goBack(event: MouseEvent<HTMLAnchorElement>) {
    // Leave "open in a new tab" and the like to the browser.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    if (!canGoBackInSite()) return;
    event.preventDefault();
    router.back();
  }

  return (
    <Button asChild variant="ghost" size="sm">
      <Link href={fallbackHref} onClick={goBack} prefetch={false}>
        <ArrowLeft className="rtl:rotate-180" aria-hidden="true" />
        {label}
      </Link>
    </Button>
  );
}
