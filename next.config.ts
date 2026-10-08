import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

/**
 * Netlify sets NETLIFY=true inside its build container. There, `next build`
 * skips the type-check and ESLint pass it normally runs after compiling:
 * .github/workflows/ci.yml already runs exactly `tsc --noEmit` and `eslint .`
 * (plus the tests) on every pull request and every push to master, so doing
 * the same work again inside the deploy only costs build time and memory —
 * measured on this app at about 1.2 GB less peak memory and about 30 seconds
 * faster per cold build. A local `next build` still runs both checks.
 */
const isNetlifyBuild = process.env.NETLIFY === "true";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: isNetlifyBuild },
  eslint: { ignoreDuringBuilds: isNetlifyBuild },
  // Server Actions' encryption key needs no config field here — Next.js
  // reads process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY directly at build
  // time (see node_modules/next/dist/server/app-render/encryption-utils-server.js)
  // and uses it verbatim when set, generating a random one only when it's
  // missing. That env var is set on Netlify (Production) — see the doc
  // comment on why this matters below, at NEXT_SERVER_ACTIONS_ENCRYPTION_KEY's
  // usage note.
  //
  // Without a stable key, each separate Netlify build generates its own
  // random one — a page whose HTML was served from an older deploy (a
  // browser tab left open, or a CDN edge node that hasn't finished
  // propagating the newest deploy yet) then encodes its Server Action IDs
  // under a key the CURRENT deploy's function no longer recognizes, so
  // submitting that action 404s with no useful error. Confirmed as the
  // actual cause of a real incident on 2026-09-09: several rapid
  // consecutive deploys in under an hour left admin pages' Server Actions
  // (e.g. the Cartesia voice preview button) 404ing even right after a hard
  // refresh, because the page had been fetched from a not-yet-repropagated
  // edge node. A stable key (set once, never rotated on an ordinary deploy)
  // makes every deploy's action IDs mutually compatible, so this class of
  // failure can't recur just from deploying normally.
  // msedge-tts (src/lib/voice/providers/edge-tts.ts) opens a raw WebSocket
  // via `ws` (through `isomorphic-ws`), and webpack's server bundle silently
  // swaps in browser-oriented shims for `ws`'s own dependencies (its
  // `stream-browserify`/`buffer` deps are a giveaway of what it expects a
  // browser bundler to do here) — the resulting "connection" never
  // actually opens a real TCP/TLS socket, so every synthesize() call hangs
  // until its own timeout instead of throwing. Confirmed by reproducing
  // this route's exact code both as a plain `node script.mjs` (succeeds in
  // under 2s, every time) and through this dev server's own webpack-bundled
  // route handler (hangs for the full 20s timeout, every time) — identical
  // code, only the bundling differs. Excluding it here makes Next load it
  // via real Node require() at runtime instead, using the real `ws`/`net`
  // implementation.
  //
  // undici (src/lib/supabase/server-fetch-with-timeout.ts's connection-
  // pooling Agent, used only by server.ts/service-role.ts — never
  // public-client.ts, see that file's own doc comment for why) hits the
  // same class of problem from a different angle: webpack doesn't just
  // mis-shim it, it refuses to bundle it at all — its dispatcher/client
  // internals import real Node builtins (`node:assert` among them) in a way
  // webpack's own bundling has no plugin for, which failed the build
  // outright ("UnhandledSchemeError: Reading from 'node:assert' is not
  // handled by plugins") the moment anything that imports it got pulled
  // into a webpack-bundled chunk — server-side included, not just the
  // client. Same fix, same reasoning: load it via real Node require() at
  // runtime instead.
  serverExternalPackages: ["msedge-tts", "undici"],
  experimental: {
    // Next 15 defaults the client Router Cache's staleTime for dynamic
    // routes to 0 — every client-side navigation between /learn/* sections
    // re-runs the full server round trip even for a page the same visitor
    // already loaded seconds ago, which is what made switching between
    // sections (word-lists, saved, settings, library, lessons) feel slow. 30s
    // lets a repeat soft-navigation within that window reuse the already-
    // fetched RSC payload instead. This is a per-browser-tab, in-memory
    // cache only — never shared across users/devices, and every hard reload,
    // new tab, or elapsed window still hits the server fresh, so it can't
    // leak one learner's content to another. The one real risk (a learner or
    // admin seeing an up-to-30s-stale lesson list after a content edit) is
    // closed by content-actions.ts's saveLesson/archiveLesson/restoreLesson/
    // bulkUpdateLessonStatus all calling revalidatePath on the affected
    // mode's /learn/[mode] list — see those call sites.
    staleTimes: { dynamic: 30 },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Typing-sound recordings (public/sounds/typing) never change once
        // shipped under a given name, and every learner session fetches the
        // same handful — cache them in the browser instead of revalidating.
        source: "/sounds/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

/**
 * Source maps are generated (and uploaded to Sentry) only when an upload is
 * actually set up: SENTRY_AUTH_TOKEN present AND SENTRY_UPLOAD_SOURCEMAPS=true.
 *
 * withSentryConfig is NOT a no-op without a token, as this comment used to
 * claim: on every production build it forces full source maps for the server
 * bundle (devtool "source-map") and the client bundle ("hidden-source-map")
 * even when nothing will ever be uploaded, because the plugin only decides
 * whether to upload later. Measured cold on this app: with the maps a production
 * build peaked at about 6 GB of total memory, needed more than 1.5 GB of Node
 * heap and died with "JavaScript heap out of memory" (exit 134) at 1.5 GB — the
 * failure Netlify's build container hit on 8 October 2026 — while the same
 * build with the maps off (and, on Netlify, the checks above skipped) passes
 * with a 1 GB heap and peaks at about 2.5 GB. The .next output is also about
 * 600 MB smaller without them.
 *
 * Turn upload on deliberately (readable stack traces in Sentry) by setting
 * both variables; that build needs roughly 2 GB of heap or more (see
 * .env.example). Without a token, silent also avoids CLI log spam.
 */
const uploadSourceMaps =
  Boolean(process.env.SENTRY_AUTH_TOKEN) && process.env.SENTRY_UPLOAD_SOURCEMAPS === "true";

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  sourcemaps: { disable: !uploadSourceMaps },
  widenClientFileUpload: true,
  // This app has no /monitoring-style route naming collision to worry
  // about, so the default tunnel route Sentry would otherwise add is
  // unnecessary — kept off to avoid one more always-present route.
  tunnelRoute: false,
});
