"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * The one error boundary above src/app/error.tsx: if the root layout itself
 * throws (not just a page inside it), error.tsx never even mounts — Next's
 * App Router contract requires this file to render its own <html>/<body>
 * since the real root layout has failed. Deliberately minimal, hardcoded
 * English/no design system: nothing this component depends on (locale
 * context, CSS tokens, the site's own font) can be trusted to still work
 * when the thing that renders them is what just crashed.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1.5rem", textAlign: "center" }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ color: "#666", marginTop: "0.5rem" }}>Please refresh the page and try again.</p>
      </body>
    </html>
  );
}
