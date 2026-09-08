"use client";

import { RouteErrorContent } from "@/components/layout/route-error-content";

/** Root error boundary for the unprefixed marketing route group — see src/components/layout/route-error-content.tsx's doc comment. */
export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorContent {...props} />;
}
