# syntax=docker/dockerfile:1.7
#
# Production image for the self-hosted server (see deploy/README.md). Netlify does
# not use this file: its own build ignores it.
#
# Built by .github/workflows/deploy-vps.yml, never on the server itself — a
# `next build` of this app peaks around 2.5 GB of memory, which would compete with
# the running site on a small machine.
#
#   docker buildx build \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=... (see the ARGs below) \
#     --build-arg GIT_COMMIT_SHA=$(git rev-parse HEAD) \
#     --secret id=server_actions_key,env=NEXT_SERVER_ACTIONS_ENCRYPTION_KEY \
#     -t sentencestep:$(git rev-parse HEAD) .

ARG NODE_VERSION=24

# ---- 1. dependencies -------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
# sharp is what next/image uses to resize pictures on a Node server (Netlify does
# this in its own Image CDN instead). Installed here, deliberately NOT in
# package.json, so Netlify's build and bundle are untouched; Next picks it up
# automatically and the standalone trace below copies it into the runtime image.
RUN npm install --no-save --no-audit --no-fund sharp

# ---- 2. build ----------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_OUTPUT=standalone \
    SKIP_BUILD_CHECKS=1 \
    NODE_OPTIONS=--max-old-space-size=3072

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Public values only: Next.js inlines NEXT_PUBLIC_* into the browser bundle at
# build time, so they must exist here. None of these is a secret (they are the
# same values every visitor's browser receives). Server-side secrets are never
# passed to the build — they live only in the server's own env file.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY

# The Server Actions encryption key must be the same at build time and at run
# time (a different key makes every open page's actions fail). It is a secret, so
# it is mounted for this one command only — it never lands in an image layer.
RUN --mount=type=secret,id=server_actions_key \
    NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$(cat /run/secrets/server_actions_key)" \
    npm run build

# ---- 3. runtime ------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app

ARG GIT_COMMIT_SHA=unknown
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    GIT_COMMIT_SHA=$GIT_COMMIT_SHA

RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --home-dir /app nextjs

# The standalone server already contains the minimal node_modules it traced
# (including msedge-tts, undici and sharp). Static assets and public files are not
# part of the trace, so they are copied beside it.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# next/image and ISR write here at run time.
RUN mkdir -p .next/cache && chown -R nextjs:nodejs .next/cache

USER nextjs
EXPOSE 3000

# Liveness only (no database): see src/app/api/health/route.ts.
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
