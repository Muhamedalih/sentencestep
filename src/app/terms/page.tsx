import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "Terms",
};

/** See src/app/page.tsx's identical export for the full reasoning — same edge-compatible render path (SiteHeader), same zero-behavior-change tradeoff. */
export const runtime = "edge";

export default function TermsPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 sm:py-24">
        <h1 className="text-3xl font-semibold tracking-tight">Terms</h1>
        <p className="text-muted-foreground mt-2">
          SentenceStep&apos;s full terms of service are still being written. Here&apos;s what&apos;s
          true today:
        </p>
        <ul className="text-muted-foreground mt-6 flex flex-col gap-3 text-sm">
          <li>
            SentenceStep is an English-typing practice product, currently in active development.
          </li>
          <li>
            Free lessons are available without an account; creating an account lets your progress
            follow you across devices.
          </li>
          <li>
            Premium subscriptions and payment processing are not yet available — nothing on this
            site charges you.
          </li>
          <li>Features and content may change as SentenceStep continues to develop.</li>
        </ul>
        <p className="text-muted-foreground mt-6 text-sm">
          This page will be replaced with complete terms before SentenceStep handles payments.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
