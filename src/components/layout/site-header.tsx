import { SiteHeaderClient } from "@/components/layout/site-header-client";
import { FREE_ACCESS } from "@/lib/billing/types";

/**
 * Deliberately does NOT call getCurrentUser()/getAccessState() (both read
 * the Supabase session cookie) — this component is only ever used by the
 * three static marketing pages (/, /privacy, /terms; see
 * src/components/marketing/home-page-content.tsx and
 * *-page-content.tsx), and any cookies()/headers() call anywhere in a
 * page's render tree forces the WHOLE route dynamic, which is exactly what
 * those pages exist to avoid (see src/app/(default)/layout.tsx's doc
 * comment).
 *
 * For "/" this is a pure no-op: src/middleware.ts's handleRootRoute already
 * redirects every authenticated visitor away before this ever renders, so
 * `user` was always effectively null here regardless.
 *
 * For "/privacy" and "/terms" specifically, always passing `user={null}`
 * here on its own WOULD be a real behavior regression: a signed-in learner
 * who navigates directly to one of those two pages (no in-app link does
 * this — see register-form.tsx, the only internal link to either, which is
 * itself only reachable signed-out) would see the signed-out "Sign
 * in"/"Start learning" buttons despite already being signed in. That's
 * fixed one layer down: SiteHeaderClient checks for a Supabase auth cookie
 * CLIENT-SIDE, after hydration (see its own doc comment), and swaps in a
 * generic signed-in header state if one is present — without this Server
 * Component ever reading the cookie itself, so the page stays fully static.
 */
export function SiteHeader() {
  return <SiteHeaderClient user={null} access={FREE_ACCESS} />;
}
