import type { captureRequestError } from "@sentry/nextjs";

/**
 * Next.js's own instrumentation hook (stable since Next 14, unrelated to
 * "use server"/actions) — the one place both the Node and Edge runtimes
 * call before anything else, which is why Sentry's setup lives here rather
 * than being imported directly from somewhere in src/. See
 * sentry.client.config.ts's doc comment for why this integration exists.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/** Reports a rendering/routing error Next.js itself caught (nested route segment errors, not caught by any error.tsx) — the one error class Sentry's client/server SDK init above can't see on its own. */
export const onRequestError: typeof captureRequestError = async (...args) => {
  const Sentry = await import("@sentry/nextjs");
  return Sentry.captureRequestError(...args);
};
