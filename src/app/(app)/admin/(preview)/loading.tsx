import { Loader2 } from "lucide-react";

/**
 * While a preview's data loads: just a quiet spinner on the learner's own
 * background — the admin console's skeleton (admin/(console)/loading.tsx) is
 * shaped like admin pages and would be wrong here.
 */
export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center" aria-busy="true">
      <Loader2 className="text-muted-foreground size-6 animate-spin" aria-hidden="true" />
    </div>
  );
}
