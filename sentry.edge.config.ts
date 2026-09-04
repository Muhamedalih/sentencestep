import * as Sentry from "@sentry/nextjs";

/** Edge-runtime half of sentry.client.config.ts (middleware.ts runs here) — see that file's doc comment for the full reasoning. */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === "production",
});
