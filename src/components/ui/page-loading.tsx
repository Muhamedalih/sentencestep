"use client";

import { Loader2 } from "lucide-react";
import { useReducedMotion } from "framer-motion";

import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Route-level loading state for Server Components awaiting a Supabase
 * fetch — used as the default export of a segment's loading.tsx, which
 * Next.js renders as an instant Suspense fallback while the page's data
 * resolves, instead of leaving the browser on a blank/frozen previous page.
 */
export function PageLoading() {
  const reducedMotion = useReducedMotion();
  const { t } = useLocale();

  return (
    <div className="flex min-h-[40vh] items-center justify-center py-24" role="status">
      <Loader2
        className={cn("text-muted-foreground size-8", !reducedMotion && "animate-spin")}
        aria-hidden="true"
      />
      <span className="sr-only">{t.common.loading}</span>
    </div>
  );
}
