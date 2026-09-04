import * as Sentry from "@sentry/nextjs";

/**
 * Production error monitoring — added after an audit flagged that this app
 * had no visibility into real-user errors at all beyond console.error/server
 * logs (see src/app/error.tsx, and every catch block across the codebase
 * that already logs but has nowhere durable to send that log). Sentry's
 * free tier (5,000 errors/month, no card) is enough for this app's scale.
 *
 * A no-op entirely when NEXT_PUBLIC_SENTRY_DSN isn't set — Sentry.init with
 * `dsn: undefined` disables reporting internally rather than throwing, so
 * every deployment that hasn't configured this yet behaves exactly as
 * before (see .env.example's own doc comment for how to get a free DSN).
 */
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // A modest sample rate rather than 1.0 — this app has no paid Sentry
  // quota to spend on full performance-trace volume; error reporting
  // (always on, unsampled) is the actual point of this integration.
  tracesSampleRate: 0.1,
  // Session Replay is off by default: it captures real learner sessions,
  // which needs an explicit privacy-and-cost decision this integration
  // doesn't make on its own. Enable deliberately later if wanted.
  enabled: process.env.NODE_ENV === "production",
});

/** Lets Sentry's performance tracing follow client-side route changes (App Router navigations), not just full page loads — Sentry's own required export for this SDK version. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
