import type { Metadata } from "next";

import { FeaturesForm } from "@/components/admin/features-form";
import { NotConfiguredNotice } from "@/components/admin/not-configured-notice";
import { getFeatureConfig } from "@/lib/features/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Features",
};

// Admin settings must always reflect the live row, never a build-time cache.
export const dynamic = "force-dynamic";

export default async function AdminFeaturesPage() {
  if (!isSupabaseConfigured()) return <NotConfiguredNotice />;

  const config = await getFeatureConfig();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Features</h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          Turn the engagement features on or off, preview them as an admin before launch, restrict
          them to Premium, and choose which sections each one appears in. Everything starts Off.
          Changes take effect for learners as soon as you save.
        </p>
      </div>
      <FeaturesForm initial={config} />
    </div>
  );
}
