import { createClient } from "@/lib/supabase/server";

export interface EnabledLocaleOption {
  code: string;
  displayName: string;
  nativeName: string;
}

/**
 * Enabled locales for the "Generate translation" control's target-locale
 * dropdown (see translation-field.tsx) — read from the locales table added
 * in the lifecycle-foundation migration, not the hardcoded SUPPORT_LOCALES
 * union. This is what lets a newly-enabled locale (Turkish, eventually)
 * show up here with no code change, only a data change.
 */
export async function listEnabledLocales(): Promise<EnabledLocaleOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locales")
    .select("code, display_name, native_name")
    .eq("enabled", true)
    .order("code");
  if (error) throw error;

  return (data ?? []).map((row) => ({
    code: row.code,
    displayName: row.display_name,
    nativeName: row.native_name,
  }));
}
