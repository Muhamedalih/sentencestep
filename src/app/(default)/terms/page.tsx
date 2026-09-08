import type { Metadata } from "next";

import { TermsPageContent } from "@/components/marketing/terms-page-content";

/** See src/app/(default)/page.tsx's doc comment on its own `dynamic` export for why this is explicit rather than left to auto-detection. */
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms",
};

/** The unprefixed "/terms" — statically pre-rendered (see src/app/(default)/layout.tsx). */
export default function TermsPage() {
  return <TermsPageContent />;
}
