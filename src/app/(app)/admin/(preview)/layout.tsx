import type { ReactNode } from "react";

import { KeyboardViewport } from "@/components/app/keyboard-viewport";
import { LearnerProviders } from "@/components/app/learner-providers";

/**
 * The frame of the admin previews — a draft lesson, a draft book section, a
 * draft word group. A preview is the LEARNER's screen shown to an admin, so it
 * gets the learner's frame and nothing of the admin console: no navigation
 * bar above it, and the same context a learner runs in (the colours, fonts and
 * sounds an admin tuned, the pronunciation speed and Shift replay), which a
 * preview inside the console never had. The access check is the one in
 * admin/layout.tsx, above this.
 *
 * `asGuest`: nothing here is tied to the admin's own account. Each preview
 * already skips every write; this also keeps it from knowing who is looking,
 * as it never did inside the console.
 */
export default function AdminPreviewLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <KeyboardViewport />
      <LearnerProviders asGuest>
        <div className="lesson-shell bg-background text-foreground min-h-svh w-full">
          {children}
        </div>
      </LearnerProviders>
    </>
  );
}
