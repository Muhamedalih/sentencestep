"use client";

import { RouteErrorContent } from "@/components/layout/route-error-content";

/** Root error boundary — catches unhandled exceptions from any Server Component/Server Action in this route group's tree that isn't itself wrapped in a more specific error.tsx. */
export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorContent {...props} />;
}
