import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Shared by both marketing root layouts' /privacy pages (see
 * src/app/(default)/privacy/page.tsx and src/app/[locale]/privacy/page.tsx)
 * so their rendered output can never silently drift apart. No `locale` prop
 * — this page's own body text is hardcoded English regardless of locale (it
 * always has been; there's no translated content to select between), and
 * SiteHeader/SiteFooter read locale from the LocaleProvider context
 * themselves rather than a prop.
 */
export function PrivacyPageContent() {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16 sm:py-24">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
        <p className="text-muted-foreground mt-2">
          SentenceStep&apos;s full privacy policy is still being written. Here&apos;s what&apos;s
          true about your data today:
        </p>
        <ul className="text-muted-foreground mt-6 flex flex-col gap-3 text-sm">
          <li>
            If you use SentenceStep without an account, your lesson progress and streak are stored
            only in your browser (localStorage) — SentenceStep&apos;s servers never see them.
          </li>
          <li>
            If you create an account, your email and learning progress are stored securely with
            Supabase, our database and authentication provider.
          </li>
          <li>SentenceStep does not sell your data or share it with advertisers.</li>
          <li>
            SentenceStep does not process payments yet — no card or billing information is
            collected.
          </li>
        </ul>
        <p className="text-muted-foreground mt-6 text-sm">
          This page will be replaced with a complete policy before SentenceStep handles payments.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
