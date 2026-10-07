import { SiteHeaderClient } from "@/components/layout/site-header-client";
import { FREE_ACCESS } from "@/lib/billing/types";

/**
 * Deliberately does NOT call getCurrentUser()/getAccessState() (both read
 * the Supabase session cookie) — this component is only ever used by the
 * static marketing home page ("/" and its /ar, /es, /tr variants; see
 * src/components/marketing/home-page-content.tsx), and any
 * cookies()/headers() call anywhere in a page's render tree forces the
 * WHOLE route dynamic, which is exactly what that page exists to avoid (see
 * src/app/(default)/layout.tsx's doc comment).
 *
 * This is a pure no-op for "/": src/middleware.ts's handleRootRoute already
 * redirects every authenticated visitor away before this ever renders, so
 * `user` was always effectively null here regardless. (The Terms and
 * Privacy pages used to render this header too; they are now plain
 * documents with only a Back button.)
 */
export function SiteHeader() {
  return <SiteHeaderClient user={null} access={FREE_ACCESS} />;
}
