import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
  serverExternalPackages: ["msedge-tts"],
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

// Wraps the config to upload source maps and inject Sentry's build-time
// tooling — a no-op wrapper (returns nextConfig essentially unchanged) when
// SENTRY_AUTH_TOKEN isn't set, so a deployment that hasn't configured
// Sentry at all still builds exactly as before. silent avoids CLI log spam
// on every build for the common case (no token) where there's nothing
// useful to upload anyway.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  // This app has no /monitoring-style route naming collision to worry
  // about, so the default tunnel route Sentry would otherwise add is
  // unnecessary — kept off to avoid one more always-present route.
  tunnelRoute: false,
});
