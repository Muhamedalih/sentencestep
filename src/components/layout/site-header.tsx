import { SiteHeaderClient } from "@/components/layout/site-header-client";
import { getAccessState } from "@/lib/billing/access";
import { getCurrentUser } from "@/lib/supabase/auth";

export async function SiteHeader() {
  const [user, access] = await Promise.all([getCurrentUser(), getAccessState()]);
  return <SiteHeaderClient user={user} access={access} />;
}
