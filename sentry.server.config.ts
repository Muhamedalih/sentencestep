import * as Sentry from "@sentry/nextjs";

/** Server-runtime half of sentry.client.config.ts — see that file's doc comment for the full reasoning. Catches Server Component/Server Action/route-handler errors that never reach a browser at all. */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === "production",
});
