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
// The SDK is large (about a third of every page's JavaScript), so it is fetched
// in the background instead of being part of the first load: the download
// starts immediately, it just no longer blocks the page. Only when a DSN is
// set and only in production, which is exactly when init() did anything.
// An error thrown in the first moments, before the SDK arrives, is not
// reported; route error boundaries report through the same lazy import.
const sentry: Promise<typeof import("@sentry/nextjs")> | null =
  process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SENTRY_DSN
    ? import("@sentry/nextjs").then((Sentry) => {
        Sentry.init({
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          // A modest sample rate rather than 1.0 — this app has no paid Sentry
          // quota to spend on full performance-trace volume; error reporting
          // (always on, unsampled) is the actual point of this integration.
          tracesSampleRate: 0.1,
          // Session Replay is off by default: it captures real learner sessions,
          // which needs an explicit privacy-and-cost decision this integration
          // doesn't make on its own. Enable deliberately later if wanted.
        });
        return Sentry;
      })
    : null;

/** Lets Sentry's performance tracing follow client-side route changes (App Router navigations), not just full page loads — Sentry's own required export for this SDK version. */
export const onRouterTransitionStart = (
  url: string,
  navigationType: "push" | "replace" | "traverse",
) => {
  void sentry?.then((Sentry) => Sentry.captureRouterTransitionStart(url, navigationType));
};
