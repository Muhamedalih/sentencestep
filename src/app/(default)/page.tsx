import { HomePageContent } from "@/components/marketing/home-page-content";

/**
 * Explicit, not left to auto-detection: this route calls no dynamic API and
 * SHOULD be statically optimized automatically, but empirically (verified
 * via `next build`'s route-table output — see this task's own notes) this
 * app's build does not auto-detect it as static once there is no longer a
 * single shared src/app/layout.tsx (see root-html-shell.tsx's doc comment
 * for why). `force-static` both fixes that and acts as a guardrail: if a
 * future change to HomePageContent (or anything it renders) ever
 * reintroduces a cookies()/headers() call, the build fails loudly here
 * instead of silently reverting to per-request dynamic rendering.
 */
export const dynamic = "force-static";

/**
 * The unprefixed "/" — statically pre-rendered at build time (see
 * src/app/(default)/layout.tsx's doc comment), always rendered with
 * `locale={null}` (the English-fallback chrome a cookie-less first-time
 * visitor already sees today). A returning visitor with a locale cookie
 * never actually reaches this file: src/middleware.ts redirects them to
 * "/{locale}" (src/app/[locale]/page.tsx) first.
 */
export default function Home() {
  return <HomePageContent locale={null} />;
}
