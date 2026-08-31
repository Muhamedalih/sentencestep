"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";

/**
 * Root error boundary — catches unhandled exceptions from any Server
 * Component/Server Action in the tree that isn't itself wrapped in a more
 * specific error.tsx. Client Component per the Next.js App Router contract.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-24 text-center sm:py-32">
      <div className="bg-brand-muted text-primary flex size-14 items-center justify-center rounded-full">
        <TriangleAlert className="size-7" aria-hidden="true" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{t.errors.globalHeading}</h1>
      <p className="text-muted-foreground max-w-sm">{t.errors.globalBody}</p>
      <Button className="mt-2" onClick={reset}>
        {t.common.tryAgain}
      </Button>
    </div>
  );
}
